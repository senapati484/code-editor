# o2 code — Online Code Editor

**o2 code** is a sleek, modern, minimal multi-language online code editor and compiler. It ships **19 language runtimes** out of the box, blends browser-native WebAssembly (WASM) execution with a server-side compile API for native languages, and exposes every playground via deep-linkable URLs and a clean iFrame embed API.

> **Live app:** [o2code.vercel.app](https://o2code.vercel.app) · **Embedding guide:** see [`EMBED_GUIDE.md`](./EMBED_GUIDE.md).

---

## ✨ Key Features

- **19 language runtimes** — JavaScript, TypeScript, Python, SQL, HTML/CSS/JS sandbox, C, C++, Java, Rust, Go, Ruby, PHP, Swift, Kotlin, C#, R, Perl, Scala, Haskell, Lua.
- **Client-side WASM for the languages that need zero latency** — JavaScript, TypeScript, Python (Pyodide), SQL (sql.js), and Lua (fengari) all run inside the browser sandbox.
- **Server-side compilation for native languages** — C, C++, Java, Rust, Go, Ruby, PHP, Swift, Kotlin, C#, R, Perl, Scala, and Haskell are dispatched through the `/api/compile` proxy to the Paiza.io runner with a 25 s timeout, so the editor stays responsive and builds never run in the user's browser.
- **HTML Sandbox** — split-pane editor (HTML / CSS / JS tabs) with a live responsive iframe preview, custom console logger, and zero iframe-sandbox escape risk.
- **Resizable split-pane workspaces** — drag to resize the editor / output panels on desktop; mobile gets a tabbed output view.
- **Brand-accurate language icons** — `react-icons` brand marks for every language, sized and color-matched per language.
- **Glassmorphic header + sticky mobile nav** — clean, minimal, Linear-style interface on desktop and a touch-friendly bottom nav on mobile.
- **Dark / Light themes** — toggled from the sidebar or mobile bar via CSS variable tokens, so every component flips in one frame.
- **Theme & editor settings persisted to `localStorage`** — your theme, font size, word-wrap, and so on survive reloads.
- **URL sharing & auto-run** — every playground reads its initial code from a Base64 query param and can run it on load.
- **iframe embedding** — `?embed=true` hides the sidebar; `?embed=full` hides the header too. See the full integration guide.
- **Custom reset confirmation** — Radix-based `AlertDialog` so reloads don't blow away your snippets by accident.

---

## 🌐 Supported Languages & Runtimes

| Language         | URL Slug       | Runtime                          | Brand color |
| :---             | :---           | :---                             | ---:        |
| **HTML Sandbox** | `/html`        | Browser iframe preview           | `#E34F26`   |
| **JavaScript**   | `/javascript`  | Browser WASM sandbox             | `#F7DF1E`   |
| **TypeScript**   | `/typescript`  | Browser TS compiler              | `#3178C6`   |
| **Python 3**     | `/python`      | Browser (Pyodide WASM)           | `#3776AB`   |
| **C**            | `/c`           | Server (Paiza GCC)               | `#A8B9CC`   |
| **C++**          | `/cpp`         | Server (Paiza G++)               | `#00599C`   |
| **Java**         | `/java`        | Server (Paiza JDK)               | `#E76F51`   |
| **Rust**         | `/rust`        | Server (Paiza rustc)             | `#E05D2B`   |
| **Go**           | `/go`          | Server (Paiza go)                | `#00ADD8`   |
| **Ruby**         | `/ruby`        | Server (Paiza ruby)              | `#CC342D`   |
| **PHP**          | `/php`         | Server (Paiza php)               | `#777BB4`   |
| **SQL (SQLite)** | `/sql`         | Browser (sql.js WASM)            | `#00758F`   |
| **Swift**        | `/swift`       | Server (Paiza swift)             | `#F05138`   |
| **Kotlin**       | `/kotlin`      | Server (Paiza kotlin)            | `#7F52FF`   |
| **C#**           | `/csharp`      | Server (Paiza csharp / Mono)     | `#512BD4`   |
| **R**            | `/r`           | Server (Paiza R)                 | `#276DC3`   |
| **Perl**         | `/perl`        | Server (Paiza perl)              | `#39457E`   |
| **Scala**        | `/scala`       | Server (Paiza scala)             | `#DC322F`   |
| **Haskell**      | `/haskell`     | Server (Paiza haskell / GHC)     | `#5E5086`   |
| **Lua**          | `/lua`         | Browser (fengari WASM)           | `#000080`   |

> Swift, Kotlin, C#, R, Perl, Scala, and Haskell run through the same `/api/compile` proxy — they need outbound internet to `api.paiza.io`, just like C/C++/Java.

---

## 🧱 Tech Stack

- **Framework:** [Next.js 15.2.8 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) with React 19
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) + CSS variables for theming
- **UI primitives:** [Radix UI](https://www.radix-ui.com/) (`AlertDialog`, `Tooltip`, `DropdownMenu`, `Dialog`, …)
- **Icons:** [`react-icons`](https://react-icons.github.io/react-icons/) (brand-accurate per language) + [`lucide-react`](https://lucide.dev/) for UI chrome (sidebar logo, theme toggle, run button, etc.)
- **Editor:** Custom syntax highlighter (`components/syntax-highlighter.tsx`) that overlays an absolutely-positioned `<textarea>` on top of a tokenized `<pre>` so highlights stay in sync with the caret.
- **Resizable panes:** [`react-resizable-panels`](https://react-resizable-panels.vercel.app/) for desktop split views.
- **Client-side runtimes:**
  - Python → [Pyodide](https://pyodide.org/) v0.24.1 (`cdn.jsdelivr.net`)
  - SQL → [sql.js](https://github.com/sql-js/sql.js) v1.12.0 (`cdnjs`)
  - Lua → [fengari-web](https://github.com/fengari-lua/fengari-web) v0.1.4 (`unpkg`)
- **Server-side compile API:** [`/api/compile`](./app/api/compile/route.ts) → [api.paiza.io](https://paiza.io/) runner with a 25 s request timeout and AbortSignal fallback.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 (Next.js 15 needs 18.17+; 20 LTS recommended)
- **npm** (or pnpm / yarn — examples use npm)

### Local development

```bash
# 1. Clone
git clone https://github.com/senapati484/code-editor.git
cd code-editor

# 2. Install
npm install

# 3. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pick a language tile, type, hit **Run** (or press `Ctrl`/`⌘` + `Enter`).

### Production build

```bash
npm run build   # generates .next/
npm run start   # serves the built app
```

### Deployment

Deploy to [Vercel](https://vercel.com) with the button below — no extra config needed, the project is fully Next.js idiomatic.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsenapati484%2Fcode-editor)

The server-side compile route requires outbound HTTPS to `api.paiza.io`; that's allowed by default on Vercel.

---

## 🗂 Project Layout

```
app/
├─ layout.tsx              # Root layout — theme provider, analytics
├─ page.tsx                # "/" dashboard with all 19 language tiles
├─ html/page.tsx           # "/html" HTML/CSS/JS sandbox
├─ [language]/page.tsx     # "/javascript", "/python", "/c", … generic playground
└─ api/compile/route.ts    # POST handler that proxies to api.paiza.io

components/
├─ sidebar-nav.tsx         # Desktop sidebar (md+) and mobile bottom bar
├─ syntax-highlighter.tsx  # Token-aware overlay editor (memoized on code+lang)
├─ preview-panel.tsx       # HTML sandbox iframe + console
└─ ui/…                    # shadcn-style primitives (button, tooltip, …)

contexts/
└─ settings-context.tsx    # Theme + editor settings, persisted to localStorage

types/
└─ react-icons.d.ts        # Ambient types for fa / fa6 / si module imports
```

> Legacy files (`components/CodeEditor.tsx`, `utils/file-system.ts`, `utils/language-runners.ts`) are kept around for backwards compatibility but are not linked from any production route. They'll be cleaned up post-launch.

---

## 🔗 Embedding & Integration

See [`EMBED_GUIDE.md`](./EMBED_GUIDE.md) for the full reference on:

- URL parameters (`?code=`, `?run=`, `?embed=`)
- Base64-encoding your code in the URL
- iFrame snippets for blogs, LMS, Notion, docs sites
- React / JS helpers (`createO2CodeURL`, `embedO2Code`, `<O2CodeEmbed />`)
- Per-language offline / online table
- Troubleshooting (CSP, fetch errors, hash fragment fallback, …)

TL;DR — embed any playground with one line:

```html
<iframe
  src="https://o2code.vercel.app/python?embed=true"
  width="100%" height="500"
  style="border:none; border-radius:12px;"
  title="o2 code"
  allow="clipboard-write"
></iframe>
```

---

## 🎨 Theming & Settings

Theme is controlled through `contexts/settings-context.tsx` and persists to `localStorage`. Toggle via the sidebar (desktop) or the bottom-nav button (mobile).

CSS tokens live in `app/globals.css` as HSL variables (`--background`, `--foreground`, `--accent`, …). To add a third theme, fork the `[data-theme="…"]` block and set the same variables.

---

## 🤝 Contributing

PRs welcome. A few conventions:

- Keep one runtime per file when they get large (`app/[language]/page.tsx` is being split).
- Don't reintroduce `react-icons` brand colors that aren't on the official brand palette.
- New language? Update five places: `LANGUAGES` in `app/[language]/page.tsx`, `PAIZA_LANG` in `app/api/compile/route.ts`, the `PLAYGROUNDS` array in `app/page.tsx`, the `navItems` in `components/sidebar-nav.tsx`, and the supported-runtimes table above.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) if your fork ships one.
