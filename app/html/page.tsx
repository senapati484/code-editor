"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import SyntaxHighlighter from "@/components/syntax-highlighter";
import {
  Globe,
  Play,
  RotateCcw,
  Download,
  Terminal,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileCode,
  Monitor,
  Github,
} from "lucide-react";

// ─── Initial template files ─────────────────────────────────────────────────

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Sandbox</title>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo">⚡</span>
      <h1>HTML · CSS · JS Sandbox</h1>
    </div>
    <p>Edit the three files on the left and click <strong>Run</strong> to see your changes live.</p>
    <button id="btn">Click me!</button>
    <div id="out" class="output">Events appear here…</div>
  </div>
</body>
</html>`;

const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #f1f5f9;
}

.card {
  max-width: 480px;
  padding: 32px;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  text-align: center;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo { font-size: 32px; }

h1 {
  margin: 0;
  font-size: 22px;
  background: linear-gradient(90deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 24px;
  line-height: 1.6;
}

button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 15px rgba(99,102,241,0.4);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99,102,241,0.6);
}

.output {
  margin-top: 16px;
  padding: 10px 14px;
  font-family: monospace;
  font-size: 13px;
  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  color: #38bdf8;
  min-height: 36px;
}`;

const DEFAULT_JS = `const btn = document.getElementById('btn');
const out = document.getElementById('out');

let count = 0;

btn.addEventListener('click', () => {
  count++;
  const time = new Date().toLocaleTimeString();
  out.textContent = \`Clicked \${count} time\${count === 1 ? '' : 's'} · \${time}\`;
  console.log('Button clicked at', time);
});

console.log('Sandbox ready!');`;

// ─── Types ──────────────────────────────────────────────────────────────────

interface LogEntry {
  type: "log" | "warn" | "error";
  msg: string;
  time: string;
}

type ActiveFile = "html" | "css" | "js";

const LANGUAGES = [
  { id: "html", name: "HTML Sandbox", color: "text-[#E34F26]", bgAccent: "bg-orange-500/10 border-orange-500/20" },
  { id: "javascript", name: "JavaScript", color: "text-[#F7DF1E]", bgAccent: "bg-yellow-500/10 border-yellow-500/20" },
  { id: "typescript", name: "TypeScript", color: "text-[#3178C6]", bgAccent: "bg-blue-500/10 border-blue-500/20" },
  { id: "python", name: "Python", color: "text-[#3776AB]", bgAccent: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "c", name: "C", color: "text-[#A8B9CC]", bgAccent: "bg-indigo-500/10 border-indigo-500/20" },
  { id: "cpp", name: "C++", color: "text-[#00599C]", bgAccent: "bg-cyan-500/10 border-cyan-500/20" },
  { id: "java", name: "Java", color: "text-[#E76F51]", bgAccent: "bg-rose-500/10 border-rose-500/20" },
  { id: "rust", name: "Rust", color: "text-[#E05D2B]", bgAccent: "bg-orange-500/10 border-orange-500/20" },
  { id: "go", name: "Go", color: "text-[#00ADD8]", bgAccent: "bg-sky-500/10 border-sky-500/20" },
  { id: "ruby", name: "Ruby", color: "text-[#CC342D]", bgAccent: "bg-red-500/10 border-red-500/20" },
  { id: "php", name: "PHP", color: "text-[#777BB4]", bgAccent: "bg-violet-500/10 border-violet-500/20" },
  { id: "sql", name: "SQL (SQLite)", color: "text-[#00758F]", bgAccent: "bg-[#00758F]/10 border-[#00758F]/20" },
];

// ─── Component ──────────────────────────────────────────────────────────────

function HtmlSandboxContent() {
  const { theme, editorSettings } = useSettings();

  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss]   = useState(DEFAULT_CSS);
  const [js, setJs]     = useState(DEFAULT_JS);
  const [activeFile, setActiveFile] = useState<ActiveFile>("html");
  const [preview, setPreview]       = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [activeTab, setActiveTab]   = useState<"editor" | "preview">("editor");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const isDark = theme === "dark";

  // Load from localStorage
  useEffect(() => {
    const h = localStorage.getItem("sandbox-html");
    const c = localStorage.getItem("sandbox-css");
    const j = localStorage.getItem("sandbox-js");
    if (h) setHtml(h);
    if (c) setCss(c);
    if (j) setJs(j);
  }, []);

  const buildPreview = useCallback((shouldClearLogs = false) => {
    const consoleBridge = `<script>
(function(){
  ['log','warn','error'].forEach(function(t){
    var orig = console[t];
    console[t] = function(){
      var msg = Array.from(arguments).map(function(a){
        return typeof a === 'object' ? JSON.stringify(a) : String(a);
      }).join(' ');
      parent.postMessage({type:'__SANDBOX_LOG__',logType:t,message:msg},'*');
      orig.apply(console,arguments);
    };
  });
  window.addEventListener('error',function(e){
    parent.postMessage({type:'__SANDBOX_LOG__',logType:'error',message:e.message},'*');
  });
})();
</script>`;

    let doc = html;
    const style = `<style>\n${css}\n</style>`;
    const script = `<script>\n${js}\n</script>`;

    // Inject console bridge + styles into <head>
    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `${consoleBridge}\n${style}\n</head>`);
    } else {
      doc = consoleBridge + "\n" + style + "\n" + doc;
    }
    // Inject user JS before </body>
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `${script}\n</body>`);
    } else {
      doc = doc + "\n" + script;
    }
    setPreview(doc);
    if (shouldClearLogs) {
      setLogs([]);
    }
    setPreviewVersion(v => v + 1);
  }, [html, css, js]);

  // Automatically build preview when html, css, or js changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      buildPreview(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [html, css, js, buildPreview]);

  // Listen for iframe console messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "__SANDBOX_LOG__") return;
      setLogs(prev => [...prev, {
        type: e.data.logType,
        msg: e.data.message,
        time: new Date().toLocaleTimeString(),
      }]);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const getCode = () => activeFile === "html" ? html : activeFile === "css" ? css : js;

  const handleChange = (val: string) => {
    if (activeFile === "html") { setHtml(val); localStorage.setItem("sandbox-html", val); }
    else if (activeFile === "css") { setCss(val); localStorage.setItem("sandbox-css", val); }
    else { setJs(val); localStorage.setItem("sandbox-js", val); }
  };

  const handleReset = () => {
    if (!confirm("Reset all files to the default template?")) return;
    setHtml(DEFAULT_HTML); setCss(DEFAULT_CSS); setJs(DEFAULT_JS);
    localStorage.removeItem("sandbox-html");
    localStorage.removeItem("sandbox-css");
    localStorage.removeItem("sandbox-js");
    setLogs([]);
    buildPreview();
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sandbox.html";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const fileLabel = { html: "index.html", css: "style.css", js: "script.js" };
  const fileDot   = { html: "text-orange-400", css: "text-blue-400", js: "text-yellow-400" };

  return (
    <div className={`flex w-full max-w-full overflow-x-hidden min-h-screen ${isDark ? "bg-[#0d1117] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <header className={`flex items-center justify-between px-3 md:px-4 py-2 border-b shrink-0 ${
          isDark ? "bg-[#161b22] border-slate-800" : "bg-white border-slate-200"
        }`}>
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

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border hover:opacity-85 transition-all shadow-sm cursor-pointer bg-orange-500/10 border-orange-500/20"
              >
                <Globe className="h-3.5 w-3.5 text-orange-400" />
                <span className={isDark ? "text-slate-200" : "text-slate-700"}>Web Sandbox</span>
                <span className={`hidden sm:inline ${isDark ? "text-slate-500" : "text-slate-400"}`}>HTML · CSS · JS</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
              </button>

              {isLangDropdownOpen && (
                <>
                  {/* Backdrop to close the dropdown when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)} />
                  <div className={`absolute left-0 mt-2 w-48 rounded-xl border shadow-xl z-50 py-1.5 overflow-hidden focus:outline-none ${
                    isDark ? "bg-[#161b22] border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                  }`}>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider border-b border-slate-800/10 dark:border-slate-800/30 mb-1.5">
                      Switch Language
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                      {LANGUAGES.map((cfg) => {
                        const isCurrent = cfg.id === "html";
                        return (
                          <Link
                            key={cfg.id}
                            href={cfg.id === "html" ? "/html" : `/${cfg.id}`}
                            onClick={() => setIsLangDropdownOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-indigo-500 hover:text-white transition-colors w-full text-left ${
                              isCurrent ? (isDark ? "bg-slate-800 text-white font-bold" : "bg-slate-100 text-slate-900 font-bold") : ""
                            }`}
                          >
                            <span className={cfg.color}>●</span>
                            <span>{cfg.name}</span>
                            {isCurrent && <span className="ml-auto text-[10px] opacity-60">Active</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile View Toggle (Editor vs Preview) */}
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
              onClick={() => {
                setActiveTab("preview");
                buildPreview(true);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <a
              href="https://github.com/senapati484/code-editor"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="GitHub Repository"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

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
              <span className="hidden sm:inline">Download</span>
            </button>
            <div className={`hidden sm:block w-px h-5 mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            <button
              onClick={() => {
                buildPreview(true);
                setActiveTab("preview");
              }}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Run</span>
              <span className="inline xs:hidden">Run</span>
            </button>
          </div>
        </header>

        {/* ── 3-column workspace: file list | editor | preview ─────── */}
        <div className="flex-1 flex overflow-hidden">

          {/* File list (narrow sidebar) - hidden on mobile */}
          <div className={`hidden md:flex w-36 shrink-0 flex-col border-r py-3 px-2 gap-1 ${
            isDark ? "bg-[#161b22] border-slate-800" : "bg-white border-slate-200"
          }`}>
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 mb-1 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}>Files</span>

            {(["html", "css", "js"] as ActiveFile[]).map(ft => (
              <button
                key={ft}
                onClick={() => setActiveFile(ft)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                  activeFile === ft
                    ? isDark
                      ? "bg-slate-800 text-slate-100 border border-slate-700"
                      : "bg-slate-100 text-slate-900 border border-slate-200"
                    : isDark
                    ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FileCode className={`h-3.5 w-3.5 shrink-0 ${activeFile === ft ? fileDot[ft] : ""}`} />
                <span className="truncate">{fileLabel[ft]}</span>
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "editor" ? "flex" : "hidden md:flex"}`}>
            {/* Horizontal File Tabs for Mobile */}
            <div className="flex md:hidden items-center gap-1.5 p-2 border-b shrink-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              {(["html", "css", "js"] as ActiveFile[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => setActiveFile(ft)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-semibold border transition-all ${
                    activeFile === ft
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{fileLabel[ft]}</span>
                </button>
              ))}
            </div>

            <div className={`flex items-center px-4 py-1.5 text-[11px] font-mono border-b shrink-0 ${
              isDark ? "bg-[#161b22] border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              <span className={fileDot[activeFile]}>◆</span>
              <span className="ml-1.5">{fileLabel[activeFile]}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <SyntaxHighlighter
                key={activeFile}
                code={getCode()}
                language={activeFile === "js" ? "javascript" : activeFile}
                onChange={handleChange}
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

          {/* Preview panel */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 relative ${activeTab === "preview" ? "flex" : "hidden md:flex"}`}>
            <div className={`flex items-center justify-between px-4 py-1.5 border-b shrink-0 ${
              isDark ? "bg-[#161b22] border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-1.5">
                <Monitor className={`h-3.5 w-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <span className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Preview</span>
              </div>
              {/* Console toggle */}
              <button
                onClick={() => setConsoleOpen(o => !o)}
                className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md transition-colors ${
                  isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Terminal className="h-3 w-3 text-orange-400" />
                Console ({logs.length})
                {consoleOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </div>

            {/* iframe */}
            <div className="flex-1 relative overflow-hidden">
              <iframe
                key={previewVersion}
                srcDoc={preview}
                title="Web Preview"
                sandbox="allow-scripts"
                className="absolute inset-0 w-full h-full border-0 bg-white"
              />
            </div>

            {/* Console drawer */}
            {consoleOpen && (
              <div className={`border-t h-48 flex flex-col shrink-0 ${
                isDark ? "bg-[#161b22] border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-orange-400" />
                    Console Output
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLogs([])}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                      title="Clear logs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setConsoleOpen(false)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 text-center py-4">No console output yet</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className={`flex gap-2 px-2 py-0.5 rounded ${
                        log.type === "error"
                          ? "text-rose-400 bg-rose-500/5"
                          : log.type === "warn"
                          ? "text-amber-400 bg-amber-500/5"
                          : "text-sky-300"
                      }`}>
                        <span className="text-slate-600 shrink-0">[{log.time}]</span>
                        <span className="whitespace-pre-wrap break-all">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HtmlSandbox() {
  return <HtmlSandboxContent />;
}
