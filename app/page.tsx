"use client";

import React from "react";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { useSettings } from "@/contexts/settings-context";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Code2,
  Terminal,
  Cpu,
  Coffee,
  Boxes,
  Layers,
  ArrowRight,
} from "lucide-react";

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
    icon: Globe,
    color: "text-orange-500",
  },
  {
    name: "JavaScript",
    id: "javascript",
    category: "Scripting",
    runtime: "WASM Sandbox",
    icon: Code2,
    color: "text-yellow-500",
  },
  {
    name: "TypeScript",
    id: "typescript",
    category: "Scripting",
    runtime: "WASM Compiler",
    icon: Terminal,
    color: "text-blue-500",
  },
  {
    name: "Python 3",
    id: "python",
    category: "Scripting",
    runtime: "Pyodide WASM",
    icon: Terminal,
    color: "text-emerald-500",
  },
  {
    name: "C Language",
    id: "c",
    category: "System",
    runtime: "GCC Compiler",
    icon: Cpu,
    color: "text-indigo-500",
  },
  {
    name: "C++",
    id: "cpp",
    category: "System",
    runtime: "G++ Compiler",
    icon: Cpu,
    color: "text-cyan-500",
  },
  {
    name: "Java",
    id: "java",
    category: "OOP",
    runtime: "OpenJDK VM",
    icon: Coffee,
    color: "text-rose-500",
  },
  {
    name: "Rust",
    id: "rust",
    category: "System",
    runtime: "Rustc Compiler",
    icon: Boxes,
    color: "text-orange-600",
  },
  {
    name: "Go Language",
    id: "go",
    category: "System",
    runtime: "Go Compiler",
    icon: Terminal,
    color: "text-sky-500",
  },
  {
    name: "Ruby",
    id: "ruby",
    category: "Scripting",
    runtime: "Ruby Interpreter",
    icon: Layers,
    color: "text-red-500",
  },
  {
    name: "PHP",
    id: "php",
    category: "Backend",
    runtime: "PHP Engine",
    icon: Layers,
    color: "text-violet-500",
  },
];

export default function DashboardPage() {
  const { theme } = useSettings();
  const isDark = theme === "dark";

  return (
    <div className={`flex min-h-screen transition-colors duration-200 ${
      isDark ? "bg-[#0d1117] text-slate-100" : "bg-white text-slate-900"
    }`}>
      <SidebarNav />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Code Editor Playgrounds</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Select a template sandbox to start writing and executing code instantly.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PLAYGROUNDS.map((p) => {
            const Icon = p.icon;
            const href = p.id === "html" ? "/html" : `/${p.id}`;

            return (
              <Link href={href} key={p.id} className="group block">
                <Card className={`p-4 flex flex-col h-full justify-between transition-all border duration-150 ${
                  isDark
                    ? "bg-[#161b22] border-slate-800 hover:border-slate-700 hover:bg-[#1f242c]"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg border ${
                        isDark ? "bg-[#0d1117] border-slate-800" : "bg-white border-slate-200"
                      }`}>
                        <Icon className={`h-4.5 w-4.5 ${p.color}`} />
                      </div>
                      <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                        {p.runtime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold tracking-tight mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {p.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mt-4 transition-colors">
                    <span>Open Sandbox</span>
                    <ArrowRight className="h-3 w-3" />
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
