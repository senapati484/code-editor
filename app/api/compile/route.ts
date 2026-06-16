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
  rust: { pistonLang: "rust",   pistonVersion: "1.50.0", filename: "main.rs",   wandboxCompiler: "rust-1.82.0" },
  go:   { pistonLang: "go",     pistonVersion: "1.16.2", filename: "main.go",   wandboxCompiler: "go-1.23.2" },
  ruby: { pistonLang: "ruby",   pistonVersion: "3.0.1",  filename: "main.rb",   wandboxCompiler: "ruby-3.4.9" },
  php:  { pistonLang: "php",    pistonVersion: "8.0.2",  filename: "main.php",  wandboxCompiler: "php-8.3.12" },
};

async function runWithPiston(code: string, lang: string, stdin: string = "") {
  const cfg = LANGUAGE_CONFIG[lang];
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: cfg.pistonLang,
      version: cfg.pistonVersion,
      files: [{ name: cfg.filename, content: code }],
      stdin: stdin,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`Piston API error: HTTP ${res.status}`);
  const data = await res.json();

  // Piston returns an error message at top level if language/version not found
  if (data.message) throw new Error(`Piston: ${data.message}`);

  return {
    status: data.run?.code ?? (data.compile?.code ?? 0),
    program_output: data.run?.stdout || "",
    program_error: data.run?.stderr || "",
    compiler_output: data.compile?.stdout || "",
    compiler_error: data.compile?.stderr || "",
  };
}

async function runWithWandbox(code: string, lang: string, stdin: string = "") {
  const cfg = LANGUAGE_CONFIG[lang];
  const res = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    body: JSON.stringify({ code, compiler: cfg.wandboxCompiler, stdin }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`Wandbox API error: HTTP ${res.status}`);
  const data = await res.json();

  return {
    status: data.status ?? 0,
    program_output: data.program_output || "",
    program_error: data.program_error || "",
    compiler_output: data.compiler_output || "",
    compiler_error: data.compiler_error || "",
  };
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
      processedCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <stdarg.h>\ninline int o2_scanf(const char *format, ...) { va_list args; va_start(args, format); int res = vscanf(format, args); va_end(args); if (res == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\ninline char* o2_fgets(char *str, int n, FILE *stream) { char *res = fgets(str, n, stream); if (res == NULL) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\ninline int o2_getchar(void) { int res = getchar(); if (res == EOF) { fprintf(stderr, "EOFError\\n"); exit(1); } return res; }\n#define scanf o2_scanf\n#define fgets o2_fgets\n#define getchar o2_getchar\n` + code;
    } else if (lang === "rust") {
      // Make Rust read_line calls panic on EOF to terminate the process immediately
      processedCode = code.replace(
        /\.read_line\s*\(\s*&mut\s+([a-zA-Z0-9_]+)\s*\)/g,
        `.read_line(&mut $1).map(|n| if n == 0 { panic!("EOF"); } else { n })`
      );
    } else if (lang === "go") {
      // Make Go scan functions panic on EOF to terminate the process immediately
      processedCode = code + `\nfunc o2_scanln(a ...interface{}) (int, error) { n, err := fmt.Scanln(a...); if err != nil { panic(err) }; return n, err }\nfunc o2_scan(a ...interface{}) (int, error) { n, err := fmt.Scan(a...); if err != nil { panic(err) }; return n, err }\nfunc o2_scanf(f string, a ...interface{}) (int, error) { n, err := fmt.Scanf(f, a...); if err != nil { panic(err) }; return n, err }\n`;
      // Shadow the fmt.Scan calls with our panic-on-error helpers
      processedCode = processedCode.replace(/\bfmt\.Scanln\s*\(/g, "o2_scanln(");
      processedCode = processedCode.replace(/\bfmt\.Scanf\s*\(/g, "o2_scanf(");
      processedCode = processedCode.replace(/\bfmt\.Scan\s*\(/g, "o2_scan(");
    } else if (lang === "ruby") {
      // Redefine Ruby Kernel.gets to raise EOFError on EOF to terminate the process immediately
      processedCode = `def gets(*args)\n  val = super(*args)\n  raise EOFError, "EOF" if val.nil?\n  val\nend\n` + code;
    } else if (lang === "php") {
      // Shadow PHP input functions to trigger E_USER_ERROR on EOF to terminate the process immediately
      processedCode = code.replace(
        /<\?php/,
        `<?php\nfunction o2_readline($prompt = null) { $val = readline($prompt); if ($val === false) { trigger_error("EOF", E_USER_ERROR); } return $val; }\nfunction o2_fgets($stream) { $val = fgets($stream); if ($val === false) { trigger_error("EOF", E_USER_ERROR); } return $val; }`
      );
      processedCode = processedCode.replace(/\breadline\s*\(/g, "o2_readline(");
      processedCode = processedCode.replace(/\bfgets\s*\(/g, "o2_fgets(");
    }

    // Try Piston first — it's faster and more reliable
    let pistonError = "";
    try {
      const result = await runWithPiston(processedCode, lang, stdin);
      return NextResponse.json(result);
    } catch (err: any) {
      pistonError = err.message;
      console.warn("[compile] Piston failed, falling back to Wandbox:", pistonError);
    }

    // Fallback to Wandbox
    try {
      const result = await runWithWandbox(processedCode, lang, stdin);
      return NextResponse.json(result);
    } catch (err: any) {
      const isInfraError =
        pistonError.includes("Resource temporarily unavailable") ||
        pistonError.includes("OCI runtime") ||
        pistonError.includes("HTTP 5");
      throw new Error(
        isInfraError
          ? "The compilation service is temporarily overloaded. Please try again in a few seconds."
          : `Both compilation services failed.\n→ Piston: ${pistonError}\n→ Wandbox: ${err.message}`
      );
    }
  } catch (error: any) {
    console.error("[compile] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile and run code." },
      { status: 500 }
    );
  }
}
