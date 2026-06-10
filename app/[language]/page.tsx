"use client";

import React, { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import SyntaxHighlighter from "@/components/syntax-highlighter";
import {
  Play,
  RotateCcw,
  Download,
  Terminal,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

// ─── Language configs ──────────────────────────────────────────────────────

interface LangConfig {
  id: string;
  name: string;
  filename: string;
  extension: string;
  color: string;
  bgAccent: string;
  clientSide: boolean;
  template: string;
}

const LANGUAGES: Record<string, LangConfig> = {
  javascript: {
    id: "javascript", name: "JavaScript", filename: "main.js", extension: "js",
    color: "text-yellow-400", bgAccent: "bg-yellow-500/10 border-yellow-500/20",
    clientSide: true,
    template: `// JavaScript — runs directly in your browser
console.log("Hello, World!");

// Interactive standard input
const name = prompt("Enter your name: ");
console.log(\`Hello, \${name}!\\n\`);
`,
  },
  typescript: {
    id: "typescript", name: "TypeScript", filename: "main.ts", extension: "ts",
    color: "text-blue-400", bgAccent: "bg-blue-500/10 border-blue-500/20",
    clientSide: true,
    template: `// TypeScript — compiled in-browser via CDN
interface User {
  name: string;
}

console.log("Hello, World!");

// Interactive standard input
const name = prompt("Enter your name: ");
const user: User = { name };
console.log(\`Hello, \${user.name}!\\n\`);
`,
  },
  python: {
    id: "python", name: "Python", filename: "main.py", extension: "py",
    color: "text-emerald-400", bgAccent: "bg-emerald-500/10 border-emerald-500/20",
    clientSide: true,
    template: `# Python 3 — powered by Pyodide (WebAssembly)
print("Hello, World!")

# Interactive standard input
name = input("Enter your name: ")
print(f"Hello, {name}!")
`,
  },
  c: {
    id: "c", name: "C", filename: "main.c", extension: "c",
    color: "text-indigo-400", bgAccent: "bg-indigo-500/10 border-indigo-500/20",
    clientSide: false,
    template: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");

    // Interactive standard input
    char name[100];
    printf("Enter your name: ");
    fflush(stdout); // Ensure prompt is flushed to console
    scanf("%s", name);
    printf("Hello, %s!\\n", name);

    return 0;
}
`,
  },
  cpp: {
    id: "cpp", name: "C++", filename: "main.cpp", extension: "cpp",
    color: "text-cyan-400", bgAccent: "bg-cyan-500/10 border-cyan-500/20",
    clientSide: false,
    template: `#include <iostream>
#include <string>

int main() {
    std::cout << "Hello, World!" << std::endl;

    // Interactive standard input
    std::string name;
    std::cout << "Enter your name: ";
    std::cin >> name;
    std::cout << "Hello, " << name << "!" << std::endl;

    return 0;
}
`,
  },
  java: {
    id: "java", name: "Java", filename: "Main.java", extension: "java",
    color: "text-rose-400", bgAccent: "bg-rose-500/10 border-rose-500/20",
    clientSide: false,
    template: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // Interactive standard input
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        scanner.close();
    }
}
`,
  },
  rust: {
    id: "rust", name: "Rust", filename: "main.rs", extension: "rs",
    color: "text-orange-400", bgAccent: "bg-orange-500/10 border-orange-500/20",
    clientSide: false,
    template: `use std::io::{self, Write};

fn main() {
    println!("Hello, World!");

    // Interactive standard input
    print!("Enter your name: ");
    io::stdout().flush().unwrap();
    
    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    let name = name.trim();
    
    println!("Hello, {}!", name);
}
`,
  },
  go: {
    id: "go", name: "Go", filename: "main.go", extension: "go",
    color: "text-sky-400", bgAccent: "bg-sky-500/10 border-sky-500/20",
    clientSide: false,
    template: `package main

import (
    "fmt"
)

func main() {
    fmt.Println("Hello, World!")

    // Interactive standard input
    var name string
    fmt.Print("Enter your name: ")
    fmt.Scanln(&name)
    fmt.Printf("Hello, %s!\\n", name)
}
`,
  },
  ruby: {
    id: "ruby", name: "Ruby", filename: "main.rb", extension: "rb",
    color: "text-red-400", bgAccent: "bg-red-500/10 border-red-500/20",
    clientSide: false,
    template: `puts "Hello, World!"

# Interactive standard input
print "Enter your name: "
name = gets.chomp
puts "Hello, #{name}!"
`,
  },
  php: {
    id: "php", name: "PHP", filename: "main.php", extension: "php",
    color: "text-violet-400", bgAccent: "bg-violet-500/10 border-violet-500/20",
    clientSide: false,
    template: `<?php
echo "Hello, World!\\n";

// Interactive standard input
echo "Enter your name: ";
$name = readline();
echo "Hello, " . trim($name) . "!\\n";
`,
  },
};

// ─── Interactive terminal marker ───────────────────────────────────────────
// Used as a sentinel: output before this marker is shown, then input box appears
const NEEDS_INPUT_MARKER = "\x00NEEDS_INPUT\x00";

interface ExecutionResult {
  stdout: string;
  stderr: string;
  compilerError?: string;
  hasMarker?: boolean;
  status?: number;
}

// ─── JS execution in async-safe sandbox ───────────────────────────────────

async function runJSAsync(code: string, stdin: string = ""): Promise<ExecutionResult> {
  const outputs: string[] = [];
  const stdinLines = stdin ? stdin.split("\n") : [];
  let stdinIndex = 0;
  const EOF_SIG = "__O2_STDIN_EOF__";

  const capture = (type: string) => (...args: any[]) => {
    const line = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
      .join(" ");
    outputs.push(type === "log" ? line : `[${type.toUpperCase()}] ${line}`);
  };

  const origLog    = console.log;
  const origError  = console.error;
  const origWarn   = console.warn;
  const origInfo   = console.info;
  const origPrompt = window.prompt;

  console.log   = capture("log");
  console.error = capture("error");
  console.warn  = capture("warn");
  console.info  = capture("info");

  // Mock prompt() for interactive stdin
  window.prompt = (msg) => {
    if (msg) outputs.push(String(msg));  // Show prompt text in output
    if (stdinIndex < stdinLines.length) {
      return stdinLines[stdinIndex++];
    }
    // Signal that we need more input — throw to stop JS execution cleanly
    const e = new Error(EOF_SIG);
    (e as any).__isEOF = true;
    throw e;
  };

  try {
    const fn = new Function(`return (async function() {\n${code}\n})();`);
    await fn();
    return {
      stdout: outputs.join("\n") || "Code executed successfully. (No output)",
      stderr: "",
      hasMarker: false,
    };
  } catch (err: any) {
    if ((err as any).__isEOF === true) {
      return {
        stdout: outputs.join("\n"),
        stderr: "",
        hasMarker: true,
      };
    }
    return {
      stdout: outputs.join("\n"),
      stderr: `Runtime Error: ${err.message}`,
      hasMarker: false,
    };
  } finally {
    console.log   = origLog;
    console.error = origError;
    console.warn  = origWarn;
    console.info  = origInfo;
    window.prompt = origPrompt;
  }
}

// ─── TypeScript compilation via CDN ────────────────────────────────────────

let tsInstance: any = null;
let tsLoading: Promise<any> | null = null;

async function loadTS(): Promise<any> {
  if (tsInstance) return tsInstance;
  if (tsLoading)   return tsLoading;

  tsLoading = new Promise<any>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js";
    s.onload = () => { tsInstance = (window as any).ts; tsLoading = null; resolve(tsInstance); };
    s.onerror = () => { tsLoading = null; reject(new Error("Failed to load TypeScript compiler")); };
    document.head.appendChild(s);
  });
  return tsLoading;
}

async function runTypeScript(code: string, stdin: string = ""): Promise<ExecutionResult> {
  const ts = await loadTS();
  const js = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      strict: false,
    },
  }).outputText;
  return runJSAsync(js, stdin);
}

// ─── Python via Pyodide ────────────────────────────────────────────────────

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;

async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading)  return pyodideLoading;

  pyodideLoading = new Promise<any>((resolve, reject) => {
    if ((window as any).loadPyodide) {
      (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" })
        .then((p: any) => { pyodideInstance = p; pyodideLoading = null; resolve(p); })
        .catch((e: any) => { pyodideLoading = null; reject(e); });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    s.onload = () => {
      (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" })
        .then((p: any) => { pyodideInstance = p; pyodideLoading = null; resolve(p); })
        .catch((e: any) => { pyodideLoading = null; reject(e); });
    };
    s.onerror = () => { pyodideLoading = null; reject(new Error("Failed to load Pyodide")); };
    document.head.appendChild(s);
  });
  return pyodideLoading;
}

async function runPython(code: string, stdin: string = ""): Promise<ExecutionResult> {
  const py = await loadPyodide();

  // Pass stdin via globals — avoids ALL string-escaping issues
  py.globals.set("_o2_stdin_data", stdin);

  py.runPython([
    "import sys, builtins",
    "from io import StringIO",
    "sys.stdout = StringIO()",
    "sys.stderr = StringIO()",
    "sys.stdin  = StringIO(_o2_stdin_data)",
    "def custom_input(prompt=''):",
    "    if prompt: sys.stdout.write(str(prompt))",
    "    line = sys.stdin.readline()",
    "    if not line: raise EOFError('__NEEDS_STDIN__')",
    "    return line.rstrip('\\r\\n')",
    "builtins.input = custom_input",
  ].join("\n"));

  try {
    py.runPython(code);
  } catch (e: any) {
    const partialOut: string = py.runPython("sys.stdout.getvalue()") || "";
    const errMsg: string     = e.message || String(e);

    if (errMsg.includes("__NEEDS_STDIN__")) {
      return {
        stdout: partialOut,
        stderr: "",
        hasMarker: true,
      };
    }

    const errOut: string = py.runPython("sys.stderr.getvalue()") || "";
    return {
      stdout: partialOut,
      stderr: errOut || errMsg,
      hasMarker: false,
    };
  }

  const out: string = py.runPython("sys.stdout.getvalue()") || "";
  const err: string = py.runPython("sys.stderr.getvalue()") || "";
  return {
    stdout: out,
    stderr: err,
    hasMarker: false,
  };
}

// ─── Server-side compilation ───────────────────────────────────────────────

async function runServer(code: string, langKey: string, stdin: string = ""): Promise<ExecutionResult> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language: langKey, stdin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

  const compilerErrorParts = [];
  if (data.compiler_error) compilerErrorParts.push(data.compiler_error.trim());
  if (data.compiler_output) compilerErrorParts.push(data.compiler_output.trim());

  return {
    stdout: data.program_output || "",
    stderr: data.program_error || "",
    compilerError: compilerErrorParts.join("\n\n"),
    status: data.status,
  };
}
// ─── Input detection helpers ────────────────────────────────────────────────
const hasInputCalls = (code: string, langKey: string): boolean => {
  const codeClean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ""); // strip comments
  if (langKey === "python") {
    return /\binput\s*\(/.test(codeClean);
  }
  if (langKey === "javascript" || langKey === "typescript") {
    return /\bprompt\s*\(|\breadline\s*\(/.test(codeClean);
  }
  if (langKey === "c" || langKey === "cpp") {
    return /\bscanf\s*\(|std::cin\b|\bcin\b|\bgetline\s*\(|\bgetchar\s*\(|\bfgets\s*\(/.test(codeClean);
  }
  if (langKey === "java") {
    return /\bScanner\b|\.nextLine\s*\(|\.next\s*\(|\.read\s*\(|\.readLine\s*\(/.test(codeClean);
  }
  if (langKey === "rust") {
    return /\.read_line\b|\bstdin\s*\(/.test(codeClean);
  }
  if (langKey === "go") {
    return /\bScan\b|\bScanf\b|\bScanln\b/.test(codeClean);
  }
  if (langKey === "ruby") {
    return /\bgets\b|\breadline\b/.test(codeClean);
  }
  if (langKey === "php") {
    return /\breadline\b|\bfgets\s*\(\s*STDIN/.test(codeClean);
  }
  return false;
};

const endsWithPrompt = (output: string): boolean => {
  if (!output) return false;
  // A prompt usually ends with a colon, question mark, or arrow/greater-than, possibly followed by spaces, and does NOT end with a newline
  const trimmed = output.trimEnd();
  if (trimmed.length === 0) return false;
  
  // If it ends with a newline, it's probably not waiting for input inline
  if (output.endsWith("\n")) return false;
  
  // Check if it ends with common prompt characters: ':', '?', '>', '$'
  const lastChar = trimmed[trimmed.length - 1];
  return lastChar === ":" || lastChar === "?" || lastChar === ">" || lastChar === "$";
};

// ─── Playground UI ────────────────────────────────────────────────────────

type StatusType = "idle" | "running" | "success" | "error";

function PlaygroundContent({ language }: { language: string }) {
  const router = useRouter();
  const { theme, editorSettings } = useSettings();

  const langKey = language.toLowerCase();
  const langConfig = LANGUAGES[langKey];

  const [code, setCode]                         = useState("");
  const [output, setOutput]                     = useState("");
  const [status, setStatus]                     = useState<StatusType>("idle");
  const [copied, setCopied]                     = useState(false);
  // Interactive terminal state
  const [interactiveMode, setInteractiveMode]   = useState(false);
  const [interactiveInput, setInteractiveInput] = useState("");
  const [collectedInputs, setCollectedInputs]   = useState<string[]>([]);
  const [lastRawOutput, setLastRawOutput]       = useState("");
  const [activeTab, setActiveTab]               = useState<"editor" | "output">("editor");
  const interactiveInputRef = useRef<HTMLInputElement>(null);
  const outputEndRef        = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  // Auto-scroll output to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, interactiveMode]);

  // Auto-focus interactive input when it appears
  useEffect(() => {
    if (interactiveMode) {
      setTimeout(() => interactiveInputRef.current?.focus(), 30);
    }
  }, [interactiveMode]);

  // Reset state when language changes
  useEffect(() => {
    if (!langConfig) { router.push("/"); return; }
    const saved = localStorage.getItem(`code-${langKey}`);
    setCode(saved ?? langConfig.template);
    setOutput("");
    setStatus("idle");
    setInteractiveMode(false);
    setInteractiveInput("");
    setCollectedInputs([]);
    setLastRawOutput("");
  }, [langKey]); // eslint-disable-line

  const saveCode = (c: string) => {
    setCode(c);
    localStorage.setItem(`code-${langKey}`, c);
  };

  const handleReset = () => {
    if (!langConfig) return;
    if (!confirm(`Reset ${langConfig.filename} to the default template?`)) return;
    saveCode(langConfig.template);
    setOutput("");
    setStatus("idle");
    setInteractiveMode(false);
    setInteractiveInput("");
    setCollectedInputs([]);
    setLastRawOutput("");
  };

  const handleDownload = () => {
    if (!langConfig) return;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = langConfig.filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Core execution: run code with the accumulated list of inputs
  const executeWithInputs = useCallback(async (inputs: string[]) => {
    const stdinStr = inputs.length > 0 ? inputs.join("\n") + "\n" : "";
    try {
      let runRes: ExecutionResult;
      if (langKey === "javascript") {
        runRes = await runJSAsync(code, stdinStr);
      } else if (langKey === "typescript") {
        runRes = await runTypeScript(code, stdinStr);
      } else if (langKey === "python") {
        runRes = await runPython(code, stdinStr);
      } else {
        runRes = await runServer(code, langKey, stdinStr);
      }

      // Determine if interactiveMode should be active
      const isClientSideInput = !!runRes.hasMarker;
      const isServerSideInput = !LANGUAGES[langKey]?.clientSide && hasInputCalls(code, langKey) && endsWithPrompt(runRes.stdout);
      const isInteractive = isClientSideInput || isServerSideInput;

      // Reconstruct rawResult to print
      let rawResult = "";
      if (isInteractive) {
        // Suppress compile/runtime errors while waiting for more inputs
        rawResult = runRes.stdout;
      } else {
        const parts: string[] = [];
        if (runRes.compilerError) parts.push(runRes.compilerError);
        if (runRes.stdout) parts.push(runRes.stdout);
        if (runRes.stderr) {
          parts.push(`=== Runtime Error ===\n${runRes.stderr}`);
        }
        if (!runRes.compilerError && !runRes.stderr && !runRes.stdout) {
          if (runRes.status !== undefined && runRes.status !== 0) {
            parts.push(`(Process exited with code ${runRes.status})`);
          } else {
            parts.push("Code executed successfully. (No output)");
          }
        }
        rawResult = parts.join("\n\n");
      }

      // Reconstruct the output with prefix-matching to keep user's echoed inputs
      if (inputs.length === 0) {
        setOutput(rawResult);
        setLastRawOutput(rawResult);
      } else {
        if (rawResult.startsWith(lastRawOutput)) {
          const diff = rawResult.substring(lastRawOutput.length);
          setOutput(prev => prev + diff);
          setLastRawOutput(rawResult);
        } else {
          setOutput(rawResult);
          setLastRawOutput(rawResult);
        }
      }

      if (isInteractive) {
        setInteractiveMode(true);
      } else {
        setInteractiveMode(false);
        setStatus(rawResult.toLowerCase().includes("error") ? "error" : "success");
      }
    } catch (err: any) {
      setInteractiveMode(false);
      setOutput(`Error: ${err.message || String(err)}`);
      setStatus("error");
    }
  }, [code, langKey, lastRawOutput]);

  const handleRun = useCallback(async () => {
    if (!code.trim() || status === "running") return;
    setStatus("running");
    setActiveTab("output");
    setInteractiveMode(false);
    setInteractiveInput("");
    setCollectedInputs([]);
    setLastRawOutput("");
    if (langKey === "python") {
      setOutput("Loading Python runtime (first run may take ~30s)...\n");
    } else if (langKey === "typescript") {
      setOutput("Compiling TypeScript...\n");
    } else if (!LANGUAGES[langKey]?.clientSide) {
      setOutput("Connecting to compiler...\n");
    } else {
      setOutput("");
    }
    await executeWithInputs([]);
  }, [code, langKey, status, executeWithInputs]);

  // Called when user presses Enter in the inline terminal input
  const handleSubmitInput = useCallback(async () => {
    const value = interactiveInput;
    const newInputs = [...collectedInputs, value];
    // Append the typed input to output (echo like a real terminal)
    setOutput(prev => prev + value + "\n");
    setInteractiveInput("");
    setInteractiveMode(false);
    setCollectedInputs(newInputs);
    setStatus("running");
    await executeWithInputs(newInputs);
  }, [interactiveInput, collectedInputs, executeWithInputs]);

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  if (!langConfig) return null;

  const statusColor = {
    idle: "text-slate-400",
    running: "text-blue-400",
    success: "text-emerald-400",
    error: "text-rose-400",
  }[status];

  const StatusIcon = {
    idle: null,
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />,
    success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
  }[status];

  const statusText = {
    idle: "",
    running: "Running…",
    success: "Completed",
    error: "Error",
  }[status];

  return (
    <div className={`flex w-full max-w-full overflow-x-hidden min-h-screen ${isDark ? "bg-[#0d1117] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">

        {/* ── Top toolbar ─────────────────────────────────────────────── */}
        <header className={`flex items-center justify-between px-3 md:px-4 py-2 border-b shrink-0 ${
          isDark ? "bg-[#161b22] border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Left: back + lang badge */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link
              href="/"
              className={`flex items-center gap-1 text-xs font-medium px-1.5 md:px-2 py-1 rounded-md transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Back</span>
            </Link>

            <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-xs font-bold border ${langConfig.bgAccent}`}>
              <span className={langConfig.color}>●</span>
              <span className={`${isDark ? "text-slate-200" : "text-slate-700"}`}>{langConfig.name}</span>
              <span className={`hidden sm:inline ${isDark ? "text-slate-500" : "text-slate-400"}`}>{langConfig.filename}</span>
            </div>

            <span className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded border font-mono ${
              isDark ? "text-slate-500 border-slate-800 bg-slate-900" : "text-slate-400 border-slate-200 bg-slate-50"
            }`}>
              {langConfig.clientSide ? "Browser ✦" : "Server ☁"}
            </span>
          </div>

          {/* Center/Right: Mobile Tab Switcher */}
          <div className="flex md:hidden items-center border rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "editor"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "output"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Output
            </button>
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {status !== "idle" && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
                {StatusIcon}
                {statusText}
              </div>
            )}

            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Reset to template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <div className={`hidden sm:block w-px h-5 mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

            <button
              onClick={handleRun}
              disabled={status === "running"}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Run (Ctrl+Enter)"
            >
              {status === "running"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Play className="h-3.5 w-3.5" />
              }
              <span className="hidden xs:inline">{status === "running" ? "Running…" : "Run"}</span>
              <span className="inline xs:hidden">{status === "running" ? "…" : "Run"}</span>
            </button>
          </div>
        </header>

        {/* ── Editor + Output split ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Code Editor */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "editor" ? "flex" : "hidden md:flex"}`}>
            <div className={`flex items-center px-4 py-1.5 text-[11px] font-mono border-b shrink-0 ${
              isDark ? "bg-[#161b22] border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              <span className={langConfig.color}>◆</span>
              <span className="ml-1.5">{langConfig.filename}</span>
            </div>
            <div className="flex-1 overflow-hidden p-0">
              <SyntaxHighlighter
                code={code}
                language={langKey}
                onChange={saveCode}
                fontSize={editorSettings.fontSize}
                lineNumbers={editorSettings.lineNumbers}
                wordWrap={editorSettings.wordWrap}
                theme={theme}
                className="h-full rounded-none border-0"
              />
            </div>
          </div>

          {/* Divider */}
          <div className={`hidden md:block w-px shrink-0 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          {/* Output Terminal */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "output" ? "flex" : "hidden md:flex"}`}>
            {/* Output header */}
            <div className={`flex items-center justify-between px-4 py-1.5 border-b shrink-0 ${
              isDark ? "bg-[#161b22] border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-1.5">
                <Terminal className={`h-3.5 w-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <span className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Output
                </span>
                {status === "running" && (
                  <span className="flex items-center gap-1 ml-1 text-[10px] text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                    Running
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {interactiveMode && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Waiting for input
                  </span>
                )}
                <button
                  onClick={handleCopyOutput}
                  disabled={!output || status === "running"}
                  className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                    isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Copy output"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { setOutput(""); setStatus("idle"); }}
                  disabled={!output}
                  className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                    isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Clear output"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Output / Interactive Terminal */}
            <div
              className={`flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed cursor-text ${
                isDark ? "bg-[#0d1117] text-slate-300" : "bg-white text-slate-700"
              }`}
              style={{ fontFamily: "ui-monospace, 'Cascadia Code', Menlo, monospace", wordBreak: "break-word" }}
              onClick={() => interactiveInputRef.current?.focus()}
            >
              {!output && !interactiveMode ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 opacity-30 select-none">
                  <Terminal className="h-10 w-10" />
                  <p className="text-sm">Press <kbd className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs font-sans">Ctrl+Enter</kbd> to run</p>
                </div>
              ) : (
                <div
                  className={
                    status === "error" && !interactiveMode
                      ? "text-rose-400"
                      : isDark ? "text-slate-200" : "text-slate-800"
                  }
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {output}
                  {/* Inline interactive input — appears right after last output char */}
                  {interactiveMode && (
                    <span style={{ whiteSpace: "pre" }}>
                      <input
                        ref={interactiveInputRef}
                        type="text"
                        value={interactiveInput}
                        onChange={e => setInteractiveInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") { e.preventDefault(); handleSubmitInput(); }
                          if (e.key === "c" && e.ctrlKey) {
                            setInteractiveMode(false);
                            setStatus("error");
                            setOutput(prev => prev + "^C\n");
                          }
                        }}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        className={`bg-transparent border-none outline-none font-mono text-sm ${
                          isDark ? "text-emerald-400 caret-emerald-400" : "text-emerald-700 caret-emerald-700"
                        }`}
                        style={{
                          width: `${Math.max((interactiveInput.length + 2) * 0.6, 1)}em`,
                          minWidth: "2ch",
                        }}
                      />
                      <span
                        className={`inline-block w-[0.55em] h-[1em] align-middle animate-pulse ${
                          isDark ? "bg-emerald-400" : "bg-emerald-600"
                        }`}
                        style={{ marginLeft: "-2px", verticalAlign: "text-bottom" }}
                      />
                    </span>
                  )}
                </div>
              )}
              <div ref={outputEndRef} />
            </div>

            {/* Interactive hint bar — only shown when waiting for input */}
            {interactiveMode && (
              <div className={`border-t px-4 py-2 flex items-center gap-2 shrink-0 ${
                isDark
                  ? "border-emerald-900/60 bg-emerald-950/30"
                  : "border-emerald-200 bg-emerald-50"
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className={`text-[11px] font-medium ${
                  isDark ? "text-emerald-400" : "text-emerald-700"
                }`}>
                  Your program is waiting for input — type above and press <kbd className={`px-1 py-0.5 rounded text-[10px] font-sans ${
                    isDark ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-800"
                  }`}>Enter</kbd>
                </span>
                <button
                  onClick={() => {
                    setInteractiveMode(false);
                    setStatus("error");
                    setOutput(prev => prev + "\n[Terminated]");
                  }}
                  className={`ml-auto text-[10px] font-medium transition-colors ${
                    isDark ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"
                  }`}
                >
                  Kill
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function LanguagePlayground({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = use(params);
  return <PlaygroundContent language={language} />;
}
