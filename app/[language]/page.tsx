"use client";

import React, { use, useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Keyboard,
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

const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("developer"));

// Async example
const delay = (ms) => new Promise(r => setTimeout(r, ms));
async function main() {
  await delay(10);
  console.log("Async code works too!");
}
main();`,
  },
  typescript: {
    id: "typescript", name: "TypeScript", filename: "main.ts", extension: "ts",
    color: "text-blue-400", bgAccent: "bg-blue-500/10 border-blue-500/20",
    clientSide: true,
    template: `// TypeScript — compiled in-browser via CDN
interface Developer {
  name: string;
  languages: string[];
}

const coder: Developer = {
  name: "Developer",
  languages: ["TypeScript", "JavaScript", "C"],
};

console.log(\`\${coder.name} knows: \${coder.languages.join(", ")}\`);

function add(a: number, b: number): number {
  return a + b;
}
console.log("2 + 3 =", add(2, 3));`,
  },
  python: {
    id: "python", name: "Python", filename: "main.py", extension: "py",
    color: "text-emerald-400", bgAccent: "bg-emerald-500/10 border-emerald-500/20",
    clientSide: true,
    template: `# Python 3 — powered by Pyodide (WebAssembly)
print("Hello, World!")

def fibonacci(n):
    a, b = 0, 1
    seq = []
    while len(seq) < n:
        seq.append(a)
        a, b = b, a + b
    return seq

print("Fibonacci(10):", fibonacci(10))

# List comprehension
squares = [x**2 for x in range(1, 6)]
print("Squares:", squares)`,
  },
  c: {
    id: "c", name: "C", filename: "main.c", extension: "c",
    color: "text-indigo-400", bgAccent: "bg-indigo-500/10 border-indigo-500/20",
    clientSide: false,
    template: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");

    int arr[] = {5, 2, 8, 1, 9};
    int n = 5;

    // Bubble sort
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
            }

    printf("Sorted: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}`,
  },
  cpp: {
    id: "cpp", name: "C++", filename: "main.cpp", extension: "cpp",
    color: "text-cyan-400", bgAccent: "bg-cyan-500/10 border-cyan-500/20",
    clientSide: false,
    template: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::cout << "Hello, World!" << std::endl;

    std::vector<int> v = {5, 2, 8, 1, 9};
    std::sort(v.begin(), v.end());

    std::cout << "Sorted: ";
    for (int x : v) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}`,
  },
  java: {
    id: "java", name: "Java", filename: "Main.java", extension: "java",
    color: "text-rose-400", bgAccent: "bg-rose-500/10 border-rose-500/20",
    clientSide: false,
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        String[] fruits = {"Apple", "Banana", "Cherry"};
        for (String fruit : fruits) {
            System.out.println("Fruit: " + fruit);
        }

        System.out.println("Sum 1-100: " + sumTo(100));
    }

    static int sumTo(int n) {
        return n * (n + 1) / 2;
    }
}`,
  },
  rust: {
    id: "rust", name: "Rust", filename: "main.rs", extension: "rs",
    color: "text-orange-400", bgAccent: "bg-orange-500/10 border-orange-500/20",
    clientSide: false,
    template: `fn main() {
    println!("Hello, World!");

    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);

    let squared: Vec<i32> = numbers.iter().map(|x| x * x).collect();
    println!("Squared: {:?}", squared);
}`,
  },
  go: {
    id: "go", name: "Go", filename: "main.go", extension: "go",
    color: "text-sky-400", bgAccent: "bg-sky-500/10 border-sky-500/20",
    clientSide: false,
    template: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")

    nums := []int{1, 2, 3, 4, 5}
    sum := 0
    for _, n := range nums {
        sum += n
    }
    fmt.Printf("Sum: %d\\n", sum)
}`,
  },
  ruby: {
    id: "ruby", name: "Ruby", filename: "main.rb", extension: "rb",
    color: "text-red-400", bgAccent: "bg-red-500/10 border-red-500/20",
    clientSide: false,
    template: `puts "Hello, World!"

class Animal
  def initialize(name)
    @name = name
  end

  def speak
    puts "#{@name} says hello!"
  end
end

Animal.new("Cat").speak
Animal.new("Dog").speak
puts (1..5).map { |n| n * n }.inspect`,
  },
  php: {
    id: "php", name: "PHP", filename: "main.php", extension: "php",
    color: "text-violet-400", bgAccent: "bg-violet-500/10 border-violet-500/20",
    clientSide: false,
    template: `<?php
echo "Hello, World!\\n";

$fruits = ["Apple", "Banana", "Cherry"];
foreach ($fruits as $f) {
    echo "Fruit: $f\\n";
}

function factorial(int $n): int {
    return $n <= 1 ? 1 : $n * factorial($n - 1);
}
echo "5! = " . factorial(5) . "\\n";`,
  },
};

// ─── JS execution in async-safe sandbox ───────────────────────────────────

async function runJSAsync(code: string, stdin: string = ""): Promise<string> {
  const outputs: string[] = [];
  const stdinLines = stdin.split("\n");
  let stdinIndex = 0;

  const capture = (type: string) => (...args: any[]) => {
    const line = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
      .join(" ");
    outputs.push(type === "log" ? line : `[${type.toUpperCase()}] ${line}`);
  };

  const origLog   = console.log;
  const origError = console.error;
  const origWarn  = console.warn;
  const origInfo  = console.info;
  const origPrompt = window.prompt;

  console.log   = capture("log");
  console.error = capture("error");
  console.warn  = capture("warn");
  console.info  = capture("info");

  window.prompt = (msg) => {
    outputs.push(`[Prompt: ${msg || ""}]`);
    const val = stdinIndex < stdinLines.length ? stdinLines[stdinIndex++] : "";
    outputs.push(val);
    return val;
  };

  try {
    // Wrap in async IIFE so top-level await works
    const fn = new Function(`return (async function() {\n${code}\n})();`);
    await fn();
    return outputs.join("\n") || "Code executed successfully. (No output)";
  } catch (err: any) {
    outputs.push(`Runtime Error: ${err.message}`);
    return outputs.join("\n");
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

async function runTypeScript(code: string, stdin: string = ""): Promise<string> {
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

async function runPython(code: string, stdin: string = ""): Promise<string> {
  const py = await loadPyodide();

  // Safely inject stdin via globals - avoids string escaping issues in Python source
  py.globals.set("_o2_stdin_data", stdin);

  // Simple, safe Python setup - no special chars inside string literals
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
      const prefix = partialOut ? partialOut.trimEnd() + "\n\n" : "";
      return (
        prefix +
        "Input Required\n" +
        "Your code called input() but no input was provided.\n" +
        "Open the Custom Input (stdin) panel below, type your values (one per line), then Run again."
      );
    }

    const errOut: string = py.runPython("sys.stderr.getvalue()") || "";
    return [partialOut.trimEnd(), errOut.trimEnd() || errMsg].filter(Boolean).join("\n");
  }

  const out: string = py.runPython("sys.stdout.getvalue()") || "";
  const err: string = py.runPython("sys.stderr.getvalue()") || "";
  const combined    = [err && `[stderr]\n${err.trimEnd()}`, out].filter(Boolean).join("\n");
  return combined.trim() || "Code executed successfully. (No output)";
}

// ─── Server-side compilation ───────────────────────────────────────────────

async function runServer(code: string, langKey: string, stdin: string = ""): Promise<string> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language: langKey, stdin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

  const parts: string[] = [];
  if (data.compiler_error) parts.push(`=== Compiler Error ===\n${data.compiler_error.trim()}`);
  if (data.compiler_output) parts.push(`=== Compiler Output ===\n${data.compiler_output.trim()}`);
  const progOut = data.program_output?.trim();
  const progErr = data.program_error?.trim();
  if (progOut) parts.push(progOut);
  if (progErr) parts.push(`=== Runtime Error ===\n${progErr}`);
  if (!progOut && !progErr) parts.push(`(Process exited with code ${data.status ?? 0})`);

  return parts.join("\n\n");
}

// ─── Playground UI ────────────────────────────────────────────────────────

type StatusType = "idle" | "running" | "success" | "error";

function PlaygroundContent({ language }: { language: string }) {
  const router = useRouter();
  const { theme, editorSettings } = useSettings();

  const langKey = language.toLowerCase();
  const langConfig = LANGUAGES[langKey];

  const [code, setCode]               = useState("");
  const [output, setOutput]           = useState("");
  const [status, setStatus]           = useState<StatusType>("idle");
  const [copied, setCopied]           = useState(false);
  const [stdin, setStdin]             = useState("");
  const [stdinOpen, setStdinOpen]     = useState(true);

  const isDark = theme === "dark";

  // Redirect unknown languages
  useEffect(() => {
    if (!langConfig) { router.push("/"); return; }
    const saved = localStorage.getItem(`code-${langKey}`);
    setCode(saved ?? langConfig.template);
    setOutput("");
    setStatus("idle");
    setStdin("");
    setStdinOpen(false);
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
    setStdin("");
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

  const handleRun = useCallback(async () => {
    if (!code.trim() || status === "running") return;
    setStatus("running");
    setOutput("Running...\n");

    try {
      let result = "";
      if (langKey === "javascript") {
        result = await runJSAsync(code, stdin);
      } else if (langKey === "typescript") {
        setOutput("Compiling TypeScript...\n");
        result = await runTypeScript(code, stdin);
      } else if (langKey === "python") {
        setOutput("Loading Python runtime (first run may take ~30 seconds)...\n");
        result = await runPython(code, stdin);
      } else {
        setOutput("Connecting to compiler server...\n");
        result = await runServer(code, langKey, stdin);
      }
      setOutput(result);
      // Auto-open stdin panel if result indicates missing input
      const needsInput = result.includes("__NEEDS_STDIN__") || result.includes("Custom Input (stdin)") || 
        result.includes("EOFError") || result.includes("EOF");
      if (needsInput) {
        setStdinOpen(true);
        setStatus("error");
      } else {
        setStatus(result.toLowerCase().includes("error") ? "error" : "success");
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message || String(err)}`);
      setStatus("error");
    }
  }, [code, langKey, status, stdin]);

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
    <div className={`flex min-h-screen ${isDark ? "bg-[#0d1117] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      <SidebarNav />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Top toolbar ─────────────────────────────────────────────── */}
        <header className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${
          isDark ? "bg-[#161b22] border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Left: back + lang badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Link>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${langConfig.bgAccent}`}>
              <span className={langConfig.color}>●</span>
              <span className={`${isDark ? "text-slate-200" : "text-slate-700"}`}>{langConfig.name}</span>
              <span className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>{langConfig.filename}</span>
            </div>

            <span className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded border font-mono ${
              isDark ? "text-slate-500 border-slate-800 bg-slate-900" : "text-slate-400 border-slate-200 bg-slate-50"
            }`}>
              {langConfig.clientSide ? "Browser ✦" : "Server ☁"}
            </span>
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center gap-2">
            {status !== "idle" && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
                {StatusIcon}
                {statusText}
              </div>
            )}

            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Reset to template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              Save
            </button>

            <div className={`w-px h-5 mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

            <button
              onClick={handleRun}
              disabled={status === "running"}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Run (Ctrl+Enter)"
            >
              {status === "running"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Play className="h-4 w-4" />
              }
              {status === "running" ? "Running…" : "Run"}
            </button>
          </div>
        </header>

        {/* ── Editor + Output split ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
          <div className={`block md:hidden h-px shrink-0 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          {/* Output Terminal */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
                <button
                  onClick={() => setStdinOpen(!stdinOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors text-xs font-semibold ${
                    stdinOpen
                      ? isDark ? "bg-slate-850 text-indigo-400" : "bg-slate-200 text-indigo-600"
                      : isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-450 hover:text-slate-650 hover:bg-slate-100"
                  }`}
                  title="Configure Custom Input (stdin)"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Input</span>
                  {stdin.trim() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
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

            {/* Output content */}
            <div
              className={`flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed ${
                isDark ? "bg-[#0d1117] text-slate-300" : "bg-white text-slate-700"
              }`}
              style={{ fontFamily: "ui-monospace, 'Cascadia Code', Menlo, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {output ? (
                <div className={
                  status === "error"
                    ? "text-rose-400"
                    : status === "success"
                    ? isDark ? "text-slate-200" : "text-slate-800"
                    : isDark ? "text-slate-400" : "text-slate-500"
                }>
                  {output}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 opacity-30 select-none">
                  <Terminal className="h-10 w-10" />
                  <p className="text-sm">Press <kbd className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs font-sans">Ctrl+Enter</kbd> to run</p>
                </div>
              )}
            </div>

            {/* Collapsible Stdin Panel */}
            <div className={`border-t transition-all duration-200 shrink-0 ${
              isDark ? "border-slate-800 bg-[#161b22]" : "border-slate-200 bg-slate-50"
            }`}>
              <button
                onClick={() => setStdinOpen(!stdinOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                  isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Custom Input (stdin)</span>
                  {stdin.trim() ? (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {stdin.split('\n').filter(Boolean).length} line{stdin.split('\n').filter(Boolean).length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"
                    }`}>
                      empty
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-normal ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}>type input before clicking Run</span>
                  {stdinOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </div>
              </button>

              {stdinOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <p className={`text-[11px] ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}>
                    If your code calls <code className={`px-1 rounded ${
                      isDark ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-amber-700"
                    }`}>input()</code>, <code className={`px-1 rounded ${
                      isDark ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-amber-700"
                    }`}>scanf()</code>, or <code className={`px-1 rounded ${
                      isDark ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-amber-700"
                    }`}>readline()</code> — type the values below <strong>(one per line)</strong>, then click Run.
                  </p>
                  <textarea
                    id="stdin-textarea"
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder={`e.g.\nAlice\n25\n100 200`}
                    rows={4}
                    spellCheck={false}
                    className={`w-full p-3 text-xs font-mono rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y ${
                      isDark
                        ? "bg-[#0d1117] border-slate-700 text-slate-200 placeholder-slate-600"
                        : "bg-white border-slate-300 text-slate-800 placeholder-slate-400"
                    }`}
                  />
                  {stdin.trim() && (
                    <button
                      onClick={() => setStdin('')}
                      className={`self-end text-[10px] font-medium transition-colors ${
                        isDark ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"
                      }`}
                    >
                      Clear input
                    </button>
                  )}
                </div>
              )}
            </div>
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
