// Global type declarations for browser-based language runtimes

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    ts?: any;
    fengari?: {
      lua: any;
      lauxlib: any;
      lualib: any;
    };
  }
}

export {};


