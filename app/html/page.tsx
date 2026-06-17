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
    <div className="flex w-full max-w-full overflow-x-hidden min-h-screen bg-background text-foreground transition-colors duration-200">
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border bg-card/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-1.5 md:gap-3">
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
                <Globe className="h-3.5 w-3.5 text-orange-400" />
                <span>Web Sandbox</span>
                <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">HTML · CSS · JS</span>
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
                      {LANGUAGES.map((cfg) => {
                        const isCurrent = cfg.id === "html";
                        return (
                          <Link
                            key={cfg.id}
                            href={cfg.id === "html" ? "/html" : `/${cfg.id}`}
                            onClick={() => setIsLangDropdownOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left ${
                              isCurrent ? "bg-accent/60 text-foreground font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            <span className={cfg.color}>●</span>
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
          </div>

          {/* Mobile View Toggle (Editor vs Preview) */}
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
              onClick={() => {
                setActiveTab("preview");
                buildPreview(true);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="GitHub Repository"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Reset to template"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <div className="hidden sm:block w-px h-4 mx-1 bg-border" />
            <button
              onClick={() => {
                buildPreview(true);
                setActiveTab("preview");
              }}
              className="flex items-center gap-1.5 md:gap-2 px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="font-semibold">Run</span>
            </button>
          </div>
        </header>

        {/* ── 3-column workspace: file list | editor | preview ─────── */}
        <div className="flex-1 flex overflow-hidden bg-background">

          {/* File list (narrow sidebar) - hidden on mobile */}
          <div className="hidden md:flex w-36 shrink-0 flex-col border-r border-border py-4 px-2.5 gap-1 bg-background">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 mb-2 text-muted-foreground">Files</span>

            {(["html", "css", "js"] as ActiveFile[]).map(ft => (
              <button
                key={ft}
                onClick={() => setActiveFile(ft)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left border ${
                  activeFile === ft
                    ? "bg-accent text-foreground border-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border-transparent"
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
            <div className="flex md:hidden items-center gap-1.5 p-2 border-b shrink-0 bg-background border-border">
              {(["html", "css", "js"] as ActiveFile[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => setActiveFile(ft)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-semibold border transition-all ${
                    activeFile === ft
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-border"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{fileLabel[ft]}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center px-4 py-2 text-[10px] font-mono border-b border-border/80 bg-background text-muted-foreground shrink-0 uppercase tracking-wider">
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
          <div className="hidden md:block w-px shrink-0 bg-border" />

          {/* Preview panel */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 relative ${activeTab === "preview" ? "flex" : "hidden md:flex"}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/80 bg-background shrink-0">
              <div className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Preview</span>
              </div>
              {/* Console toggle */}
              <button
                onClick={() => setConsoleOpen(o => !o)}
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Terminal className="h-3 w-3 text-orange-400" />
                <span>Console ({logs.length})</span>
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
              <div className="border-t border-border h-48 flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/80 bg-background">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-orange-400" />
                    Console Output
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLogs([])}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Clear logs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setConsoleOpen(false)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">No console output yet</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className={`flex gap-2 px-2 py-0.5 rounded ${
                        log.type === "error"
                          ? "text-rose-500 bg-rose-500/5"
                          : log.type === "warn"
                          ? "text-amber-500 bg-amber-500/5"
                          : "text-sky-500 dark:text-sky-300"
                      }`}>
                        <span className="text-muted-foreground/60 shrink-0">[{log.time}]</span>
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
