import { NextResponse } from "next/server";

interface LangConfig {
  pistonLang: string;
  pistonVersion: string;
  filename: string;
  wandboxCompiler: string;
}

const LANGUAGE_CONFIG: Record<string, LangConfig> = {
  c:    { pistonLang: "c",      pistonVersion: "10.2.0", filename: "main.c",    wandboxCompiler: "gcc-head-c" },
  cpp:  { pistonLang: "c++",    pistonVersion: "10.2.0", filename: "main.cpp",  wandboxCompiler: "gcc-head" },
  java: { pistonLang: "java",   pistonVersion: "15.0.2", filename: "Main.java", wandboxCompiler: "openjdk-jdk-22+36" },
  rust: { pistonLang: "rust",   pistonVersion: "1.68.2", filename: "main.rs",   wandboxCompiler: "rust-1.82.0" },
  go:   { pistonLang: "go",     pistonVersion: "1.16.2", filename: "main.go",   wandboxCompiler: "go-1.23.2" },
  ruby: { pistonLang: "ruby",   pistonVersion: "3.0.1",  filename: "main.rb",   wandboxCompiler: "ruby-3.4.9" },
  php:  { pistonLang: "php",    pistonVersion: "8.2.3",  filename: "main.php",  wandboxCompiler: "php-8.3.12" },
};

async function runWithPaiza(code: string, lang: string, stdin: string = "") {
  const paizaLang = lang === "cpp" ? "cpp" : lang;

  const createRes = await fetch("https://api.paiza.io/runners/create?api_key=guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: code,
      language: paizaLang,
      input: stdin,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!createRes.ok) throw new Error(`Paiza API error: HTTP ${createRes.status}`);
  const createData = await createRes.json();
  if (createData.error) throw new Error(`Paiza API error: ${createData.error}`);

  const id = createData.id;
  if (!id) throw new Error("Paiza API: Failed to get execution ID");

  const startTime = Date.now();
  const timeoutMs = 25000;
  let pollInterval = 300;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval + 300, 2000);

    const detailsRes = await fetch(`https://api.paiza.io/runners/get_details?id=${id}&api_key=guest`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!detailsRes.ok) throw new Error(`Paiza API details error: HTTP ${detailsRes.status}`);

    const detailsData = await detailsRes.json();
    if (detailsData.status === "completed") {
      return {
        status: detailsData.exit_code ?? (detailsData.build_stderr ? 1 : 0),
        program_output: detailsData.stdout || "",
        program_error: detailsData.stderr || "",
        compiler_output: detailsData.build_stdout || "",
        compiler_error: detailsData.build_stderr || "",
      };
    }
  }

  throw new Error("Compilation/Execution timed out on the compiler server.");
}

export async function POST(request: Request) {
  try {
    const { code, language, stdin = "" } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const lang = (language || "").toLowerCase();
    if (!LANGUAGE_CONFIG[lang]) {
      return NextResponse.json(
        { error: `Language '${language}' is not supported for server-side compilation.` },
        { status: 400 }
      );
    }

    let processedCode = code;
    if (lang === "java") {
      processedCode = code.replace(/\bpublic\s+class\b/g, "class");
    } else if (lang === "cpp") {
      // Make C++ std::cin throw an exception on EOF to terminate the process immediately
      processedCode = code.replace(
        /int\s+main\s*\([^)]*\)\s*\{/,
        `$& std::cin.exceptions(std::ios_base::failbit | std::ios_base::badbit);`
      );
    } else if (lang === "c") {
      // Redefine C standard input functions to exit on EOF to terminate the process immediately
      processedCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <stdarg.h>\nstatic inline int o2_scanf(const char *format, ...) { va_list args; va_start(args, format); int res = vscanf(format, args); va_end(args); if (res == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\nstatic inline char* o2_fgets(char *str, int n, FILE *stream) { char *res = fgets(str, n, stream); if (res == NULL) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\nstatic inline int o2_getchar(void) { int res = getchar(); if (res == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\n#define scanf o2_scanf\n#define fgets o2_fgets\n#define getchar o2_getchar\n` + code;
    } else if (lang === "rust") {
      // Make Rust read_line calls panic on EOF to terminate the process immediately
      processedCode = code.replace(
        /\.read_line\s*\(\s*&mut\s+([a-zA-Z0-9_]+)\s*\)/g,
        `.read_line(&mut $1).map(|n| if n == 0 { panic!("EOF"); } else { n })`
      );
    } else if (lang === "go") {
      // Shadow the fmt.Scan calls with our panic-on-error helpers first (avoiding helper recursion)
      processedCode = code.replace(/\bfmt\.Scanln\s*\(/g, "o2_scanln(");
      processedCode = processedCode.replace(/\bfmt\.Scanf\s*\(/g, "o2_scanf(");
      processedCode = processedCode.replace(/\bfmt\.Scan\s*\(/g, "o2_scan(");
      // Append the helpers (which still call standard fmt scan functions internally)
      processedCode = processedCode + `\nfunc o2_scanln(a ...interface{}) (int, error) { n, err := fmt.Scanln(a...); if err != nil { panic(err) }; return n, err }\nfunc o2_scan(a ...interface{}) (int, error) { n, err := fmt.Scan(a...); if err != nil { panic(err) }; return n, err }\nfunc o2_scanf(f string, a ...interface{}) (int, error) { n, err := fmt.Scanf(f, a...); if err != nil { panic(err) }; return n, err }\n`;
    } else if (lang === "ruby") {
      // Redefine Ruby Kernel.gets to raise EOFError on EOF to terminate the process immediately
      processedCode = `def gets(*args)\n  val = super(*args)\n  raise EOFError, "EOF" if val.nil?\n  val\nend\n` + code;
    } else if (lang === "php") {
      // Shadow PHP input functions to trigger E_USER_ERROR on EOF first (avoiding helper recursion)
      processedCode = code.replace(/\breadline\s*\(/g, "o2_readline(");
      processedCode = processedCode.replace(/\bfgets\s*\(/g, "o2_fgets(");
      // Prepend PHP input function definitions
      processedCode = processedCode.replace(
        /<\?php/,
        `<?php\nfunction o2_readline($prompt = null) { $val = readline($prompt); if ($val === false) { trigger_error("EOF", E_USER_ERROR); } return $val; }\nfunction o2_fgets($stream) { $val = fgets($stream); if ($val === false) { trigger_error("EOF", E_USER_ERROR); } return $val; }`
      );
    }

    const result = await runWithPaiza(processedCode, lang, stdin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[compile] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile and run code." },
      { status: 500 }
    );
  }
}
