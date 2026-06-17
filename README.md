# o2 code — Online Code Editor 🚀

**o2 code** is a sleek, modern, and minimal multi-language online code editor and compiler. It supports 11+ programming languages, utilizing browser-powered WebAssembly (WASM) runtimes for client-side execution, and secure remote compilation environments for server-side languages.

---

## Key Features

- **Sleek & Minimal UI**: A Linear-style dark charcoal-zinc design theme by default, complete with glassmorphic top headers, thin elegant separators, and custom-styled scrollbars.
- **Dynamic Mouse Glow Effects**: Language selection cards on the homepage animate with soft, customized brand-color radial glows and matching borders on hover.
- **Client-Side WASM Sandboxing**: Run JavaScript, TypeScript, Python, and SQL (SQLite) directly in your browser with zero latency.
- **Server-Side Compiler Execution**: Secure compile engines for C, C++, Java, Rust, Go, Ruby, and PHP.
- **HTML Sandbox**: A dedicated front-end workspace where you can code HTML, CSS, and JS simultaneously with a live responsive iframe preview and a custom logger console.
- **Theme Support**: Toggles between the ultra-sleek Charcoal-Dark theme and a clean, high-contrast Crisp-Light theme.
- **Custom Reset Popups**: Built-in Radix-based custom `AlertDialog` confirmation windows to prevent accidental template resets.

---

## Supported Languages & Runtimes

| Language | Extension | Runtime Type | Brand Color |
| :--- | :--- | :--- | :--- |
| **JavaScript** | `.js` | Client-Side (JS Engine) | `#F7DF1E` |
| **TypeScript** | `.ts` | Client-Side (JS Engine) | `#3178C6` |
| **Python** | `.py` | Client-Side (Pyodide WASM) | `#3776AB` |
| **SQL (SQLite)** | `.sql` | Client-Side (sql.js WASM) | `#00758F` |
| **C** | `.c` | Server-Side (GCC Compiler) | `#A8B9CC` |
| **C++** | `.cpp` | Server-Side (G++ Compiler) | `#00599C` |
| **Java** | `.java` | Server-Side (JDK Environment) | `#E76F51` |
| **Rust** | `.rs` | Server-Side (Rustc Compiler) | `#E05D2B` |
| **Go** | `.go` | Server-Side (Go Compiler) | `#00ADD8` |
| **Ruby** | `.rb` | Server-Side (Ruby Interpreter) | `#CC342D` |
| **PHP** | `.php` | Server-Side (PHP Interpreter) | `#777BB4` |

---

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI Primitives](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Editor**: Custom Syntax Highlighter with inline textarea overlays

---

## Getting Started

Follow these steps to run the application locally:

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** or **pnpm** installed.

### Installation

1. Clone this repository to your local workspace:
   ```bash
   git clone https://github.com/senapati484/code-editor.git
   cd code-editor
   ```

2. Install the package dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Spin up the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) (or whichever port is shown in the terminal) in your browser to experience **o2 code**.
