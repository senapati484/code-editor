import { NextResponse } from "next/server";

// Allow the serverless function up to 30 seconds on Vercel (Hobby: 60s max)
export const maxDuration = 30;

// Paiza.io supports: c, cpp, java, python3, go, ruby, php, rust, swift, kotlin, scala, ...
// Language identifiers used by Paiza.io
const PAIZA_LANG: Record<string, { lang: string; filename: string }> = {
  c:    { lang: "c",    filename: "main.c" },
  cpp:  { lang: "cpp",  filename: "main.cpp" },
  java: { lang: "java", filename: "Main.java" },
  rust: { lang: "rust", filename: "main.rs" },
  go:   { lang: "go",   filename: "main.go" },
  ruby: { lang: "ruby", filename: "main.rb" },
  php:  { lang: "php",  filename: "main.php" },
};

async function runWithPaiza(code: string, lang: string, stdin: string = "") {
  const cfg = PAIZA_LANG[lang];
  if (!cfg) throw new Error(`Language '${lang}' not supported`);

  // Step 1: Create runner
  const createRes = await fetch("https://api.paiza.io/runners/create?api_key=guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: code,
      language: cfg.lang,
      input: stdin,
      longpoll: true,           // Ask Paiza to block until done (up to longpoll_timeout)
      longpoll_timeout: 20,    // Wait up to 20s in the create call
    }),
    signal: AbortSignal.timeout(25000), // 25s fetch timeout for create
  });

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => createRes.status.toString());
    throw new Error(`Paiza create error: HTTP ${createRes.status} — ${text}`);
  }
  const createData = await createRes.json();
  if (createData.error) throw new Error(`Paiza API error: ${createData.error}`);

  const id: string = createData.id;
  if (!id) throw new Error("Paiza API: Failed to get execution ID");

  // If longpoll returned completed status immediately, use it
  if (createData.status === "completed") {
    return buildResult(createData);
  }

  // Step 2: Poll for result (we have remaining time since maxDuration=30s)
  const deadline = Date.now() + 8000; // poll for up to 8 more seconds
  let interval = 400;

  while (Date.now() < deadline) {
    await sleep(interval);
    interval = Math.min(interval + 300, 1500);

    const detailsRes = await fetch(
      `https://api.paiza.io/runners/get_details?id=${id}&api_key=guest`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!detailsRes.ok) continue; // transient error — try again

    const data = await detailsRes.json();
    if (data.status === "completed") {
      return buildResult(data);
    }
  }

  throw new Error(
    "Compilation timed out. The guest compiler is busy — please try again in a moment."
  );
}

function buildResult(data: any) {
  const exitCode = parseInt(data.exit_code ?? data.build_exit_code ?? "0", 10);
  // Paiza sets build_result="success" even when there are warnings.
  // Only surface build_stderr as compiler errors when the build actually failed.
  const buildFailed = data.build_result === "failure";
  return {
    status:          exitCode,
    program_output:  data.stdout        || "",
    program_error:   data.stderr        || "",
    compiler_output: data.build_stdout  || "",
    compiler_error:  buildFailed ? (data.build_stderr || "") : "",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Code pre-processing ───────────────────────────────────────────────────
// Each helper makes the program exit/panic on EOF so our interactive loop
// knows when the program is waiting for more input.

function preprocessCode(code: string, lang: string): string {
  switch (lang) {
    case "java":
      // Paiza.io requires the public class to be named "Main"
      return code.replace(/\bpublic\s+class\s+\w+/g, "public class Main");

    case "cpp":
      // Make cin throw on EOF so the process terminates quickly
      return code.replace(
        /int\s+main\s*\([^)]*\)\s*\{/,
        `$& std::cin.exceptions(std::ios_base::failbit | std::ios_base::badbit);`
      );

    case "c": {
      // Only inject the helpers for C standard input functions that the
      // user's code actually calls — avoids 'unused function' warnings.
      const usesScanf   = /\bscanf\s*\(/.test(code);
      const usesFgets   = /\bfgets\s*\(/.test(code);
      const usesGetchar = /\bgetchar\s*\(/.test(code);

      // If the code doesn't use any input functions, skip prepending entirely
      if (!usesScanf && !usesFgets && !usesGetchar) return code;

      const preamble = [
        `#include <stdio.h>`,
        `#include <stdlib.h>`,
        `#include <stdarg.h>`,
      ];

      if (usesScanf) {
        preamble.push(
          `static inline int _o2_scanf(const char *fmt, ...) {`,
          `  va_list ap; va_start(ap, fmt);`,
          `  int r = vscanf(fmt, ap); va_end(ap);`,
          `  if (r == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return r;`,
          `}`,
          `#define scanf _o2_scanf`
        );
      }
      if (usesFgets) {
        preamble.push(
          `static inline char* _o2_fgets(char *s, int n, FILE *f) {`,
          `  char *r = fgets(s, n, f);`,
          `  if (!r) { fprintf(stderr, "EOFError\\n"); exit(1); } return r;`,
          `}`,
          `#define fgets _o2_fgets`
        );
      }
      if (usesGetchar) {
        preamble.push(
          `static inline int _o2_getchar(void) {`,
          `  int c = getchar();`,
          `  if (c == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return c;`,
          `}`,
          `#define getchar _o2_getchar`
        );
      }

      return preamble.join("\n") + "\n" + code;
    }

    case "rust": {
      // Prepend a safe read_line helper that exits on EOF
      const helper =
        `use std::io::BufRead;\n` +
        `fn _o2_read_line(buf: &mut String) {\n` +
        `  let n = std::io::stdin().lock().read_line(buf).unwrap_or(0);\n` +
        `  if n == 0 { eprintln!("EOFError"); std::process::exit(1); }\n` +
        `}\n`;
      // Replace any variant of stdin().read_line(&mut var).unwrap()/.expect()
      // with a simple call to our helper (which returns nothing — unit type)
      const patched = code.replace(
        /(?:io::stdin|std::io::stdin)\(\)\.read_line\s*\(\s*&mut\s+([a-zA-Z0-9_]+)\s*\)(?:\s*\.(?:unwrap|expect)\s*\([^)]*\))?/g,
        "_o2_read_line(&mut $1)"
      );
      return helper + patched;
    }

    case "go": {
      // Replace fmt.Scan* calls with wrappers that panic on error
      // Important: do replacement BEFORE appending helpers to avoid recursion
      let out = code
        .replace(/\bfmt\.Scanln\s*\(/g, "_o2_scanln(")
        .replace(/\bfmt\.Scanf\s*\(/g,  "_o2_scanf(")
        .replace(/\bfmt\.Scan\b\s*\(/g, "_o2_scan(");
      out +=
        `\nfunc _o2_scan(a ...interface{}) (int, error) {\n` +
        `  n, err := fmt.Scan(a...)\n` +
        `  if err != nil { panic(err) }\n` +
        `  return n, err\n` +
        `}\n` +
        `func _o2_scanln(a ...interface{}) (int, error) {\n` +
        `  n, err := fmt.Scanln(a...)\n` +
        `  if err != nil { panic(err) }\n` +
        `  return n, err\n` +
        `}\n` +
        `func _o2_scanf(f string, a ...interface{}) (int, error) {\n` +
        `  n, err := fmt.Scanf(f, a...)\n` +
        `  if err != nil { panic(err) }\n` +
        `  return n, err\n` +
        `}\n`;
      return out;
    }

    case "ruby":
      // Override gets to raise EOFError on nil
      return (
        `def gets(*args)\n` +
        `  val = STDIN.gets(*args)\n` +
        `  raise EOFError, "EOF" if val.nil?\n` +
        `  val\n` +
        `end\n` +
        code
      );

    case "php": {
      // Replace readline/fgets(STDIN) with wrappers — do replacements first to avoid recursion
      let out = code
        .replace(/\breadline\s*\(/g, "_o2_readline(")
        .replace(/\bfgets\s*\(\s*STDIN/g, "_o2_fgets(STDIN");
      // Inject helpers right after <?php
      const helpers =
        `function _o2_readline($prompt = null) {\n` +
        `  $v = readline($prompt);\n` +
        `  if ($v === false) { trigger_error("EOF", E_USER_ERROR); }\n` +
        `  return $v;\n` +
        `}\n` +
        `function _o2_fgets($f) {\n` +
        `  $v = fgets($f);\n` +
        `  if ($v === false) { trigger_error("EOF", E_USER_ERROR); }\n` +
        `  return $v;\n` +
        `}\n`;
      return out.replace(/(<\?php)/, `$1\n${helpers}`);
    }

    default:
      return code;
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { code, language, stdin = "" } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const lang = (language || "").toLowerCase();
    if (!PAIZA_LANG[lang]) {
      return NextResponse.json(
        { error: `Language '${language}' is not supported for server-side compilation.` },
        { status: 400 }
      );
    }

    const processedCode = preprocessCode(code, lang);
    const result = await runWithPaiza(processedCode, lang, stdin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[compile] Error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Failed to compile and run code." },
      { status: 500 }
    );
  }
}
