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
  Sliders,
  Check,
  Copy,
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
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";

// ─── Initial template files ─────────────────────────────────────────────────

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O2 Code Sandbox</title>
</head>
<body>
  <h1>O2 code is working for HTML!</h1>
</body>
</html>`;

const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #09090b;
  color: #ffffff;
}

h1 {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.05em;
  background: linear-gradient(90deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}`;

const DEFAULT_JS = `console.log("O2 HTML Sandbox is ready!");
console.log("O2 code is life!");`;

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
  const { theme, editorSettings, updateEditorSettings, isMobileView } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEmbedded, setIsEmbedded]             = useState(false);
  const [hideHeader, setHideHeader]             = useState(false);

  const isDark = theme === "dark";

  // Load from localStorage & URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let htmlVal = params.get("html") || params.get("h") || params.get("code") || params.get("c");
    let cssVal = params.get("css") || params.get("style");
    let jsVal = params.get("js") || params.get("j") || params.get("script");
    let embedVal = params.get("embed") || "";
    let eShort = params.get("e") || "";

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (!htmlVal) htmlVal = hashParams.get("html") || hashParams.get("h") || hashParams.get("code") || hashParams.get("c");
      if (!cssVal) cssVal = hashParams.get("css") || hashParams.get("style");
      if (!jsVal) jsVal = hashParams.get("js") || hashParams.get("j") || hashParams.get("script");
      if (!embedVal) embedVal = hashParams.get("embed") || "";
      if (!eShort) eShort = hashParams.get("e") || "";
    }

    const finalEmbed = embedVal || eShort;
    if (finalEmbed === "true" || finalEmbed === "full") {
      setIsEmbedded(true);
      if (finalEmbed === "full") {
        setHideHeader(true);
      }
    } else {
      setIsEmbedded(false);
      setHideHeader(false);
    }

    const decodeValue = (encoded: string | null) => {
      if (!encoded) return null;
      try {
        const normalized = encoded.replace(/\s/g, "+");
        return decodeURIComponent(
          atob(normalized)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      } catch (e) {
        try {
          return decodeURIComponent(encoded);
        } catch (err) {
          return encoded;
        }
      }
    };

    const urlHtml = decodeValue(htmlVal);
    const urlCss = decodeValue(cssVal);
    const urlJs = decodeValue(jsVal);

    let finalHtml = "";
    let finalCss = "";
    let finalJs = "";
    let hasUrlCode = false;

    if (urlHtml !== null || urlCss !== null || urlJs !== null) {
      hasUrlCode = true;
      finalHtml = urlHtml !== null ? urlHtml : "";
      finalCss = urlCss !== null ? urlCss : "";
      finalJs = urlJs !== null ? urlJs : "";
    } else {
      finalHtml = localStorage.getItem("sandbox-html") ?? DEFAULT_HTML;
      finalCss = localStorage.getItem("sandbox-css") ?? DEFAULT_CSS;
      finalJs = localStorage.getItem("sandbox-js") ?? DEFAULT_JS;
    }

    setHtml(finalHtml);
    setCss(finalCss);
    setJs(finalJs);

    if (hasUrlCode) {
      localStorage.setItem("sandbox-html", finalHtml);
      localStorage.setItem("sandbox-css", finalCss);
      localStorage.setItem("sandbox-js", finalJs);
    }

    // Initial build preview using loaded values directly to bypass state update lag
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

    let doc = finalHtml;
    const style = `<style>\n${finalCss}\n</style>`;
    const script = `<script>\n${finalJs}\n</script>`;

    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `${consoleBridge}\n${style}\n</head>`);
    } else {
      doc = consoleBridge + "\n" + style + "\n" + doc;
    }
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `${script}\n</body>`);
    } else {
      doc = doc + "\n" + script;
    }
    setPreview(doc);
    setPreviewVersion((v) => v + 1);

    // Auto-run trigger
    const autoRun = params.get("run") === "true" || params.get("r") === "true" ||
      (window.location.hash && new URLSearchParams(window.location.hash.substring(1)).get("run") === "true") ||
      (window.location.hash && new URLSearchParams(window.location.hash.substring(1)).get("r") === "true");

    if (autoRun && hasUrlCode) {
      setActiveTab("preview");
    }
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
    setIsResetConfirmOpen(true);
  };

  const confirmReset = () => {
    setHtml(DEFAULT_HTML); setCss(DEFAULT_CSS); setJs(DEFAULT_JS);
    localStorage.removeItem("sandbox-html");
    localStorage.removeItem("sandbox-css");
    localStorage.removeItem("sandbox-js");
    setLogs([]);
    buildPreview();
    setIsResetConfirmOpen(false);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sandbox.html";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const handleCopyShareLink = () => {
    try {
      const encodeBase64 = (str: string) => {
        return btoa(
          encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
          })
        );
      };
      
      const encodedHtml = encodeURIComponent(encodeBase64(html));
      const encodedCss = encodeURIComponent(encodeBase64(css));
      const encodedJs = encodeURIComponent(encodeBase64(js));
      
      const shareUrl = `${window.location.origin}${window.location.pathname}#html=${encodedHtml}&css=${encodedCss}&js=${encodedJs}&run=true`;
      
      navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy share link:", e);
    }
  };

  const fileLabel = { html: "index.html", css: "style.css", js: "script.js" };
  const fileDot   = { html: "text-orange-400", css: "text-blue-400", js: "text-yellow-400" };

  return (
    <div className="flex w-full max-w-full overflow-x-hidden min-h-screen bg-background text-foreground transition-colors duration-200">
      {!isEmbedded && <SidebarNav />}

      <main className={`flex-1 flex flex-col ${isEmbedded ? "h-screen h-[100dvh]" : "h-[calc(100dvh-4rem)] md:h-screen"} overflow-hidden`}>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        {!hideHeader && (
          <header className="relative z-40 flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 border-b border-border bg-card/20 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-1.5 md:gap-3">
              {!isEmbedded && (
                <Link
                  href="/"
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Back</span>
                </Link>
              )}

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
            {!isEmbedded && (
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
            )}

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
                <DropdownMenuItem
                  onClick={handleCopyShareLink}
                  className="text-xs py-2 cursor-pointer"
                >
                  {shareLinkCopied ? (
                    <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="mr-2 h-3.5 w-3.5" />
                  )}
                  <span>{shareLinkCopied ? "Link Copied!" : "Copy Share Link"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      )}

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
          {!mounted ? (
            <>
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
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
            </>
          ) : isMobileView ? (
            <>
              {/* Code editor */}
              <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${activeTab === "editor" ? "flex" : "hidden"}`}>
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

              {/* Preview panel */}
              <div className={`flex-1 flex flex-col overflow-hidden min-w-0 relative ${activeTab === "preview" ? "flex" : "hidden"}`}>
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
            </>
          ) : (
            <PanelGroup orientation="horizontal">
              <Panel defaultSize={50} minSize={20}>
                {/* Code editor */}
                <div className="h-full flex flex-col overflow-hidden min-w-0">
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
              </Panel>

              <PanelResizeHandle className="group w-2 shrink-0 relative hover:bg-primary/10 active:bg-primary/25 transition-all duration-200 cursor-col-resize flex items-center justify-center">
                {/* Visual divider line */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/30 transition-colors" />
                {/* Centered drag handle pill */}
                <div className="z-10 w-1 h-8 bg-muted-foreground/20 rounded-full group-hover:bg-primary/50 group-hover:scale-x-125 transition-all" />
              </PanelResizeHandle>

              <Panel defaultSize={50} minSize={20}>
                {/* Preview panel */}
                <div className="h-full flex flex-col overflow-hidden min-w-0 relative">
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
              </Panel>
            </PanelGroup>
          )}
        </div>
      </main>

      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "dark bg-[#09090b] text-[#fafafa] border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Reset all files to the default template?
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

export default function HtmlSandbox() {
  return <HtmlSandboxContent />;
}
