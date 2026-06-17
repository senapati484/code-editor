"use client";

import React from "react";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { useSettings } from "@/contexts/settings-context";
import { Card } from "@/components/ui/card";
import { ArrowRight, Github } from "lucide-react";
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
}

const PLAYGROUNDS: CompilerCard[] = [
  {
    name: "HTML Sandbox",
    id: "html",
    category: "Web Frontend",
    runtime: "Browser Preview",
    icon: FaHtml5,
    color: "text-[#E34F26]",
  },
  {
    name: "JavaScript",
    id: "javascript",
    category: "Scripting",
    runtime: "WASM Sandbox",
    icon: SiJavascript,
    color: "text-[#F7DF1E]",
  },
  {
    name: "TypeScript",
    id: "typescript",
    category: "Scripting",
    runtime: "WASM Compiler",
    icon: SiTypescript,
    color: "text-[#3178C6]",
  },
  {
    name: "Python 3",
    id: "python",
    category: "Scripting",
    runtime: "Pyodide WASM",
    icon: SiPython,
    color: "text-[#3776AB]",
  },
  {
    name: "C Language",
    id: "c",
    category: "System",
    runtime: "GCC Compiler",
    icon: SiC,
    color: "text-[#A8B9CC]",
  },
  {
    name: "C++",
    id: "cpp",
    category: "System",
    runtime: "G++ Compiler",
    icon: SiCplusplus,
    color: "text-[#00599C]",
  },
  {
    name: "Java",
    id: "java",
    category: "OOP",
    runtime: "OpenJDK VM",
    icon: FaJava,
    color: "text-[#E76F51]",
  },
  {
    name: "Rust",
    id: "rust",
    category: "System",
    runtime: "Rustc Compiler",
    icon: SiRust,
    color: "text-[#E05D2B]",
  },
  {
    name: "Go Language",
    id: "go",
    category: "System",
    runtime: "Go Compiler",
    icon: FaGolang,
    color: "text-[#00ADD8]",
  },
  {
    name: "Ruby",
    id: "ruby",
    category: "Scripting",
    runtime: "Ruby Interpreter",
    icon: SiRuby,
    color: "text-[#CC342D]",
  },
  {
    name: "PHP",
    id: "php",
    category: "Backend",
    runtime: "PHP Engine",
    icon: SiPhp,
    color: "text-[#777BB4]",
  },
];

export default function DashboardPage() {
  const { theme } = useSettings();
  const isDark = theme === "dark";

  return (
    <div className={`flex w-full max-w-full overflow-x-hidden min-h-screen transition-colors duration-200 ${
      isDark ? "bg-[#0d1117] text-slate-100" : "bg-white text-slate-900"
    }`}>
      <SidebarNav />

      <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-y-auto p-6 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        <header className="mb-8 border-b border-border pb-6 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">o2 code</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Select a template to start writing and executing code instantly.
            </p>
          </div>
          
          <a
            href="https://github.com/senapati484/code-editor"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isDark 
                ? "bg-[#161b22] border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-[#1f242c]" 
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {PLAYGROUNDS.map((p) => {
            const Icon = p.icon;
            const href = p.id === "html" ? "/html" : `/${p.id}`;

            return (
              <Link href={href} key={p.id} className="group block">
                <Card className={`p-5 flex flex-col h-full justify-between transition-all border duration-250 hover:-translate-y-0.5 hover:shadow-md ${
                  isDark
                    ? "bg-[#161b22] border-slate-800 hover:border-indigo-500/30 hover:bg-[#1a2029]"
                    : "bg-slate-50 border-slate-200 hover:border-indigo-500/30 hover:bg-slate-100/60"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-xl border w-10 h-10 flex items-center justify-center shrink-0 ${
                        isDark ? "bg-[#0d1117] border-slate-800" : "bg-white border-slate-200"
                      }`}>
                        <Icon className={`h-5.5 w-5.5 ${p.color}`} />
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isDark 
                          ? "bg-slate-900/60 border-slate-800/80 text-slate-400" 
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}>
                        {p.runtime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold tracking-tight mb-1 text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {p.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mt-5 transition-colors">
                    <span>Start Coding</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 duration-150" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
