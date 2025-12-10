"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, X, Play, Square, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TerminalPanelProps {
  output: string;
  isRunning: boolean;
  onClear: () => void;
  theme: any;
  language: string;
}

export default function TerminalPanel({
  output,
  isRunning,
  onClear,
  theme,
  language,
}: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const getLanguageName = () => {
    const langMap: Record<string, string> = {
      js: "JavaScript",
      ts: "TypeScript",
      py: "Python",
      c: "C",
    };
    return langMap[language] || "Code";
  };

  return (
    <Card
      className={`p-3 ${theme.primary} ${theme.border} flex flex-col h-full`}
      role="complementary"
      aria-label="Terminal output"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Output</span>
          <span className="text-xs text-muted-foreground">
            ({getLanguageName()})
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Running...</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClear}
            title="Clear output"
            disabled={!output}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-[200px]">
        <div
          ref={scrollRef}
          className="font-mono text-sm p-3 rounded-lg bg-background border border-border min-h-full"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
            minHeight: "200px",
          }}
        >
          {output ? (
            <div className="text-foreground whitespace-pre-wrap">{output}</div>
          ) : (
            <div className="text-muted-foreground text-center py-8 h-full flex flex-col items-center justify-center">
              <Terminal className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No output yet</p>
              <p className="text-xs mt-1 opacity-70">
                Click the Run button to execute your code
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

