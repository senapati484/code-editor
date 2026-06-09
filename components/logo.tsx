"use client";

import React from "react";

export default function O2Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="o2-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
        </linearGradient>
      </defs>
      {/* Left Oxygen Atom 'O' */}
      <circle
        cx="38"
        cy="48"
        r="22"
        stroke="url(#o2-grad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Right Oxygen Atom 'O' */}
      <circle
        cx="62"
        cy="48"
        r="16"
        stroke="url(#o2-grad)"
        strokeWidth="6"
      />
      {/* Code slash in between representing bond & code */}
      <path
        d="M45 62L55 34"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        className="text-slate-800 dark:text-slate-100"
      />
      {/* Subscript 2 representing chemical formula */}
      <text
        x="72"
        y="80"
        fill="url(#o2-grad)"
        fontSize="30"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        2
      </text>
    </svg>
  );
}
