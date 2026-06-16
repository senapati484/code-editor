"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-java"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-go"
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"

interface SyntaxHighlighterProps {
  code: string
  language: string
  onChange: (code: string) => void
  fontSize: number
  lineNumbers: boolean
  wordWrap: boolean
  className?: string
  theme: string
}

const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  c: "c",
  cpp: "cpp",
  java: "java",
  rust: "rust",
  go: "go",
  ruby: "ruby",
  php: "php",
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function highlightCode(code: string, lang: string): string {
  const prismLang = LANG_MAP[lang]
  if (prismLang && Prism.languages[prismLang]) {
    try {
      return Prism.highlight(code, Prism.languages[prismLang], prismLang)
    } catch {
      return escapeHtml(code)
    }
  }
  return escapeHtml(code)
}

const DARK_TOKEN_COLORS: Record<string, string> = {
  comment: "#6B7280",
  prolog: "#6B7280",
  doctype: "#6B7280",
  cdata: "#6B7280",
  punctuation: "#9CA3AF",
  property: "#7DD3FC",
  tag: "#F87171",
  boolean: "#F59E0B",
  number: "#F59E0B",
  constant: "#F59E0B",
  symbol: "#F59E0B",
  selector: "#A78BFA",
  "attr-name": "#FDE68A",
  string: "#86EFAC",
  char: "#86EFAC",
  builtin: "#C084FC",
  inserted: "#86EFAC",
  operator: "#9CA3AF",
  entity: "#9CA3AF",
  url: "#7DD3FC",
  variable: "#F9A8D4",
  atrule: "#C084FC",
  "attr-value": "#86EFAC",
  keyword: "#C084FC",
  function: "#60A5FA",
  "class-name": "#7DD3FC",
  regex: "#FDE68A",
  important: "#FDE68A",
  deleted: "#F87171",
}

const LIGHT_TOKEN_COLORS: Record<string, string> = {
  comment: "#9CA3AF",
  prolog: "#9CA3AF",
  doctype: "#9CA3AF",
  cdata: "#9CA3AF",
  punctuation: "#6B7280",
  property: "#0369A1",
  tag: "#DC2626",
  boolean: "#D97706",
  number: "#D97706",
  constant: "#D97706",
  symbol: "#D97706",
  selector: "#7C3AED",
  "attr-name": "#A16207",
  string: "#16A34A",
  char: "#16A34A",
  builtin: "#9333EA",
  inserted: "#16A34A",
  operator: "#6B7280",
  entity: "#6B7280",
  url: "#0369A1",
  variable: "#DB2777",
  atrule: "#9333EA",
  "attr-value": "#16A34A",
  keyword: "#9333EA",
  function: "#2563EB",
  "class-name": "#0369A1",
  regex: "#A16207",
  important: "#A16207",
  deleted: "#DC2626",
}

export default function SyntaxHighlighter({
  code,
  language,
  onChange,
  fontSize,
  lineNumbers,
  wordWrap,
  className = "",
  theme = "light",
}: SyntaxHighlighterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const highlighted = highlightCode(code, language)

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current
    const pre = preRef.current
    const lineNums = lineNumbersRef.current
    if (!textarea || !pre) return
    pre.scrollTop = textarea.scrollTop
    pre.scrollLeft = textarea.scrollLeft
    if (lineNums) {
      lineNums.scrollTop = textarea.scrollTop
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const events = ["scroll", "input", "keyup", "mouseup", "touchend"]
    events.forEach((e) => textarea.addEventListener(e, syncScroll, { passive: true }))
    syncScroll()
    return () => {
      events.forEach((e) => textarea.removeEventListener(e, syncScroll))
    }
  }, [syncScroll, code])

  useEffect(() => {
    setTimeout(syncScroll, 0)
  }, [code, syncScroll])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.target as HTMLTextAreaElement
      const { selectionStart, selectionEnd, value } = textarea

      if (e.key === "Tab") {
        e.preventDefault()
        const indent = "  "
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd)
        onChange(newValue)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length
          syncScroll()
        }, 0)
      } else if (e.key === "Enter") {
        const lines = value.substring(0, selectionStart).split("\n")
        const currentLine = lines[lines.length - 1]
        const indent = currentLine.match(/^\s*/)?.[0] || ""
        const extraIndent =
          currentLine.trim().endsWith("{") || currentLine.trim().endsWith(":") || currentLine.trim().endsWith("(")
            ? "  "
            : ""
        const newIndent = indent + extraIndent
        const newValue = value.substring(0, selectionStart) + "\n" + newIndent + value.substring(selectionEnd)
        onChange(newValue)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length
          syncScroll()
        }, 0)
        e.preventDefault()
      } else if (["(", "[", "{", '"', "'", "`"].includes(e.key)) {
        const closingBrackets: Record<string, string> = {
          "(": ")",
          "[": "]",
          "{": "}",
          '"': '"',
          "'": "'",
          "`": "`",
        }
        const closing = closingBrackets[e.key]
        if (closing && selectionStart === selectionEnd) {
          e.preventDefault()
          const newValue = value.substring(0, selectionStart) + e.key + closing + value.substring(selectionEnd)
          onChange(newValue)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
            syncScroll()
          }, 0)
        }
      }
    },
    [onChange, syncScroll],
  )

  const generateLineNumbers = useCallback(() => {
    const lines = code.split("\n")
    const lineHeight = fontSize * 1.5
    const paddingTop = isMobile ? 12 : 16

    return (
      <div
        style={{
          lineHeight: "1.5",
          paddingTop: `${paddingTop}px`,
          fontSize: `${fontSize}px`,
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            style={{
              color: theme === "dark" ? "#4B5563" : "#D1D5DB",
              userSelect: "none",
              textAlign: "right",
              paddingRight: isMobile ? "8px" : "12px",
              minWidth: isMobile ? "2.5rem" : "3rem",
              height: `${lineHeight}px`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              boxSizing: "border-box",
              margin: 0,
              border: 0,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  }, [code, fontSize, theme, isMobile])

  const sharedStyle: React.CSSProperties = {
    fontSize: `${isMobile ? Math.max(fontSize - 2, 12) : fontSize}px`,
    lineHeight: "1.5",
    padding: isMobile ? "12px" : "16px",
    whiteSpace: wordWrap ? "pre-wrap" : "pre",
    wordBreak: wordWrap ? "break-word" : "normal",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    margin: 0,
    border: 0,
    overflow: "auto",
    height: "100%",
    width: "100%",
    boxSizing: "border-box" as const,
    tabSize: 2,
  }

  const tokenColors = theme === "dark" ? DARK_TOKEN_COLORS : LIGHT_TOKEN_COLORS

  return (
    <div
      ref={containerRef}
      className={`relative font-mono ${className} overflow-hidden rounded-lg border-2 transition-all duration-200 ${
        isFocused
          ? theme === "dark"
            ? "border-blue-500 shadow-lg shadow-blue-500/20"
            : "border-blue-500 shadow-lg shadow-blue-500/10"
          : theme === "dark"
            ? "border-gray-700"
            : "border-gray-300"
      }`}
      style={{
        backgroundColor: theme === "dark" ? "#111827" : "#FFFFFF",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(tokenColors)
            .map(([token, color]) =>
              `[data-editor] .token.${token}{color:${color}}`
            )
            .join("\n"),
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="flex-shrink-0 border-r"
            style={{
              borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
              backgroundColor: theme === "dark" ? "#0D1117" : "#F9FAFB",
              overflow: "hidden",
              width: isMobile ? "3rem" : "4rem",
            }}
          >
            {generateLineNumbers()}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {/* Highlighted code layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              ...sharedStyle,
              color: theme === "dark" ? "#E2E8F0" : "#1E293B",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <code
              dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
            />
          </pre>

          {/* Transparent textarea for input */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value)
              setTimeout(syncScroll, 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onScroll={syncScroll}
            className="w-full h-full resize-none border-0 outline-none"
            style={{
              ...sharedStyle,
              color: "transparent",
              caretColor: theme === "dark" ? "#60A5FA" : "#2563EB",
              backgroundColor: "transparent",
              position: "relative",
              zIndex: 1,
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={`Start typing your ${language.toUpperCase()} code...`}
          />
        </div>
      </div>

      {isFocused && (
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium shadow-md z-10"
          style={{
            backgroundColor: theme === "dark" ? "#1F2937" : "#F3F4F6",
            color: theme === "dark" ? "#60A5FA" : "#2563EB",
            border: `1px solid ${theme === "dark" ? "#374151" : "#E5E7EB"}`,
          }}
        >
          {language.toUpperCase()}
        </div>
      )}
    </div>
  )
}
