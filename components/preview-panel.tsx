"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize, Tablet, Monitor, RefreshCw, ExternalLink, Code2, AlertCircle } from "lucide-react"

interface PreviewPanelProps {
  html: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  theme: any
}

export default function PreviewPanel({ html, isFullscreen, onToggleFullscreen, theme }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet">("desktop")
  const [isLoading, setIsLoading] = useState(false)
  const [key, setKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const getPreviewWidth = () => {
    if (isMobile) return "w-full"
    switch (viewMode) {
      case "tablet":
        return "w-[768px] max-w-[768px]"
      default:
        return "w-full"
    }
  }

  const getPreviewScale = () => {
    if (isMobile) return "scale-100"
    switch (viewMode) {
      case "tablet":
        return "scale-90 origin-top"
      default:
        return "scale-100"
    }
  }

  const refreshPreview = () => {
    setIsLoading(true)
    setPreviewError(null)
    setIsPreviewReady(false)
    setKey((prev) => prev + 1) // Force iframe reload

    setTimeout(() => {
      setIsLoading(false)
      setIsPreviewReady(true)
    }, 800)
  }

  // Enhanced HTML processing for better preview
  const processHtmlForPreview = (htmlContent: string) => {
    if (!htmlContent || !htmlContent.trim()) return ""

    let processedHtml = htmlContent

    // Ensure proper DOCTYPE and HTML structure
    if (!processedHtml.includes("<!DOCTYPE")) {
      if (!processedHtml.includes("<html")) {
        processedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${processedHtml}
</body>
</html>`
      }
    }

    // Ensure mobile viewport meta tag
    if (!processedHtml.includes("viewport")) {
      processedHtml = processedHtml.replace(
        "<head>",
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      )
    }

    // Add error handling script
    const errorHandlingScript = `
    <script>
      window.addEventListener('error', function(e) {
        console.error('Preview Error:', e.error);
        parent.postMessage({type: 'error', message: e.error.message}, '*');
      });
      
      window.addEventListener('load', function() {
        parent.postMessage({type: 'loaded'}, '*');
      });
    </script>`

    if (processedHtml.includes("</body>")) {
      processedHtml = processedHtml.replace("</body>", `${errorHandlingScript}\n</body>`)
    } else {
      processedHtml += errorHandlingScript
    }

    return processedHtml
  }

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "error") {
        setPreviewError(event.data.message)
      } else if (event.data.type === "loaded") {
        setIsPreviewReady(true)
        setPreviewError(null)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Auto-refresh when HTML changes with debouncing
  useEffect(() => {
    if (html && html.trim()) {
      const timer = setTimeout(() => {
        setKey((prev) => prev + 1)
        setIsPreviewReady(false)
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timer)
    }
  }, [html])

  // Open preview in new tab
  const openInNewTab = () => {
    const processedHtml = processHtmlForPreview(html)
    const blob = new Blob([processedHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const hasValidHtml = html && html.trim() && html.trim() !== ""

  return (
    <div className={`flex flex-col h-full ${theme.text}`}>
      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-card border border-border">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Live Preview</span>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                <span>Loading</span>
              </div>
            )}
            {isPreviewReady && !previewError && hasValidHtml && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Ready</span>
              </div>
            )}
            {previewError && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                <span>Error</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* View mode controls */}
          {!isMobile && (
            <div className="flex border border-border rounded-md overflow-hidden mr-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-none ${viewMode === "tablet" ? theme.activeTab : theme.inactiveTab}`}
                onClick={() => setViewMode("tablet")}
                title="Tablet View (768px)"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-none ${viewMode === "desktop" ? theme.activeTab : theme.inactiveTab}`}
                onClick={() => setViewMode("desktop")}
                title="Desktop View (Full Width)"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-accent"
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-accent"
            onClick={openInNewTab}
            title="Open in New Tab"
            disabled={!hasValidHtml}
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button variant="outline" className={`${theme.button} text-xs h-7 px-2`} onClick={onToggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Full</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {previewError && (
        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Preview Error</span>
          </div>
          <p className="text-sm text-destructive mt-1">{previewError}</p>
        </div>
      )}

      <div
        className={`flex-1 rounded-lg border-2 transition-all duration-300 flex justify-center overflow-auto border-border bg-muted`}
        style={{
          minHeight: isMobile ? "300px" : "200px",
          maxHeight: isMobile ? "70vh" : "100%",
        }}
      >
        <div
          className={`h-full ${getPreviewWidth()} transition-all duration-300 ${
            viewMode !== "desktop" && !isMobile ? "border-x-2 border-border" : ""
          }`}
          style={{
            transform: getPreviewScale(),
          }}
        >
          {hasValidHtml ? (
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={processHtmlForPreview(html)}
              className="w-full h-full border-0 rounded-md bg-background shadow-inner"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Live Preview"
              style={{
                minHeight: isMobile ? "300px" : "100%",
              }}
              onLoad={() => {
                setIsLoading(false)
                setIsPreviewReady(true)
              }}
              onError={() => {
                setPreviewError("Failed to load preview")
                setIsLoading(false)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-background rounded-md">
              <div className="text-center p-8">
                {/* replaced emoji with icon to meet icon guidelines */}
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Preview Available</h3>
                <p className="text-sm text-muted-foreground mb-4">Write some HTML code to see the live preview</p>
                <div className="text-xs text-muted-foreground bg-card border border-border p-3 rounded-lg">
                  <p>
                    <strong>Tip:</strong> Your HTML will appear here in real-time
                  </p>
                  <p>CSS and JavaScript files will be automatically included</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{viewMode === "tablet" ? "Tablet (768px)" : "Desktop (Full Width)"}</span>
          {hasValidHtml && <span>✓ {html.split("\n").length} lines</span>}
        </div>
        <div className="text-right">
          <span>Live Preview • Auto-refresh</span>
        </div>
      </div>
    </div>
  )
}
