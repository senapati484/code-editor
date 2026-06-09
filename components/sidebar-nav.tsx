"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/settings-context";
import O2Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Code2,
  Globe,
  Terminal,
  Cpu,
  Coffee,
  Boxes,
  Sun,
  Moon,
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
      icon: Globe,
      href: "/html",
      color: "text-orange-500",
    },
    {
      name: "JavaScript",
      icon: Code2,
      href: "/javascript",
      color: "text-yellow-500",
    },
    {
      name: "TypeScript",
      icon: Terminal,
      href: "/typescript",
      color: "text-blue-500",
    },
    {
      name: "Python",
      icon: Terminal,
      href: "/python",
      color: "text-emerald-500",
    },
    {
      name: "C",
      icon: Cpu,
      href: "/c",
      color: "text-indigo-500",
    },
    {
      name: "C++",
      icon: Cpu,
      href: "/cpp",
      color: "text-cyan-500",
    },
    {
      name: "Java",
      icon: Coffee,
      href: "/java",
      color: "text-rose-500",
    },
    {
      name: "Rust",
      icon: Boxes,
      href: "/rust",
      color: "text-orange-600",
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
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-transparent hover:scale-105 transition-transform duration-205"
          >
            <O2Logo className="w-8 h-8" />
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 rounded-full animate-pulse ${
              isDark ? "border-[#161b22]" : "border-slate-50"
            }`} />
          </Link>

          <div className={`w-8 h-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

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
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative group ${
                        isActive
                          ? isDark 
                            ? "bg-slate-800 text-white shadow-inner scale-105 border-l-2 border-indigo-500"
                            : "bg-slate-200 text-slate-900 shadow-sm scale-105 border-l-2 border-indigo-500"
                          : isDark
                            ? "hover:bg-slate-850 hover:text-slate-200"
                            : "hover:bg-slate-200 hover:text-slate-800"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        isActive 
                          ? item.color 
                          : isDark ? "text-slate-450 group-hover:scale-110 transition-transform duration-200" : "text-slate-600 group-hover:scale-110 transition-transform duration-200"
                      }`} />
                      
                      {/* Left border indicator */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={isDark ? "bg-slate-950 text-slate-250 border-slate-800" : "bg-white text-slate-700 border-slate-200"}>
                    <p className="text-xs font-semibold">{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <div className={`w-8 h-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-xl transition-colors ${
                  isDark 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-850" 
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
                  : isDark ? "text-slate-450" : "text-slate-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? item.color : isDark ? "text-slate-450" : "text-slate-600"}`} />
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
