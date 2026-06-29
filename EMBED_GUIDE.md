# 🚀 O2 Code Editor — Embedding & Integration Guide

> **Live URL:** https://o2code.vercel.app  
> Use O2 Code Editor on **any website, blog, LMS, or app** — no backend required.

---

## 📋 Table of Contents

1. [Supported Languages](#-supported-languages)
2. [URL Structure](#-url-structure)
3. [URL Parameters Reference](#-url-parameters-reference)
4. [Step-by-Step: Pass Code via URL](#-step-by-step-pass-code-via-url)
5. [Embedding with iFrame](#-embedding-with-iframe)
6. [JavaScript Integration](#-javascript-integration)
7. [Real-World Examples](#-real-world-examples)
8. [Testing Links](#-testing-links)
9. [FAQ & Troubleshooting](#-faq--troubleshooting)

---

## 🌐 Supported Languages

The editor ships **19 language runtimes** plus a dedicated HTML/CSS/JS sandbox.

| Language    | URL Slug      | Execution                          |
|-------------|---------------|------------------------------------|
| HTML Sandbox| `/html`       | Browser iframe preview + console   |
| Python 3    | `/python`     | Browser (Pyodide WASM)             |
| JavaScript  | `/javascript` | Browser sandbox                    |
| TypeScript  | `/typescript` | Browser TS compiler                |
| C           | `/c`          | Server (Paiza.io — GCC)            |
| C++         | `/cpp`        | Server (Paiza.io — G++)            |
| Java        | `/java`       | Server (Paiza.io — JDK)            |
| Rust        | `/rust`       | Server (Paiza.io — rustc)          |
| Go          | `/go`         | Server (Paiza.io — go)             |
| Ruby        | `/ruby`       | Server (Paiza.io — ruby)           |
| PHP         | `/php`        | Server (Paiza.io — php)            |
| SQL (SQLite)| `/sql`        | Browser (sql.js WASM)              |
| Swift       | `/swift`      | Server (Paiza.io — swift)          |
| Kotlin      | `/kotlin`     | Server (Paiza.io — kotlin)         |
| C#          | `/csharp`     | Server (Paiza.io — csharp / Mono)  |
| R           | `/r`          | Server (Paiza.io — R)              |
| Perl        | `/perl`       | Server (Paiza.io — perl)           |
| Scala       | `/scala`      | Server (Paiza.io — scala)          |
| Haskell     | `/haskell`    | Server (Paiza.io — GHC)            |
| Lua         | `/lua`        | Browser (fengari WASM)             |

> Server-side languages need outbound internet to `api.paiza.io`. Browser runtimes (Python, JS, TS, SQL, Lua) work fully offline after the first load.

---

## 🔗 URL Structure

```
https://o2code.vercel.app/{language}?code={base64_code}&run=true&embed=true
```

### Parts Explained

| Part         | Description                                      |
|--------------|--------------------------------------------------|
| `{language}` | Language slug (e.g. `python`, `javascript`, `c`) |
| `code`       | Your code — **Base64 encoded**                   |
| `run`        | `true` = auto-run code on page load              |
| `embed`      | `true` = hides nav bar; `full` = hides everything|

> **Short aliases:** `c` = `code`, `r` = `run`, `e` = `embed`

---

## 📖 URL Parameters Reference

| Parameter | Alias | Type    | Description                                           |
|-----------|-------|---------|-------------------------------------------------------|
| `code`    | `c`   | string  | Base64-encoded source code to pre-load                |
| `run`     | `r`   | boolean | Auto-execute code when page loads (`true`/`false`)    |
| `embed`   | `e`   | string  | `true` = hide top nav bar; `full` = hide everything   |

---

## 🛠 Step-by-Step: Pass Code via URL

### Step 1 — Write your code

Write the code you want to share or embed:

```python
# Python example
name = input("Enter your name: ")
print(f"Hello, {name}! Welcome to O2 Code.")
```

---

### Step 2 — Base64 Encode It

Use **any one** of these methods:

#### ✅ Method A: Browser Console (fastest — no install needed)

Open Chrome/Firefox → Press **F12** → Go to **Console** tab → paste:

```javascript
const code = `print("Hello from Python!")`;
const encoded = btoa(unescape(encodeURIComponent(code)));
console.log(encoded);
// Copy the output shown below
```

#### ✅ Method B: Python Terminal

```python
import base64
code = 'print("Hello from Python!")'
encoded = base64.b64encode(code.encode('utf-8')).decode('utf-8')
print(encoded)
```

#### ✅ Method C: Node.js Terminal

```javascript
const code = `print("Hello from Python!")`;
const encoded = Buffer.from(code, 'utf8').toString('base64');
console.log(encoded);
```

#### ✅ Method D: Online Tool

Go to → **https://www.base64encode.org/**  
Paste your code → Click **Encode** → Copy the result.

---

### Step 3 — Build the URL

```
https://o2code.vercel.app/python?code=YOUR_BASE64_HERE&run=true
```

**Example with real encoded code:**

```
https://o2code.vercel.app/python?code=cHJpbnQoIkhlbGxvIGZyb20gUHl0aG9uISIp&run=true
```

---

### Step 4 — Test It in Your Browser

Paste the URL in any browser. You should see:
- ✅ Your code pre-loaded in the editor
- ✅ Code auto-runs instantly (if `run=true`)
- ✅ Output shown in the right panel

---

### Step 5 — Share or Embed

**Share the link directly** via WhatsApp, email, Slack, Notion, etc.

**Or embed it as an iFrame** on your website (see next section).

---

## 🖼 Embedding with iFrame

### Basic Embed (editor only)

```html
<iframe
  src="https://o2code.vercel.app/python?embed=true"
  width="100%"
  height="500"
  style="border: none; border-radius: 12px;"
  title="O2 Code Editor"
  allow="clipboard-write"
></iframe>
```

---

### Embed with Pre-loaded Code + Auto-Run

```html
<iframe
  src="https://o2code.vercel.app/python?code=cHJpbnQoIkhlbGxvIGZyb20gUHl0aG9uISIp&run=true&embed=true"
  width="100%"
  height="500"
  style="border: none; border-radius: 12px;"
  title="Python Playground"
  allow="clipboard-write"
></iframe>
```

---

### Full-Screen Embed (no header, no nav bar)

```html
<iframe
  src="https://o2code.vercel.app/javascript?embed=full"
  width="100%"
  height="600"
  style="border: none;"
  title="JavaScript Playground"
  allow="clipboard-write"
></iframe>
```

---

### Responsive iFrame (adapts to screen size)

```html
<style>
  .o2-wrapper {
    position: relative;
    width: 100%;
    padding-top: 60%;   /* adjust height ratio */
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
  .o2-wrapper iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: none;
  }
</style>

<div class="o2-wrapper">
  <iframe
    src="https://o2code.vercel.app/python?embed=true"
    title="O2 Python Playground"
    allow="clipboard-write"
  ></iframe>
</div>
```

---

## ⚙️ JavaScript Integration

### Utility: Auto-Generate O2 Code URLs

Add this helper to any website:

```javascript
/**
 * Creates a shareable O2 Code Editor URL
 * @param {string} language  - "python" | "javascript" | "java" | "c" | etc.
 * @param {string} code      - raw source code string
 * @param {object} options   - { autoRun: bool, embed: bool | "full" }
 * @returns {string}         - full URL to O2 Code Editor
 */
function createO2CodeURL(language, code, options = {}) {
  const { autoRun = false, embed = false } = options;

  // UTF-8 safe Base64 encoding
  const encoded = btoa(unescape(encodeURIComponent(code)));

  const params = new URLSearchParams({ code: encoded });
  if (autoRun)         params.set("run", "true");
  if (embed === "full") params.set("embed", "full");
  else if (embed)      params.set("embed", "true");

  return `https://o2code.vercel.app/${language}?${params.toString()}`;
}

// ─── Examples ───────────────────────────────────────────────────

// 1. Simple Python link
const pythonURL = createO2CodeURL("python", `print("Hello World!")`);
console.log(pythonURL);

// 2. Auto-run JavaScript
const jsURL = createO2CodeURL(
  "javascript",
  `console.log("Auto-running!");`,
  { autoRun: true }
);
console.log(jsURL);

// 3. Embedded Java without nav bar
const javaURL = createO2CodeURL(
  "java",
  `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
  }`,
  { embed: true, autoRun: true }
);
console.log(javaURL);
```

---

### Programmatically Inject an iFrame

```javascript
function embedO2Code(containerId, language, code, options = {}) {
  const { height = "500px", autoRun = true } = options;
  const url = createO2CodeURL(language, code, { embed: true, autoRun });

  document.getElementById(containerId).innerHTML = `
    <iframe
      src="${url}"
      width="100%"
      height="${height}"
      style="border:none; border-radius:12px;"
      title="O2 Code Editor - ${language}"
      allow="clipboard-write"
    ></iframe>
  `;
}

// Usage — inject Python editor into div#editor-box
embedO2Code("editor-box", "python", `
x = int(input("Enter a number: "))
print(f"Square of {x} is {x**2}")
`);
```

---

## 🌍 Real-World Examples

### 📚 Blog / Tutorial Website

Embed runnable code examples directly in your posts:

```html
<p>Try it yourself — edit and run the code below:</p>

<iframe
  src="https://o2code.vercel.app/python?code=ZGVmIGZpYihOKToKICAgIGEsIGIgPSAwLCAxCiAgICBmb3IgXyBpbiByYW5nZShuKToKICAgICAgICBhLCBiID0gYiwgYSArIGIKICAgIHJldHVybiBhCgpwcmludChbZmliKGkpIGZvciBpIGluIHJhbmdlKDEwKV0p&run=true&embed=true"
  width="100%" height="480"
  style="border:none; border-radius:10px;"
  allow="clipboard-write"
></iframe>
```

---

### 🎓 LMS / Moodle / Canvas — Coding Assignment

Paste this HTML block into your LMS HTML editor:

```html
<div style="margin:20px 0;">
  <strong>📝 Task: Fix the bug in this Python function</strong>
  <p style="color:#666;">The function below has a bug. Find it, fix it, and press Run.</p>
  <iframe
    src="https://o2code.vercel.app/python?embed=true&code=ZGVmIGFkZChhLCBiKToKICAgIHJldHVybiBhIC0gYiAgIyBCdWchCgpwcmludChhZGQoMywgNCkpICAjIEV4cGVjdGVkOiA3"
    width="100%" height="450"
    style="border:1px solid #ddd; border-radius:8px;"
    allow="clipboard-write"
  ></iframe>
</div>
```

---

### 📤 Share a Link via WhatsApp / Slack / Email

Run this in your browser console, then copy the URL:

```javascript
const code = `
name = input("What is your name? ")
age  = int(input("How old are you? "))
print(f"Hi {name}! In 10 years you'll be {age + 10}.")
`;
const url = "https://o2code.vercel.app/python?run=true&code="
          + btoa(unescape(encodeURIComponent(code)));
console.log(url);
// Paste this URL anywhere — it opens with code pre-loaded and auto-runs!
```

---

### ⚛️ React Component

```jsx
// O2CodeEmbed.jsx
export function O2CodeEmbed({ language, code, height = 480, autoRun = true }) {
  const encoded = btoa(unescape(encodeURIComponent(code)));
  const src = `https://o2code.vercel.app/${language}`
            + `?code=${encoded}&embed=true`
            + (autoRun ? "&run=true" : "");

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      style={{ border: "none", borderRadius: "12px" }}
      title={`O2 Code - ${language}`}
      allow="clipboard-write"
    />
  );
}

// Usage:
<O2CodeEmbed
  language="python"
  code={`for i in range(1, 6):\n    print(f"Step {i}")`}
  autoRun={true}
  height={420}
/>
```

---

### 📝 GitHub README / Markdown Badge

```markdown
[![Run in O2 Code](https://img.shields.io/badge/Run%20in-O2%20Code-10b981?style=for-the-badge&logo=python)](https://o2code.vercel.app/python?code=cHJpbnQoIkhlbGxvIFdvcmxkISIp&run=true)
```

---

## 🧪 Testing Links

Click or paste these into your browser to test right now:

### 🐍 Python 3
```
https://o2code.vercel.app/python?code=cHJpbnQoIkhlbGxvIGZyb20gUHl0aG9uIDMhIikKZm9yIGkgaW4gcmFuZ2UoMSwgNik6CiAgICBwcmludChmIlN0ZXAge2l9OiB7aSoyfSIp&run=true
```

### 🟨 JavaScript
```
https://o2code.vercel.app/javascript?code=Y29uc3QgYXJyID0gWzEsIDIsIDMsIDQsIDVdOwpjb25zb2xlLmxvZygiU3VtOiIsIGFyci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSk7CmNvbnNvbGUubG9nKCJTcXVhcmVzOiIsIGFyci5tYXAoeCA9PiB4ICogeSkpOw==&run=true
```

### ☕ Java
```
https://o2code.vercel.app/java?code=cHVibGljIGNsYXNzIE1haW4gewogICAgcHVibGljIHN0YXRpYyB2b2lkIG1haW4oU3RyaW5nW10gYXJncykgewogICAgICAgIFN5c3RlbS5vdXQucHJpbnRsbigiSGVsbG8gZnJvbSBKYXZhISIpOwogICAgfQp9&run=true
```

### ⚙️ C++
```
https://o2code.vercel.app/cpp?code=I2luY2x1ZGUgPGlvc3RyZWFtPgp1c2luZyBuYW1lc3BhY2Ugc3RkOwppbnQgbWFpbigpIHsKICAgIGNvdXQgPDwgIkhlbGxvIGZyb20gQysrISIgPDwgZW5kbDsKICAgIHJldHVybiAwOwp9&run=true
```

### 🗄️ SQL (SQLite)
```
https://o2code.vercel.app/sql?code=Q1JFQVRFIFRBQkxFIHVzZXJzIChpZCBJTlRFR0VSIFBSSU1BUlkgS0VZLCBuYW1lIFRFWFQsIGFnZSBJTlRFR0VSKTsKSU5TRVJUIElOVE8gdXNlcnMgVkFMVUVTICgxLCAnQWxpY2UnLCAyNSk7CklOU0VSVCBJTlRPIHVzZXJzIFZBTFVFUyAoMiwgJ0JvYicsIDMwKTsKU0VMRUNUICogRlJPTSB1c2VycyBPUkRFUiBCWSBhZ2UgREVTQzs=&run=true
```

### 🦀 Rust
```
https://o2code.vercel.app/rust?code=Zm4gbWFpbigpIHsKICAgIHByaW50bG4hKCJIZWxsbyBmcm9tIFJ1c3QhIik7CiAgICBmb3IgaSBpbiAxLi49NSB7CiAgICAgICAgcHJpbnRsbiEoImkgPSB7fSIsIGkpOwogICAgfQp9&run=true
```

### 🐹 Go
```
https://o2code.vercel.app/go?code=cGFja2FnZSBtYWluCgppbXBvcnQgImZtdCIKCmZ1bmMgbWFpbigpIHsKICAgIGZtdC5QcmludGxuKCJIZWxsbyBmcm9tIEdvISIpCn0=&run=true
```

---

## ❓ FAQ & Troubleshooting

### Q: My code has special characters and the URL breaks?

**A:** Always use UTF-8-safe Base64:
```javascript
// CORRECT — handles emojis, accents, unicode
const encoded = btoa(unescape(encodeURIComponent(code)));

// WRONG — breaks on non-ASCII
const encoded = btoa(code);
```

---

### Q: The URL is too long to share?

**A:** Use the **hash fragment** (same behaviour, slightly shorter look):
```
https://o2code.vercel.app/python#code=YOUR_BASE64&run=true
```
Or shorten with [tinyurl.com](https://tinyurl.com) / [is.gd](https://is.gd).

---

### Q: Can I pre-fill stdin via URL?

**A:** No — stdin is interactive. When your code calls `input()`, a text box appears live in the terminal. For automation via `postMessage`, contact the site owner.

---

### Q: How to make the editor read-only (view only)?

**A:** Overlay a transparent `div` on the iFrame:
```html
<div style="position:relative; display:inline-block; width:100%;">
  <iframe src="https://o2code.vercel.app/python?embed=true"
    width="100%" height="400" style="border:none;"></iframe>
  <div style="position:absolute;top:0;left:0;width:100%;
    height:100%;z-index:10;cursor:not-allowed;"></div>
</div>
```

---

### Q: iFrame is blocked by my site's security policy?

**A:** Add to your server's `Content-Security-Policy` header:
```
frame-src https://o2code.vercel.app;
```

---

### Q: Java / C++ / Rust / Go (or any server-side language) shows "fetch failed" or "Error"?

**A:** Server-side languages need internet. Check:
1. Internet connection is active
2. `api.paiza.io` is reachable from your network
3. If self-hosting: ensure outbound HTTPS is not blocked by firewall
4. The 25 s request timeout may have been hit — split long-running code into smaller pieces

Python, JavaScript, TypeScript, SQL, and Lua are all client-side and don't need a network round-trip.

---

### Q: Which languages work offline?

| Language                            | Works Offline? |
|-------------------------------------|----------------|
| JavaScript                          | ✅ Yes (after first load) |
| TypeScript                          | ✅ Yes (after first load) |
| SQL (SQLite)                        | ✅ Yes (after first load) |
| Lua                                 | ✅ Yes (after first load) |
| Python                              | ✅ Yes (after first load — needs CDN for Pyodide on first run only) |
| Java / C / C++ / Go / Rust          | ❌ Needs internet (server-side Paiza.io) |
| Ruby / PHP / Swift / Kotlin / C#    | ❌ Needs internet (server-side Paiza.io) |
| R / Perl / Scala / Haskell          | ❌ Needs internet (server-side Paiza.io) |

---

## 📦 Quick Reference Card

```
Base URL:   https://o2code.vercel.app

Languages:  /html  /python  /javascript  /typescript  /c  /cpp
            /java  /rust    /go          /ruby        /php  /sql
            /swift /kotlin  /csharp      /r           /perl /scala
            /haskell  /lua

URL Params:
  code=<base64>   Pre-load source code (Base64 encoded)
  run=true        Auto-execute on page load
  embed=true      Hide top navigation bar
  embed=full      Hide navigation + header completely

How to encode:
  Browser:  btoa(unescape(encodeURIComponent(code)))
  Python:   base64.b64encode(code.encode()).decode()
  Node.js:  Buffer.from(code).toString('base64')

Minimal iFrame:
  <iframe
    src="https://o2code.vercel.app/python?embed=true"
    width="100%" height="500" style="border:none;">
  </iframe>

Full-featured iFrame:
  <iframe
    src="https://o2code.vercel.app/python?code=BASE64&run=true&embed=true"
    width="100%" height="500" style="border:none; border-radius:12px;"
    allow="clipboard-write">
  </iframe>
```

---

*Built with ❤️ — O2 Code Editor | https://o2code.vercel.app*
