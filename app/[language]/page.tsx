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
  Github,
  ChevronDown,
  Sliders,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
  brandColor: string;
}

const LANGUAGES: Record<string, LangConfig> = {
  javascript: {
    id: "javascript", name: "JavaScript", filename: "main.js", extension: "js",
    color: "text-yellow-400", bgAccent: "bg-yellow-500/10 border-yellow-500/20",
    brandColor: "#F7DF1E",
    clientSide: true,
    template: `// JavaScript on O2 code
console.log("O2 code is working for JavaScript!");
`,
  },
  typescript: {
    id: "typescript", name: "TypeScript", filename: "main.ts", extension: "ts",
    color: "text-blue-400", bgAccent: "bg-blue-500/10 border-blue-500/20",
    brandColor: "#3178C6",
    clientSide: true,
    template: `// TypeScript on O2 code
const message: string = "O2 code is working for TypeScript!";
console.log(message);
`,
  },
  python: {
    id: "python", name: "Python", filename: "main.py", extension: "py",
    color: "text-emerald-400", bgAccent: "bg-emerald-500/10 border-emerald-500/20",
    brandColor: "#3776AB",
    clientSide: true,
    template: `# Python 3 on O2 code
print("O2 code is working for Python!")
`,
  },
  c: {
    id: "c", name: "C", filename: "main.c", extension: "c",
    color: "text-indigo-400", bgAccent: "bg-indigo-500/10 border-indigo-500/20",
    brandColor: "#A8B9CC",
    clientSide: false,
    template: `#include <stdio.h>

int main() {
    printf("O2 code is working for C!\\n");
    return 0;
}
`,
  },
  cpp: {
    id: "cpp", name: "C++", filename: "main.cpp", extension: "cpp",
    color: "text-cyan-400", bgAccent: "bg-cyan-500/10 border-cyan-500/20",
    brandColor: "#00599C",
    clientSide: false,
    template: `#include <iostream>

int main() {
    std::cout << "O2 code is working for C++!" << std::endl;
    return 0;
}
`,
  },
  java: {
    id: "java", name: "Java", filename: "Main.java", extension: "java",
    color: "text-rose-400", bgAccent: "bg-rose-500/10 border-rose-500/20",
    brandColor: "#E76F51",
    clientSide: false,
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("O2 code is working for Java!");
    }
}
`,
  },
  rust: {
    id: "rust", name: "Rust", filename: "main.rs", extension: "rs",
    color: "text-orange-400", bgAccent: "bg-orange-500/10 border-orange-500/20",
    brandColor: "#E05D2B",
    clientSide: false,
    template: `fn main() {
    println!("O2 code is working for Rust!");
}
`,
  },
  go: {
    id: "go", name: "Go", filename: "main.go", extension: "go",
    color: "text-sky-400", bgAccent: "bg-sky-500/10 border-sky-500/20",
    brandColor: "#00ADD8",
    clientSide: false,
    template: `package main

import "fmt"

func main() {
    fmt.Println("O2 code is working for Go!")
}
`,
  },
  ruby: {
    id: "ruby", name: "Ruby", filename: "main.rb", extension: "rb",
    color: "text-red-400", bgAccent: "bg-red-500/10 border-red-500/20",
    brandColor: "#CC342D",
    clientSide: false,
    template: `puts "O2 code is working for Ruby!"
`,
  },
  php: {
    id: "php", name: "PHP", filename: "main.php", extension: "php",
    color: "text-violet-400", bgAccent: "bg-violet-500/10 border-violet-500/20",
    brandColor: "#777BB4",
    clientSide: false,
    template: `<?php
echo "O2 code is working for PHP!\\n";
`,
  },
  sql: {
    id: "sql", name: "SQL (SQLite)", filename: "query.sql", extension: "sql",
    color: "text-[#00758F]", bgAccent: "bg-[#00758F]/10 border-[#00758F]/20",
    brandColor: "#00758F",
    clientSide: true,
    template: `-- SQL (SQLite) on O2 code
SELECT 'O2 code is working for SQL!' AS status;
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

// ─── SQL via sql.js (WebAssembly SQLite) ───────────────────────────────────

function formatSqlResults(results: any[]): string {
  if (!results || results.length === 0) {
    return "Query executed successfully. (No rows returned)";
  }

  return results.map(result => {
    const { columns, values } = result;
    if (!columns || columns.length === 0) return "Query executed successfully.";

    // Calculate column widths
    const colWidths = columns.map((col: string) => col.length);
    values.forEach((row: any[]) => {
      row.forEach((val: any, colIdx: number) => {
        const strVal = val === null ? "NULL" : String(val);
        if (strVal.length > colWidths[colIdx]) {
          colWidths[colIdx] = strVal.length;
        }
      });
    });

    // Build horizontal divider line
    const divider = "+" + colWidths.map((w: number) => "-".repeat(w + 2)).join("+") + "+";

    // Build header row
    const headerRow = "|" + columns.map((col: string, idx: number) => {
      return " " + col.padEnd(colWidths[idx]) + " ";
    }).join("|") + "|";

    // Build value rows
    const valueRows = values.map((row: any[]) => {
      return "|" + row.map((val, idx) => {
        const strVal = val === null ? "NULL" : String(val);
        return " " + strVal.padEnd(colWidths[idx]) + " ";
      }).join("|") + "|";
    }).join("\n");

    return [divider, headerRow, divider, valueRows, divider].filter(Boolean).join("\n");
  }).join("\n\n");
}

let sqlInstance: any = null;
let sqlLoading: Promise<any> | null = null;

async function loadSQL(): Promise<any> {
  if (sqlInstance) return sqlInstance;
  if (sqlLoading)   return sqlLoading;

  sqlLoading = new Promise<any>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
    s.onload = () => {
      sqlInstance = (window as any).initSqlJs;
      sqlLoading = null;
      resolve(sqlInstance);
    };
    s.onerror = () => {
      sqlLoading = null;
      reject(new Error("Failed to load SQLite WebAssembly library"));
    };
    document.head.appendChild(s);
  });
  return sqlLoading;
}

async function runSQLAsync(code: string): Promise<ExecutionResult> {
  try {
    const initSqlJs = await loadSQL();
    const config = {
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    };
    const SQL = await initSqlJs(config);
    const db = new SQL.Database();
    
    // Execute all SQL statements
    const results = db.exec(code);
    const stdout = formatSqlResults(results);
    db.close();

    return {
      stdout,
      stderr: "",
      hasMarker: false,
    };
  } catch (err: any) {
    return {
      stdout: "",
      stderr: err.message || String(err),
      hasMarker: false,
    };
  }
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

const isEOFError = (stderr: string, langKey: string): boolean => {
  if (!stderr) return false;
  const err = stderr.toLowerCase();
  switch (langKey) {
    case "c":
      return err.includes("eoferror");
    case "cpp":
      return err.includes("ios_base::failure") || err.includes("failbit") || err.includes("eoferror");
    case "java":
      return err.includes("nosuchelementexception");
    case "rust":
      return err.includes("panicked at 'eof'") || err.includes("panicked at \'eof\'");
    case "go":
      return err.includes("eof") || err.includes("panic");
    case "ruby":
      return err.includes("eoferror");
    case "php":
      return err.includes("eof") || err.includes("fatal error");
    default:
      return false;
  }
};

// ─── Playground UI ────────────────────────────────────────────────────────

type StatusType = "idle" | "running" | "success" | "error";

function PlaygroundContent({ language }: { language: string }) {
  const router = useRouter();
  const { theme, editorSettings, updateEditorSettings } = useSettings();

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
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
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
    setIsResetConfirmOpen(true);
  };

  const confirmReset = () => {
    if (!langConfig) return;
    saveCode(langConfig.template);
    setOutput("");
    setStatus("idle");
    setInteractiveMode(false);
    setInteractiveInput("");
    setCollectedInputs([]);
    setLastRawOutput("");
    setIsResetConfirmOpen(false);
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
      } else if (langKey === "sql") {
        runRes = await runSQLAsync(code);
      } else {
        runRes = await runServer(code, langKey, stdinStr);
      }

      // Determine if interactiveMode should be active
      const isClientSideInput = !!runRes.hasMarker;
      const isServerSideInput = !LANGUAGES[langKey]?.clientSide && hasInputCalls(code, langKey) && (endsWithPrompt(runRes.stdout) || isEOFError(runRes.stderr, langKey));
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
        const isError = (runRes.status !== undefined && runRes.status !== 0) || !!runRes.stderr;
        setStatus(isError ? "error" : "success");
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
    } else if (langKey === "sql") {
      setOutput("Initializing SQLite WebAssembly...\n");
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
    <div className="flex w-full max-w-full overflow-x-hidden min-h-screen bg-background text-foreground transition-colors duration-200">
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">

        {/* ── Top toolbar ─────────────────────────────────────────────── */}
        <header className="relative z-40 flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 border-b border-border bg-card/20 backdrop-blur-md shrink-0">
          {/* Left: back + interactive lang selector */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Back</span>
            </Link>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all shadow-sm cursor-pointer"
              >
                <span style={{ color: langConfig.brandColor }}>●</span>
                <span className="text-foreground">{langConfig.name}</span>
                <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">{langConfig.filename}</span>
                <ChevronDown className="h-3 w-3 opacity-55" />
              </button>

              {isLangDropdownOpen && (
                <>
                  {/* Backdrop to close the dropdown when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-48 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 py-1.5 overflow-hidden">
                    <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 mb-1">
                      Switch Language
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                      {Object.entries(LANGUAGES).map(([key, cfg]) => {
                        const isCurrent = key === langKey;
                        return (
                          <Link
                            key={key}
                            href={key === "html" ? "/html" : `/${key}`}
                            onClick={() => setIsLangDropdownOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left ${
                              isCurrent ? "bg-accent/60 text-foreground font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            <span style={{ color: cfg.brandColor }}>●</span>
                            <span>{cfg.name}</span>
                            {isCurrent && <span className="ml-auto text-[9px] text-muted-foreground opacity-60">Active</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded border border-border bg-accent text-muted-foreground font-mono font-medium">
              {langConfig.clientSide ? "Browser Runtimes" : "Server Runtimes"}
            </span>
          </div>

          {/* Center/Right: Mobile Tab Switcher */}
          <div className="flex md:hidden items-center border rounded-lg p-0.5 bg-accent border-border shrink-0">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "editor"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "output"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Output
            </button>
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {status !== "idle" && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>
                {StatusIcon}
                <span>{statusText}</span>
              </div>
            )}

            <a
              href="https://github.com/senapati484/code-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="GitHub Repository"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <button
              onClick={handleReset}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Reset to template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={handleDownload}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                  title="Editor Settings"
                >
                  <Sliders className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={theme === "dark" ? "dark bg-[#09090b] text-[#fafafa] border-zinc-800 w-56" : "bg-white text-zinc-900 border-zinc-200 w-56"}
                align="end"
              >
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">
                  Editor Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuCheckboxItem
                  checked={editorSettings.lineNumbers}
                  onCheckedChange={(checked) => updateEditorSettings({ lineNumbers: checked })}
                  className="text-xs py-2 cursor-pointer focus:bg-accent"
                >
                  Show Line Numbers
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={editorSettings.wordWrap}
                  onCheckedChange={(checked) => updateEditorSettings({ wordWrap: checked })}
                  className="text-xs py-2 cursor-pointer focus:bg-accent"
                >
                  Enable Word Wrap
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator className="bg-border/60" />
                
                <DropdownMenuItem
                  onClick={handleReset}
                  className="text-xs py-2 text-rose-500 focus:text-rose-500 cursor-pointer"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  <span>Reset Code</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownload}
                  className="text-xs py-2 cursor-pointer"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  <span>Download File</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block w-px h-4 mx-1 bg-border" />

            <button
              onClick={handleRun}
              disabled={status === "running"}
              className="flex items-center gap-1.5 md:gap-2 px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Run (Ctrl+Enter)"
            >
              {status === "running"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Play className="h-3.5 w-3.5 fill-current" />
              }
              <span className="hidden xs:inline">{status === "running" ? "Running" : "Run"}</span>
              <span className="inline xs:hidden">{status === "running" ? "…" : "Run"}</span>
            </button>
          </div>
        </header>

        {/* ── Editor + Output split ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">

          {/* Code Editor */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "editor" ? "flex" : "hidden md:flex"}`}>
            <div className="flex items-center px-4 py-2 text-[10px] font-mono border-b border-border/80 bg-background text-muted-foreground shrink-0 uppercase tracking-wider">
              <span style={{ color: langConfig.brandColor }}>◆</span>
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
          <div className="hidden md:block w-px shrink-0 bg-border" />

          {/* Output Terminal */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "output" ? "flex" : "hidden md:flex"}`}>
            {/* Output header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/80 bg-background shrink-0">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Output
                </span>
                {status === "running" && (
                  <span className="flex items-center gap-1 ml-1 text-[10px] text-indigo-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                    Running
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {interactiveMode && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold animate-pulse mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Waiting for input
                  </span>
                )}
                <button
                  onClick={handleCopyOutput}
                  disabled={!output || status === "running"}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                  title="Copy output"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { setOutput(""); setStatus("idle"); }}
                  disabled={!output}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                  title="Clear output"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Output / Interactive Terminal */}
            <div
              className="flex-1 overflow-auto p-5 font-mono text-sm leading-relaxed cursor-text bg-background text-foreground"
              style={{ fontFamily: "ui-monospace, 'Cascadia Code', Menlo, monospace", wordBreak: "break-word" }}
              onClick={() => interactiveInputRef.current?.focus()}
            >
              {!output && !interactiveMode ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 opacity-30 select-none">
                  <Terminal className="h-8 w-8" />
                  <p className="text-xs">Press <kbd className="bg-accent px-1.5 py-0.5 rounded text-[10px] font-sans">Ctrl+Enter</kbd> to run</p>
                </div>
              ) : (
                <div
                  className={
                    status === "error" && !interactiveMode
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-foreground"
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
                        className="bg-transparent border-none outline-none font-mono text-sm text-emerald-500 dark:text-emerald-400 caret-emerald-500 dark:caret-emerald-400"
                        style={{
                          width: `${Math.max((interactiveInput.length + 2) * 0.6, 1)}em`,
                          minWidth: "2ch",
                        }}
                      />
                      <span
                        className="inline-block w-[0.55em] h-[1em] align-middle animate-pulse bg-emerald-500 dark:bg-emerald-400"
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
              <div className="border-t border-emerald-500/20 bg-emerald-500/5 px-4 py-2 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-semibold text-emerald-500">
                  Waiting for input — type above and press <kbd className="px-1.5 py-0.5 rounded text-[9px] font-sans bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Enter</kbd>
                </span>
                <button
                  onClick={() => {
                    setInteractiveMode(false);
                    setStatus("error");
                    setOutput(prev => prev + "\n[Terminated]");
                  }}
                  className="ml-auto text-[10px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Kill
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "dark bg-[#09090b] text-[#fafafa] border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Reset {langConfig?.filename || "code"} to the default template?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              This will overwrite your current code changes with the default template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-200 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700 animate-none font-semibold border-none"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-slate-400 text-sm font-mono">Loading editor…</span>
      </div>
    </div>
  );
}

export default function LanguagePlayground({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <LanguagePlaygroundInner params={params} />
    </React.Suspense>
  );
}

function LanguagePlaygroundInner({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = use(params);
  return <PlaygroundContent language={language} />;
}
