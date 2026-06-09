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
        {/* Seamless linear gradient flowing from top-left to bottom-right */}
        <linearGradient id="o2-grad" x1="15" y1="15" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />   {/* Violet-500 */}
          <stop offset="40%" stopColor="#3b82f6" />  {/* Blue-500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
        </linearGradient>
        
        {/* Shadow filter to create the 3D overlapping paper ribbon effect */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-1.5" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
        
        {/* Clip path to create the sharp diagonal cut on the bottom-right corner of the '2' */}
        <clipPath id="cut-off">
          <polygon points="0,0 100,0 100,65 92,65 82,85 0,85" />
        </clipPath>
      </defs>
      
      {/* The O Circle (Background layer) */}
      <circle
        cx="42"
        cy="50"
        r="28"
        stroke="url(#o2-grad)"
        strokeWidth="12"
        fill="none"
      />
      
      {/* The 2 Subscript (Foreground overlapping layer with drop shadow and diagonal cut) */}
      <path
        d="M 58 52 C 58 41, 80 41, 80 54 C 80 64, 62 74, 62 74 L 88 74"
        stroke="url(#o2-grad)"
        strokeWidth="12"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
        filter="url(#shadow)"
        clipPath="url(#cut-off)"
      />
    </svg>
  );
}
