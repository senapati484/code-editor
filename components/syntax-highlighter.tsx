"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"

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

const DARK_TOKENS: Record<string, string> = {
  comment: "#6B7280", prolog: "#6B7280", doctype: "#6B7280", cdata: "#6B7280",
  punctuation: "#9CA3AF", property: "#7DD3FC", tag: "#F87171",
  boolean: "#F59E0B", number: "#F59E0B", constant: "#F59E0B", symbol: "#F59E0B",
  selector: "#A78BFA", "attr-name": "#FDE68A", string: "#86EFAC", char: "#86EFAC",
  builtin: "#C084FC", inserted: "#86EFAC", operator: "#9CA3AF", entity: "#9CA3AF",
  url: "#7DD3FC", variable: "#F9A8D4", atrule: "#C084FC", "attr-value": "#86EFAC",
  keyword: "#C084FC", function: "#60A5FA", "class-name": "#7DD3FC",
  regex: "#FDE68A", important: "#FDE68A", deleted: "#F87171",
}

const LIGHT_TOKENS: Record<string, string> = {
  comment: "#9CA3AF", prolog: "#9CA3AF", doctype: "#9CA3AF", cdata: "#9CA3AF",
  punctuation: "#6B7280", property: "#0369A1", tag: "#DC2626",
  boolean: "#D97706", number: "#D97706", constant: "#D97706", symbol: "#D97706",
  selector: "#7C3AED", "attr-name": "#A16207", string: "#16A34A", char: "#16A34A",
  builtin: "#9333EA", inserted: "#16A34A", operator: "#6B7280", entity: "#6B7280",
  url: "#0369A1", variable: "#DB2777", atrule: "#9333EA", "attr-value": "#16A34A",
  keyword: "#9333EA", function: "#2563EB", "class-name": "#0369A1",
  regex: "#A16207", important: "#A16207", deleted: "#DC2626",
}

type Token = { type: string; text: string }

function tokenizeJavaScript(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i)
      tokens.push({ type: "comment", text: code.slice(i, end === -1 ? code.length : end + 1) })
      i = end === -1 ? code.length : end + 1
      continue
    }
    // Multi-line comment
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2)
      tokens.push({ type: "comment", text: code.slice(i, end === -1 ? code.length : end + 2) })
      i = end === -1 ? code.length : end + 2
      continue
    }
    // String (double quote)
    if (code[i] === '"') {
      let end = i + 1
      while (end < code.length && code[end] !== '"') {
        if (code[end] === "\\") end++
        end++
      }
      tokens.push({ type: "string", text: code.slice(i, Math.min(end + 1, code.length)) })
      i = Math.min(end + 1, code.length)
      continue
    }
    // String (single quote)
    if (code[i] === "'") {
      let end = i + 1
      while (end < code.length && code[end] !== "'") {
        if (code[end] === "\\") end++
        end++
      }
      tokens.push({ type: "string", text: code.slice(i, Math.min(end + 1, code.length)) })
      i = Math.min(end + 1, code.length)
      continue
    }
    // Template literal
    if (code[i] === "`") {
      let end = i + 1
      while (end < code.length && code[end] !== "`") {
        if (code[end] === "\\") end++
        end++
      }
      tokens.push({ type: "string", text: code.slice(i, Math.min(end + 1, code.length)) })
      i = Math.min(end + 1, code.length)
      continue
    }
    // Regex
    if (code[i] === "/" && i > 0 && /[(\[=!+\-*/%&|^~?:,;]\s*$/.test(code.slice(0, i))) {
      let end = i + 1
      while (end < code.length && code[end] !== "/") {
        if (code[end] === "\\") end++
        end++
      }
      end++ // closing /
      while (end < code.length && /[gimsuy]/.test(code[end])) end++
      tokens.push({ type: "regex", text: code.slice(i, end) })
      i = end
      continue
    }
    // Number
    if (/[0-9]/.test(code[i]) || (code[i] === "." && i + 1 < code.length && /[0-9]/.test(code[i + 1]))) {
      let end = i
      if (code[end] === "0" && (code[end + 1] === "x" || code[end + 1] === "X")) {
        end += 2
        while (/[0-9a-fA-F]/.test(code[end])) end++
      } else {
        while (/[0-9.eE+\-]/.test(code[end])) end++
      }
      tokens.push({ type: "number", text: code.slice(i, end) })
      i = end
      continue
    }
    // Word (keyword, boolean, function, builtin, etc)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let end = i
      while (/[a-zA-Z0-9_$]/.test(code[end])) end++
      const word = code.slice(i, end)
      const JS_KEYWORDS = ["async", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"]
      const JS_TYPES = ["Array", "Boolean", "Date", "Error", "Function", "Map", "Number", "Object", "Promise", "RegExp", "Set", "String", "Symbol", "WeakMap", "WeakSet", "null", "undefined", "true", "false", "NaN", "Infinity"]
      let type = "variable"
      if (JS_KEYWORDS.includes(word)) type = "keyword"
      else if (JS_TYPES.includes(word)) type = "builtin"
      else if (end < code.length && code[end] === "(") type = "function"
      tokens.push({ type, text: word })
      i = end
      continue
    }

    tokens.push({ type: "punctuation", text: code[i] })
    i++
  }
  return tokens
}

function tokenizeCode(code: string, lang: string): string {
  const lines = code.split("\n")
  const result: string[] = []

  const LANG_COMMENTS: Record<string, { line: string[]; block: string[] }> = {
    javascript: { line: ["//"], block: ["/*", "*/"] },
    typescript: { line: ["//"], block: ["/*", "*/"] },
    python: { line: ["#"], block: ['"""', '"""'] },
    c: { line: ["//"], block: ["/*", "*/"] },
    cpp: { line: ["//"], block: ["/*", "*/"] },
    java: { line: ["//"], block: ["/*", "*/"] },
    rust: { line: ["//"], block: ["/*", "*/"] },
    go: { line: ["//"], block: ["/*", "*/"] },
    ruby: { line: ["#"], block: ["=begin", "=end"] },
    php: { line: ["//", "#"], block: ["/*", "*/"] },
  }

  const LANG_KEYWORDS: Record<string, string[]> = {
    c: ["auto", "break", "case", "char", "const", "continue", "default", "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "int", "long", "register", "return", "short", "signed", "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "include", "define"],
    cpp: ["auto", "break", "case", "catch", "char", "class", "const", "constexpr", "continue", "default", "delete", "do", "double", "else", "enum", "explicit", "export", "extern", "float", "for", "friend", "goto", "if", "inline", "int", "long", "namespace", "new", "noexcept", "operator", "override", "private", "protected", "public", "register", "return", "short", "signed", "sizeof", "static", "struct", "switch", "template", "this", "throw", "try", "typedef", "typeid", "typename", "union", "unsigned", "using", "virtual", "void", "volatile", "while", "include", "define"],
    java: ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"],
    rust: ["as", "async", "await", "break", "const", "continue", "crate", "dyn", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while"],
    go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var"],
    ruby: ["begin", "break", "case", "class", "def", "do", "else", "elsif", "end", "ensure", "false", "for", "if", "in", "module", "next", "nil", "raise", "rescue", "return", "self", "super", "then", "true", "undef", "unless", "until", "when", "while", "yield"],
    php: ["abstract", "as", "break", "case", "catch", "class", "clone", "const", "continue", "declare", "default", "die", "do", "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach", "endif", "endswitch", "endwhile", "extends", "final", "finally", "for", "foreach", "function", "global", "goto", "if", "implements", "include", "instanceof", "interface", "isset", "list", "namespace", "new", "print", "private", "protected", "public", "return", "static", "switch", "throw", "trait", "try", "unset", "use", "var", "while"],
    python: ["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"],
  }

  const LANG_BUILTINS: Record<string, string[]> = {
    python: ["print", "len", "range", "int", "str", "float", "list", "dict", "set", "tuple", "type", "input", "open", "map", "filter", "zip", "enumerate", "sorted", "reversed", "abs", "max", "min", "sum", "any", "all", "isinstance", "hasattr"],
    javascript: ["console", "Math", "JSON", "parseInt", "parseFloat", "setTimeout", "setInterval", "fetch", "document", "window", "Array", "Object", "String", "Number", "Boolean", "Promise", "Map", "Set"],
    typescript: ["console", "Math", "JSON", "parseInt", "parseFloat", "setTimeout", "setInterval", "fetch", "document", "window", "Array", "Object", "String", "Number", "Boolean", "Promise", "Map", "Set"],
  }

  const comments = LANG_COMMENTS[lang] || { line: ["#"], block: ["/*", "*/"] }

  for (const line of lines) {
    let start = 0
    const parts: string[] = []

    // Block comments
    const blockIdx = line.indexOf(comments.block[0])
    if (blockIdx !== -1) {
      parts.push(htmlEscape(line.slice(0, blockIdx)))
      parts.push(`<span class="se-token se-comment">${htmlEscape(line.slice(blockIdx))}</span>`)
      result.push(parts.join(""))
      continue
    }

    // Line comments
    let minCommentIdx = -1
    for (const lc of comments.line) {
      const idx = line.indexOf(lc)
      if (idx !== -1 && (minCommentIdx === -1 || idx < minCommentIdx)) {
        minCommentIdx = idx
      }
    }

    let codePart = line
    let commentPart = ""
    if (minCommentIdx !== -1) {
      codePart = line.slice(0, minCommentIdx)
      commentPart = line.slice(minCommentIdx)
    }

    // Tokenize the code part using JS tokenizer for all langs as a fallback
    let codeHtml = ""
    if (lang === "javascript" || lang === "typescript") {
      codeHtml = renderTokens(tokenizeJavaScript(codePart))
    } else {
      codeHtml = tokenizeKeywords(codePart, LANG_KEYWORDS[lang] || [], LANG_BUILTINS[lang] || [])
    }

    if (commentPart) {
      codeHtml += `<span class="se-token se-comment">${htmlEscape(commentPart)}</span>`
    }

    result.push(codeHtml)
  }

  return result.join("\n")
}

function htmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function renderTokens(tokens: Token[]): string {
  return tokens.map(t => {
    if (t.type === "variable") return htmlEscape(t.text)
    return `<span class="se-token se-${t.type}">${htmlEscape(t.text)}</span>`
  }).join("")
}

function tokenizeKeywords(code: string, keywords: string[], builtins: string[]): string {
  const parts: string[] = []
  let i = 0
  while (i < code.length) {
    if (/[a-zA-Z_]/.test(code[i])) {
      let end = i
      while (/[a-zA-Z0-9_]/.test(code[end])) end++
      const word = code.slice(i, end)
      if (keywords.includes(word)) {
        parts.push(`<span class="se-token se-keyword">${htmlEscape(word)}</span>`)
      } else if (builtins.includes(word)) {
        parts.push(`<span class="se-token se-builtin">${htmlEscape(word)}</span>`)
      } else if (end < code.length && (code[end] === "(" || code[end] === "{")) {
        parts.push(`<span class="se-token se-function">${htmlEscape(word)}</span>`)
      } else {
        parts.push(htmlEscape(word))
      }
      i = end
      continue
    }
    if (/[0-9]/.test(code[i])) {
      let end = i
      while (/[0-9.xXa-fA-F]/.test(code[end])) end++
      parts.push(`<span class="se-token se-number">${htmlEscape(code.slice(i, end))}</span>`)
      i = end
      continue
    }
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i]
      let end = i + 1
      while (end < code.length && code[end] !== quote) {
        if (code[end] === "\\") end++
        end++
      }
      parts.push(`<span class="se-token se-string">${htmlEscape(code.slice(i, Math.min(end + 1, code.length)))}</span>`)
      i = Math.min(end + 1, code.length)
      continue
    }
    parts.push(htmlEscape(code[i]))
    i++
  }
  return parts.join("")
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
    return () => events.forEach((e) => textarea.removeEventListener(e, syncScroll))
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
          "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`",
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
      <div style={{
        lineHeight: "1.5",
        paddingTop: `${paddingTop}px`,
        fontSize: `${fontSize}px`,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
      }}>
        {lines.map((_, i) => (
          <div key={i} style={{
            color: theme === "dark" ? "#4B5563" : "#D1D5DB",
            userSelect: "none", textAlign: "right",
            paddingRight: isMobile ? "8px" : "12px",
            minWidth: isMobile ? "2.5rem" : "3rem",
            height: `${lineHeight}px`, display: "flex",
            alignItems: "flex-start", justifyContent: "flex-end",
            boxSizing: "border-box", margin: 0, border: 0,
          }}>
            {i + 1}
          </div>
        ))}
      </div>
    )
  }, [code, fontSize, theme, isMobile])

  const tokenColors = theme === "dark" ? DARK_TOKENS : LIGHT_TOKENS
  const font = `${isMobile ? Math.max(fontSize - 2, 12) : fontSize}px`
  const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
  const lh = "1.5"
  const pad = isMobile ? "12px" : "16px"
  const ws = wordWrap ? "pre-wrap" : "pre"
  const wb = wordWrap ? "break-word" : "normal"

  const cssRules = Object.entries(tokenColors)
    .map(([token, color]) => `.se-token.se-${token}{color:${color}!important}`)
    .join("\n")

  const baseColor = theme === "dark" ? "#E2E8F0" : "#1E293B"
  const bgColor = theme === "dark" ? "#111827" : "#FFFFFF"

  const highlightedHtml = tokenizeCode(code, language)

  return (
    <div
      ref={containerRef}
      className={`relative font-mono ${className} overflow-hidden rounded-lg border-2 transition-all duration-200 ${
        isFocused
          ? theme === "dark" ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-blue-500 shadow-lg shadow-blue-500/10"
          : theme === "dark" ? "border-gray-700" : "border-gray-300"
      }`}
      style={{ backgroundColor: bgColor, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <style dangerouslySetInnerHTML={{ __html: cssRules }} />

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

        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
          {/* Highlighted code layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              fontSize: font, lineHeight: lh, padding: pad,
              whiteSpace: ws, wordBreak: wb, fontFamily: mono,
              margin: 0, border: 0, overflow: "hidden",
              height: "100%", width: "100%", boxSizing: "border-box", tabSize: 2,
              color: baseColor,
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              pointerEvents: "none",
            }}
          >
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }} />
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
              fontSize: font, lineHeight: lh, padding: pad,
              whiteSpace: ws, wordBreak: wb, fontFamily: mono,
              margin: 0, border: 0, overflow: "auto",
              height: "100%", width: "100%", boxSizing: "border-box", tabSize: 2,
              color: "transparent",
              caretColor: theme === "dark" ? "#60A5FA" : "#2563EB",
              backgroundColor: "transparent",
              position: "relative", zIndex: 1,
            }}
            spellCheck="false" autoComplete="off" autoCorrect="off" autoCapitalize="off"
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
