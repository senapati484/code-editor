// Language execution utilities for browser-based code execution

// Pyodide for Python execution
let pyodide: any = null;
let pyodideLoading = false;
let pyodideLoadPromise: Promise<any> | null = null;

export async function loadPyodide(): Promise<any> {
  if (pyodide) {
    return pyodide;
  }

  if (pyodideLoading && pyodideLoadPromise) {
    return pyodideLoadPromise;
  }

  pyodideLoading = true;
  pyodideLoadPromise = new Promise(async (resolve, reject) => {
    try {
      // Load Pyodide script first
      if (!(window as any).loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
        script.onload = async () => {
          try {
            // @ts-ignore - Pyodide is loaded from CDN
            const pyodideModule = await (window as any).loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            });
            pyodide = pyodideModule;
            pyodideLoading = false;
            resolve(pyodide);
          } catch (error) {
            pyodideLoading = false;
            pyodideLoadPromise = null;
            reject(error);
          }
        };
        script.onerror = () => {
          pyodideLoading = false;
          pyodideLoadPromise = null;
          reject(new Error("Failed to load Pyodide"));
        };
        document.head.appendChild(script);
      } else {
        try {
          // @ts-ignore - Pyodide is already loaded
          const pyodideModule = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          });
          pyodide = pyodideModule;
          pyodideLoading = false;
          resolve(pyodide);
        } catch (error) {
          pyodideLoading = false;
          pyodideLoadPromise = null;
          reject(error);
        }
      }
    } catch (error) {
      pyodideLoading = false;
      pyodideLoadPromise = null;
      reject(error);
    }
  });

  return pyodideLoadPromise;
}

export async function executePython(code: string): Promise<string> {
  try {
    const pyodideInstance = await loadPyodide();
    
    // Capture stdout
    let output = "";
    pyodideInstance.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
    `);

    try {
      pyodideInstance.runPython(code);
      const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
      const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");
      
      if (stderr) {
        output += `Error: ${stderr}\n`;
      }
      if (stdout) {
        output += stdout;
      }
    } catch (error: any) {
      output += `Python Error: ${error.message || String(error)}\n`;
      const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");
      if (stderr) {
        output += stderr;
      }
    }

    return output || "Code executed successfully. (No output)";
  } catch (error: any) {
    throw new Error(`Failed to execute Python: ${error.message || String(error)}`);
  }
}

// TypeScript compiler
let typescript: any = null;
let typescriptLoading = false;
let typescriptLoadPromise: Promise<any> | null = null;

export async function loadTypeScript(): Promise<any> {
  if (typescript) {
    return typescript;
  }

  if (typescriptLoading && typescriptLoadPromise) {
    return typescriptLoadPromise;
  }

  typescriptLoading = true;
  typescriptLoadPromise = new Promise(async (resolve, reject) => {
    try {
      // Load TypeScript from CDN
      const script = document.createElement("script");
      script.src = "https://unpkg.com/typescript@latest/lib/typescript.js";
      script.onload = () => {
        // @ts-ignore - TypeScript is loaded from CDN
        typescript = window.ts;
        typescriptLoading = false;
        resolve(typescript);
      };
      script.onerror = () => {
        typescriptLoading = false;
        typescriptLoadPromise = null;
        reject(new Error("Failed to load TypeScript compiler"));
      };
      document.head.appendChild(script);
    } catch (error) {
      typescriptLoading = false;
      typescriptLoadPromise = null;
      reject(error);
    }
  });

  return typescriptLoadPromise;
}

export async function compileTypeScript(code: string): Promise<string> {
  try {
    const ts = await loadTypeScript();
    
    const result = ts.transpile(code, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      skipLibCheck: true,
    });

    return result;
  } catch (error: any) {
    throw new Error(`TypeScript compilation error: ${error.message || String(error)}`);
  }
}

// Lua with fengari
let fengari: any = null;
let fengariLoading = false;
let fengariLoadPromise: Promise<any> | null = null;

export async function loadFengari(): Promise<any> {
  if (fengari) {
    return fengari;
  }

  if (fengariLoading && fengariLoadPromise) {
    return fengariLoadPromise;
  }

  fengariLoading = true;
  fengariLoadPromise = new Promise(async (resolve, reject) => {
    try {
      // Load fengari from CDN
      const script = document.createElement("script");
      script.src = "https://unpkg.com/fengari-web@0.1.4/dist/fengari-web.js";
      script.onload = () => {
        // @ts-ignore - fengari is loaded from CDN
        fengari = window.fengari;
        fengariLoading = false;
        resolve(fengari);
      };
      script.onerror = () => {
        fengariLoading = false;
        fengariLoadPromise = null;
        reject(new Error("Failed to load fengari"));
      };
      document.head.appendChild(script);
    } catch (error) {
      fengariLoading = false;
      fengariLoadPromise = null;
      reject(error);
    }
  });

  return fengariLoadPromise;
}

export async function executeLua(code: string): Promise<string> {
  try {
    const fengariInstance = await loadFengari();
    
    if (!fengariInstance) {
      throw new Error("Fengari not properly loaded. Please refresh the page.");
    }

    // Check if fengari has the expected structure
    if (!fengariInstance.lua || !fengariInstance.lauxlib || !fengariInstance.lualib) {
      // Try alternative structure
      if ((fengariInstance as any).lua && (fengariInstance as any).lauxlib) {
        // Use the alternative structure
      } else {
        throw new Error("Fengari API structure not recognized. Using fallback method.");
      }
    }

    // Create a Lua state
    const L = fengariInstance.lua || (fengariInstance as any).lua;
    const lauxlib = fengariInstance.lauxlib || (fengariInstance as any).lauxlib;
    const lualib = fengariInstance.lualib || (fengariInstance as any).lualib;

    if (!L || !lauxlib || !lualib) {
      throw new Error("Fengari libraries not available");
    }

    const L_state = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L_state);

    // Capture print output using a simpler approach
    let output = "";
    
    // Simple print capture setup
    const setupCode = `_output = {}; _old_print = print; print = function(...) local args = {...}; local s = ""; for i=1,#args do s = s .. tostring(args[i]); if i < #args then s = s .. "\\t" end end; table.insert(_output, s) end`;

    // Setup print capture
    const setupResult = lauxlib.luaL_dostring(L_state, setupCode);
    if (setupResult !== 0) {
      const error = L.lua_tostring(L_state, -1);
      L.lua_close(L_state);
      throw new Error(`Setup error: ${error}`);
    }

    // Execute the user code
    const result = lauxlib.luaL_dostring(L_state, code);
    
    if (result !== 0) {
      const error = L.lua_tostring(L_state, -1);
      output = `Lua Error: ${error}\n`;
    } else {
      // Get captured output
      L.lua_getglobal(L_state, "_output");
      if (!L.lua_isnil(L_state, -1)) {
        const bufferLen = L.lua_objlen(L_state, -1);
        for (let i = 1; i <= bufferLen; i++) {
          L.lua_rawgeti(L_state, -1, i);
          const line = L.lua_tostring(L_state, -1);
          if (line) {
            output += line + "\n";
          }
          L.lua_pop(L_state, 1);
        }
      }
    }

    L.lua_close(L_state);

    return output || "Code executed successfully. (No output)";
  } catch (error: any) {
    // Fallback: try to use a simpler Lua execution method
    try {
      // If fengari fails, provide helpful error message
      throw new Error(`Lua execution failed: ${error.message || String(error)}\n\nTip: Make sure fengari library loaded correctly. Try refreshing the page.`);
    } catch (fallbackError: any) {
      throw new Error(`Failed to execute Lua: ${fallbackError.message || String(fallbackError)}`);
    }
  }
}

