"use client";

import React, { useState } from "react";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { useSettings } from "@/contexts/settings-context";
import { ArrowRight, Github, Database } from "lucide-react";
import { FaHtml5, FaJava } from "react-icons/fa";
import { FaGolang } from "react-icons/fa6";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiC,
  SiCplusplus,
  SiRust,
  SiRuby,
  SiPhp,
} from "react-icons/si";

interface CompilerCard {
  name: string;
  id: string;
  category: string;
  runtime: string;
  icon: React.ComponentType<any>;
  color: string;
  brandColor: string;
}

const PLAYGROUNDS: CompilerCard[] = [
  {
    name: "HTML Sandbox",
    id: "html",
    category: "Web Frontend",
    runtime: "Browser Preview",
    icon: FaHtml5,
    color: "text-[#E34F26]",
    brandColor: "#E34F26",
  },
  {
    name: "JavaScript",
    id: "javascript",
    category: "Scripting",
    runtime: "WASM Sandbox",
    icon: SiJavascript,
    color: "text-[#F7DF1E]",
    brandColor: "#F7DF1E",
  },
  {
    name: "TypeScript",
    id: "typescript",
    category: "Scripting",
    runtime: "WASM Compiler",
    icon: SiTypescript,
    color: "text-[#3178C6]",
    brandColor: "#3178C6",
  },
  {
    name: "Python 3",
    id: "python",
    category: "Scripting",
    runtime: "Pyodide WASM",
    icon: SiPython,
    color: "text-[#3776AB]",
    brandColor: "#3776AB",
  },
  {
    name: "C Language",
    id: "c",
    category: "System",
    runtime: "GCC Compiler",
    icon: SiC,
    color: "text-[#A8B9CC]",
    brandColor: "#A8B9CC",
  },
  {
    name: "C++",
    id: "cpp",
    category: "System",
    runtime: "G++ Compiler",
    icon: SiCplusplus,
    color: "text-[#00599C]",
    brandColor: "#00599C",
  },
  {
    name: "Java",
    id: "java",
    category: "OOP",
    runtime: "OpenJDK VM",
    icon: FaJava,
    color: "text-[#E76F51]",
    brandColor: "#E76F51",
  },
  {
    name: "Rust",
    id: "rust",
    category: "System",
    runtime: "Rustc Compiler",
    icon: SiRust,
    color: "text-[#E05D2B]",
    brandColor: "#E05D2B",
  },
  {
    name: "Go Language",
    id: "go",
    category: "System",
    runtime: "Go Compiler",
    icon: FaGolang,
    color: "text-[#00ADD8]",
    brandColor: "#00ADD8",
  },
  {
    name: "Ruby",
    id: "ruby",
    category: "Scripting",
    runtime: "Ruby Interpreter",
    icon: SiRuby,
    color: "text-[#CC342D]",
    brandColor: "#CC342D",
  },
  {
    name: "PHP",
    id: "php",
    category: "Backend",
    runtime: "PHP Engine",
    icon: SiPhp,
    color: "text-[#777BB4]",
    brandColor: "#777BB4",
  },
  {
    name: "SQL (SQLite)",
    id: "sql",
    category: "Database",
    runtime: "SQLite WASM",
    icon: Database,
    color: "text-[#00758F]",
    brandColor: "#00758F",
  },
];

export default function DashboardPage() {
  const { theme } = useSettings();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const isDark = theme === "dark";

  return (
    <div className="flex w-full max-w-full overflow-x-hidden min-h-screen bg-background text-foreground transition-colors duration-200">
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-y-auto p-6 md:p-10 pb-24 md:pb-10 max-w-5xl mx-auto w-full">
        {/* Header section */}
        <header className="mb-10 border-b border-border/50 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-foreground">o2 code</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Select a template to start writing and executing code instantly.
            </p>
          </div>
          
          <a
            href="https://github.com/senapati484/code-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-muted-foreground/30 transition-all shadow-sm"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </header>

        {/* Playgrounds grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAYGROUNDS.map((p) => {
            const Icon = p.icon;
            const href = p.id === "html" ? "/html" : `/${p.id}`;
            const isHovered = hoveredCard === p.id;

            return (
              <Link
                href={href}
                key={p.id}
                className="group block outline-none"
                onMouseEnter={() => setHoveredCard(p.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="p-6 flex flex-col h-48 justify-between transition-all duration-300 rounded-xl border border-border bg-card shadow-sm cursor-pointer"
                  style={
                    isHovered
                      ? {
                          borderColor: p.brandColor,
                          boxShadow: isDark
                            ? `0 0 25px -5px ${p.brandColor}1b, inset 0 0 15px -10px ${p.brandColor}30`
                            : `0 8px 30px -10px ${p.brandColor}25`,
                          transform: "translateY(-2px)",
                        }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center justify-center shrink-0">
                      <Icon
                        className="h-8 w-8 transition-transform group-hover:scale-105 duration-300"
                        style={{ color: p.brandColor }}
                      />
                    </div>
                    
                    <span className="text-[10px] font-mono tracking-wider text-muted-foreground opacity-80 uppercase">
                      {p.runtime}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <ArrowRight 
                        className="h-3.5 w-3.5 text-muted-foreground transition-all duration-300 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0"
                        style={{ color: isHovered ? p.brandColor : undefined }}
                      />
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                      {p.category}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
