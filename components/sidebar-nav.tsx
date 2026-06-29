"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Sun,
  Moon,
  Github,
  Database,
} from "lucide-react";
import {
  Code2,
  Code,
  FileCode,
  Braces,
  Cpu,
  Coffee,
  Wrench,
  Zap,
  Gem,
  Server,
  Wind,
  Triangle,
  Sigma,
  CircleDollarSign,
  Layers,
  Atom,
  Hash,
  Feather,
} from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useSettings();

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      color: "text-indigo-500",
    },
    {
      name: "HTML Sandbox",
      icon: Code2,
      href: "/html",
      color: "text-[#E34F26]",
    },
    {
      name: "JavaScript",
      icon: Code,
      href: "/javascript",
      color: "text-[#F7DF1E]",
    },
    {
      name: "TypeScript",
      icon: FileCode,
      href: "/typescript",
      color: "text-[#3178C6]",
    },
    {
      name: "Python",
      icon: Braces,
      href: "/python",
      color: "text-[#3776AB]",
    },
    {
      name: "C",
      icon: Cpu,
      href: "/c",
      color: "text-[#A8B9CC]",
    },
    {
      name: "C++",
      icon: Cpu,
      href: "/cpp",
      color: "text-[#00599C]",
    },
    {
      name: "Java",
      icon: Coffee,
      href: "/java",
      color: "text-[#E76F51]",
    },
    {
      name: "Rust",
      icon: Wrench,
      href: "/rust",
      color: "text-[#E05D2B]",
    },
    {
      name: "Go",
      icon: Zap,
      href: "/go",
      color: "text-[#00ADD8]",
    },
    {
      name: "Ruby",
      icon: Gem,
      href: "/ruby",
      color: "text-[#CC342D]",
    },
    {
      name: "PHP",
      icon: Server,
      href: "/php",
      color: "text-[#777BB4]",
    },
    {
      name: "SQL",
      icon: Database,
      href: "/sql",
      color: "text-[#00758F]",
    },
    {
      name: "Swift",
      icon: Wind,
      href: "/swift",
      color: "text-[#F05138]",
    },
    {
      name: "Kotlin",
      icon: Triangle,
      href: "/kotlin",
      color: "text-[#7F52FF]",
    },
    {
      name: "C#",
      icon: Hash,
      href: "/csharp",
      color: "text-[#512BD4]",
    },
    {
      name: "R",
      icon: Sigma,
      href: "/r",
      color: "text-[#276DC3]",
    },
    {
      name: "Perl",
      icon: CircleDollarSign,
      href: "/perl",
      color: "text-[#39457E]",
    },
    {
      name: "Scala",
      icon: Layers,
      href: "/scala",
      color: "text-[#DC322F]",
    },
    {
      name: "Haskell",
      icon: Atom,
      href: "/haskell",
      color: "text-[#5E5086]",
    },
    {
      name: "Lua",
      icon: Feather,
      href: "/lua",
      color: "text-[#000080]",
    },
  ];

  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col items-center justify-between w-16 h-screen py-4 border-r border-border bg-background text-muted-foreground shrink-0 sticky top-0 z-40 transition-colors duration-200">
        <div className="flex flex-col items-center gap-6 w-full overflow-y-auto no-scrollbar py-2">
          {/* Logo */}
          <Link 
            href="/" 
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-transparent hover:scale-105 transition-transform duration-200 shrink-0"
          >
            <span className="font-semibold text-lg tracking-tighter text-indigo-500 dark:text-indigo-400 select-none">o2</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
          </Link>

          <div className="w-8 h-px bg-border shrink-0" />

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2.5 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative group shrink-0 ${
                        isActive
                          ? "bg-accent text-foreground shadow-sm scale-105"
                          : "hover:bg-accent/50 hover:text-foreground text-muted-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        isActive 
                          ? item.color 
                          : "text-muted-foreground group-hover:scale-110 transition-transform duration-200"
                      }`} />
                      
                      {/* Left border active indicator */}
                      {isActive && (
                        <div className="absolute left-0 w-0.5 h-4 bg-indigo-500 rounded-r" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    <p className="text-xs font-semibold">{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-2.5 w-full px-2 mt-auto pt-2 shrink-0">
          <div className="w-8 h-px bg-border" />

          {/* GitHub Repo Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com/senapati484/code-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-accent/50 hover:text-foreground text-muted-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
              <p className="text-xs font-semibold">GitHub Repository</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-accent/50 hover:text-foreground text-muted-foreground transition-colors"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
              <p className="text-xs font-semibold">Toggle Theme</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-nav-bar md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around px-4 z-50 transition-colors duration-200 bg-background/95 border-border backdrop-blur-md">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 relative ${
                isActive 
                  ? "text-foreground scale-105 font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? item.color : "text-muted-foreground"}`} />
              <span className="text-[10px] mt-0.5 truncate max-w-full font-medium">
                {item.name.split(" ")[0]}
              </span>
              {isActive && (
                <div className="absolute top-0 w-4 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </Link>
          );
        })}
        
        {/* Mobile Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex flex-col items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-500" />
          )}
          <span className="text-[10px] mt-0.5 font-medium">Theme</span>
        </button>
      </div>
    </TooltipProvider>
  );
}
