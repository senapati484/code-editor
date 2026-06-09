"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";
import O2Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";
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
      icon: FaHtml5,
      href: "/html",
      color: "text-[#E34F26]",
    },
    {
      name: "JavaScript",
      icon: SiJavascript,
      href: "/javascript",
      color: "text-[#F7DF1E]",
    },
    {
      name: "TypeScript",
      icon: SiTypescript,
      href: "/typescript",
      color: "text-[#3178C6]",
    },
    {
      name: "Python",
      icon: SiPython,
      href: "/python",
      color: "text-[#3776AB]",
    },
    {
      name: "C",
      icon: SiC,
      href: "/c",
      color: "text-[#A8B9CC]",
    },
    {
      name: "C++",
      icon: SiCplusplus,
      href: "/cpp",
      color: "text-[#00599C]",
    },
    {
      name: "Java",
      icon: FaJava,
      href: "/java",
      color: "text-[#E76F51]",
    },
    {
      name: "Rust",
      icon: SiRust,
      href: "/rust",
      color: "text-[#E05D2B]",
    },
    {
      name: "Go",
      icon: FaGolang,
      href: "/go",
      color: "text-[#00ADD8]",
    },
    {
      name: "Ruby",
      icon: SiRuby,
      href: "/ruby",
      color: "text-[#CC342D]",
    },
    {
      name: "PHP",
      icon: SiPhp,
      href: "/php",
      color: "text-[#777BB4]",
    },
  ];

  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col items-center justify-between w-16 h-screen py-4 border-r shrink-0 sticky top-0 z-40 transition-colors duration-200 ${
        isDark 
          ? "bg-[#161b22] border-slate-800 text-slate-400" 
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        <div className="flex flex-col items-center gap-6 w-full overflow-y-auto no-scrollbar py-2">
          {/* Logo */}
          <Link 
            href="/" 
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-transparent hover:scale-105 transition-transform duration-205 shrink-0"
          >
            <O2Logo className="w-8 h-8" />
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 rounded-full animate-pulse ${
              isDark ? "border-[#161b22]" : "border-slate-50"
            }`} />
          </Link>

          <div className={`w-8 h-px shrink-0 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-3 w-full px-2">
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
                          ? isDark 
                            ? "bg-slate-800 text-white shadow-inner scale-105 border-l-2 border-indigo-500"
                            : "bg-slate-200 text-slate-900 shadow-sm scale-105 border-l-2 border-indigo-500"
                          : isDark
                            ? "hover:bg-slate-800 hover:text-slate-200"
                            : "hover:bg-slate-200 hover:text-slate-800"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        isActive 
                          ? item.color 
                          : isDark ? "text-slate-400 group-hover:scale-110 transition-transform duration-200" : "text-slate-500 group-hover:scale-110 transition-transform duration-200"
                      }`} />
                      
                      {/* Left border indicator */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={isDark ? "bg-slate-950 text-slate-200 border-slate-800" : "bg-white text-slate-700 border-slate-200"}>
                    <p className="text-xs font-semibold">{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2 mt-auto pt-2 shrink-0">
          <div className={`w-8 h-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-xl transition-colors ${
                  isDark 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className={isDark ? "bg-slate-950 text-slate-250 border-slate-800" : "bg-white text-slate-700 border-slate-200"}>
              <p className="text-xs font-semibold">Toggle Theme</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around px-4 z-50 transition-colors duration-200 ${
        isDark 
          ? "bg-[#161b22]/95 border-slate-800" 
          : "bg-slate-50/95 border-slate-200"
      }`}>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 relative ${
                isActive 
                  ? isDark ? "text-white scale-105" : "text-slate-900 scale-105" 
                  : isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? item.color : isDark ? "text-slate-400" : "text-slate-600"}`} />
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
          className={`flex flex-col items-center justify-center w-12 h-12 transition-colors ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
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
