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
      throw new Error(
        `Both compilation services failed.\n→ Piston: ${pistonError}\n→ Wandbox: ${err.message}`
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
