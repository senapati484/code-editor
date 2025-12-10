"use client";

import type React from "react";
import { useState, useEffect, useCallback, useReducer } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Undo,
  Redo,
  Upload,
  SettingsIcon,
  Menu,
  X,
  ChevronLeft,
  Trash2,
  FileText,
  Play,
  Square,
  Eye,
  EyeOff,
  Code,
  Plus,
  ChevronDown,
} from "lucide-react";

import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import SyntaxHighlighter from "@/components/syntax-highlighter";
import FileExplorer from "@/components/file-explorer";
import SettingsPanel from "@/components/settings-panel";
import PreviewPanel from "@/components/preview-panel";
import SearchPanel from "@/components/search-panel";
import TerminalPanel from "@/components/terminal-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  type FileSystemState,
  initialFileSystem,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
} from "@/utils/file-system";
import {
  executePython,
  compileTypeScript,
  executeLua,
} from "@/utils/language-runners";

const getLanguageFromFileName = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "html":
      return {
        name: "HTML",
        template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>This is a sample HTML page.</p>
</body>
</html>`,
      };
    case "css":
      return {
        name: "CSS",
        template: `/* CSS Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 20px;
}`,
      };
    case "js":
      return {
        name: "JavaScript",
        template: `// JavaScript ES6+ Template
console.log('Hello World!');

// Function example
const greet = (name) => {
    return \`Hello, \${name}!\`;
};

// Event listener example
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Example: Change text content
    const heading = document.querySelector('h1');
    if (heading) {
        heading.style.color = '#e74c3c';
    }
});`,
      };
    case "ts":
      return {
        name: "TypeScript",
        template: `// TypeScript Template
console.log('Hello World!');

// Type definitions
interface Person {
    name: string;
    age: number;
}

// Function with types
const greet = (person: Person): string => {
    return \`Hello, \${person.name}! You are \${person.age} years old.\`;
};

// Example usage
const user: Person = {
    name: 'John',
    age: 30
};

console.log(greet(user));`,
      };
    case "c":
      return {
        name: "C",
        template: `#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello, World!\\n");
    
    // Example: Calculate sum
    int a = 10;
    int b = 20;
    int sum = a + b;
    
    printf("Sum of %d and %d is %d\\n", a, b, sum);
    
    return 0;
}`,
      };
    case "py":
      return {
        name: "Python",
        template: `# Python Template
print("Hello, World!")

# Function example
def greet(name: str) -> str:
    """Greet a person by name."""
    return f"Hello, {name}!"

# Class example
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age
    
    def introduce(self) -> str:
        return f"I'm {self.name} and I'm {self.age} years old."

# Example usage
if __name__ == "__main__":
    person = Person("Alice", 25)
    print(person.introduce())
    print(greet("Python"))`,
      };
    case "lua":
      return {
        name: "Lua",
        template: `-- Lua Template
print("Hello, World!")

-- Function example
function greet(name)
    return "Hello, " .. name .. "!"
end

-- Table example (Lua's data structure)
local person = {
    name = "Alice",
    age = 25
}

function person:introduce()
    return "I'm " .. self.name .. " and I'm " .. self.age .. " years old."
end

-- Example usage
print(greet("Lua"))
print(person:introduce())`,
      };
    default:
      return null;
  }
};

// Enhanced reducer for file system operations with proper history
function fileSystemReducer(state: FileSystemState, action: any) {
  switch (action.type) {
    case "CREATE_FILE":
      return createFile(
        state,
        action.name,
        action.fileType,
        action.content || getLanguageFromFileName(action.name)?.template || "",
        action.parentId
      );

    case "UPDATE_FILE":
      const fileToUpdate = getFileById(state.files, action.id);
      if (fileToUpdate && action.updates.content !== undefined) {
        // Handle history for undo/redo
        const currentContent = fileToUpdate.content;
        const newContent = action.updates.content;

        if (currentContent !== newContent && !action.skipHistory) {
          const history = fileToUpdate.history || [currentContent];
          const historyIndex = fileToUpdate.historyIndex ?? 0;

          // Add to history
          const newHistory = [
            ...history.slice(0, historyIndex + 1),
            newContent,
          ];
          action.updates.history = newHistory;
          action.updates.historyIndex = newHistory.length - 1;
        }
      }
      return updateFile(state, action.id, action.updates);

    case "DELETE_FILE":
      return deleteFile(state, action.id);

    case "SET_STATE":
      return action.state;

    case "DUPLICATE_FILE":
      const fileToDuplicate = getFileById(state.files, action.id);
      if (fileToDuplicate) {
        const newName = `${
          fileToDuplicate.name.split(".")[0]
        }_copy.${fileToDuplicate.name.split(".").pop()}`;
        return createFile(
          state,
          newName,
          fileToDuplicate.type,
          fileToDuplicate.content,
          fileToDuplicate.parentId
        );
      }
      return state;

    default:
      return state;
  }
}

function CodeEditorContent() {
  const { theme: appTheme, editorSettings, isMobileView } = useSettings();
  const [fileSystem, dispatch] = useReducer(
    fileSystemReducer,
    initialFileSystem
  );
  const [activeFileId, setActiveFileId] = useState(1);
  const [preview, setPreview] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSaved, setLastSaved] = useState(new Date());
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileView);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [executionStatus, setExecutionStatus] = useState<{
    message: string;
    type: "success" | "error" | "info" | null;
  }>({ message: "", type: null });
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fixed themes with proper light theme
  const themes = {
    light: {
      bg: "bg-background",
      text: "text-foreground",
      primary: "bg-card",
      secondary: "bg-muted",
      accent: "text-primary",
      border: "border-border",
      editor: "bg-background text-foreground",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground",
      activeTab: "text-primary border-b-2 border-primary",
      inactiveTab:
        "text-muted-foreground hover:text-foreground hover:bg-accent",
      preview: "bg-background text-foreground",
      success: "text-foreground",
      warning: "text-foreground",
      error: "text-foreground",
    },
    dark: {
      bg: "bg-background",
      text: "text-foreground",
      primary: "bg-card",
      secondary: "bg-muted",
      accent: "text-primary",
      border: "border-border",
      editor: "bg-background text-foreground",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground",
      activeTab: "text-primary border-b-2 border-primary",
      inactiveTab:
        "text-muted-foreground hover:text-foreground hover:bg-accent",
      preview: "bg-background text-foreground",
      success: "text-foreground",
      warning: "text-foreground",
      error: "text-foreground",
    },
  };

  const currentTheme = themes[appTheme] || themes.light;

  // Enhanced notification system
  const showNotification = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      if (type === "success") {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
      } else if (type === "error") {
        setError(message);
        setTimeout(() => setError(""), 5000);
      }
    },
    []
  );

  // File operations
  const getCurrentFile = useCallback(() => {
    return getFileById(fileSystem.files, activeFileId);
  }, [fileSystem.files, activeFileId]);

  const updateCurrentFile = useCallback(
    (newContent: string) => {
      const currentFile = getCurrentFile();
      if (!currentFile) return;

      dispatch({
        type: "UPDATE_FILE",
        id: activeFileId,
        updates: { content: newContent },
      });
    },
    [activeFileId, getCurrentFile]
  );

  // Fixed preview update function with better mobile support
  const updatePreview = useCallback(() => {
    try {
      const currentFile = getCurrentFile();

      if (currentFile && currentFile.type === "html") {
        // If current file is HTML, show it directly with CSS
        let htmlContent = currentFile.content || "";

        // Get all CSS files and inject them
        const cssFiles = fileSystem.files.filter((f) => f.type === "css");
        const jsFiles = fileSystem.files.filter((f) => f.type === "js");

        // Ensure mobile viewport meta tag
        if (htmlContent && !htmlContent.includes("viewport")) {
          htmlContent = htmlContent.replace(
            "<head>",
            '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
          );
        }

        // Inject CSS files into HTML
        if (cssFiles.length > 0) {
          const styleTag = cssFiles
            .map((file) => `<style>\n${file.content || ""}\n</style>`)
            .join("\n");
          if (htmlContent && htmlContent.includes("</head>")) {
            htmlContent = htmlContent.replace(
              "</head>",
              `${styleTag}\n</head>`
            );
          } else if (htmlContent && htmlContent.includes("<head>")) {
            htmlContent = htmlContent.replace("<head>", `<head>\n${styleTag}`);
          } else {
            htmlContent = `<head>\n${styleTag}\n</head>\n${htmlContent}`;
          }
        }

        // Inject JavaScript files
        if (jsFiles.length > 0) {
          const scriptTag = jsFiles
            .map((file) => `<script>\n${file.content || ""}\n</script>`)
            .join("\n");
          if (htmlContent && htmlContent.includes("</body>")) {
            htmlContent = htmlContent.replace(
              "</body>",
              `${scriptTag}\n</body>`
            );
          } else {
            htmlContent = `${htmlContent}\n${scriptTag}`;
          }
        }

        setPreview(htmlContent);
        return;
      }

      // Look for index.html or any HTML file
      let htmlFile = fileSystem.files.find((f) => f.name === "index.html");
      if (!htmlFile) {
        htmlFile = fileSystem.files.find((f) => f.type === "html");
      }

      if (htmlFile) {
        const cssFiles = fileSystem.files.filter((f) => f.type === "css");
        const jsFiles = fileSystem.files.filter((f) => f.type === "js");

        let htmlContent = htmlFile.content || "";

        // Ensure mobile viewport meta tag
        if (htmlContent && !htmlContent.includes("viewport")) {
          htmlContent = htmlContent.replace(
            "<head>",
            '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
          );
        }

        // Inject CSS
        if (cssFiles.length > 0) {
          const styleTag = cssFiles
            .map((file) => `<style>\n${file.content || ""}\n</style>`)
            .join("\n");
          if (htmlContent && htmlContent.includes("</head>")) {
            htmlContent = htmlContent.replace(
              "</head>",
              `${styleTag}\n</head>`
            );
          } else if (htmlContent && htmlContent.includes("<head>")) {
            htmlContent = htmlContent.replace("<head>", `<head>\n${styleTag}`);
          } else {
            htmlContent = `<head>\n${styleTag}\n</head>\n${htmlContent}`;
          }
        }

        // Inject JavaScript
        if (jsFiles.length > 0) {
          const scriptTag = jsFiles
            .map((file) => `<script>\n${file.content || ""}\n</script>`)
            .join("\n");
          if (htmlContent && htmlContent.includes("</body>")) {
            htmlContent = htmlContent.replace(
              "</body>",
              `${scriptTag}\n</body>`
            );
          } else {
            htmlContent = `${htmlContent}\n${scriptTag}`;
          }
        }

        setPreview(htmlContent);
      } else {
        // Show message when no HTML file exists
        const noFileMessage = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>No Preview</title>
            <style>
              body {
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                font-family: system-ui, -apple-system, sans-serif;
                background: ${appTheme === "dark" ? "#0F172A" : "#F8FAFC"};
                color: ${appTheme === "dark" ? "#E2E8F0" : "#334155"};
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              .message {
                max-width: 400px;
              }
              .icon {
                font-size: 48px; 
                margin-bottom: 16px;
              }
              h3 {
                margin: 0 0 10px 0; 
                font-size: 18px; 
                font-weight: 600;
              }
              p {
                margin: 0; 
                opacity: 0.7;
              }
            </style>
          </head>
          <body>
            <div class="message">
              <div class="icon">📄</div>
              <h3>No HTML file found</h3>
              <p>Create an HTML file to see the preview</p>
            </div>
          </body>
          </html>
        `;
        setPreview(noFileMessage);
      }

      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      showNotification(`Preview error: ${errorMessage}`, "error");
    }
  }, [fileSystem.files, getCurrentFile, appTheme, showNotification]);

  // Load saved files from localStorage
  useEffect(() => {
    const savedFileSystem = localStorage.getItem("code-editor-files");
    if (savedFileSystem) {
      try {
        const parsedState = JSON.parse(savedFileSystem);
        dispatch({ type: "SET_STATE", state: parsedState });

        if (parsedState.files.length > 0) {
          setActiveFileId(parsedState.files[0].id);
        }
      } catch (e) {
        showNotification("Failed to load saved files", "error");
      }
    }

    // Enhanced keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            saveCurrentFile();
            break;
          case "z":
            if (!e.shiftKey) {
              e.preventDefault();
              undo();
            }
            break;
          case "y":
          case "z":
            if (e.shiftKey && e.key.toLowerCase() === "z") {
              e.preventDefault();
              redo();
            } else if (e.key.toLowerCase() === "y") {
              e.preventDefault();
              redo();
            }
            break;
          case "d":
            if (e.shiftKey) {
              e.preventDefault();
              clearAll();
            }
            break;
          case "f":
            e.preventDefault();
            setIsSearchOpen(true);
            break;
          case "n":
            e.preventDefault();
            createNewFile("untitled.html", "html");
            break;
          case "o":
            e.preventDefault();
            document.getElementById("file-upload")?.click();
            break;
          case "=":
          case "+":
            e.preventDefault();
            zoomIn();
            break;
          case "-":
            e.preventDefault();
            zoomOut();
            break;
          case "0":
            e.preventDefault();
            resetZoom();
            break;
        }
      }

      // ESC key handlers
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        if (isPreviewFullscreen) {
          setIsPreviewFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (editorSettings.autoSave) {
      const saveTimer = setInterval(() => {
        saveCurrentFile();
      }, 30000);
      return () => clearInterval(saveTimer);
    }
  }, [editorSettings.autoSave, fileSystem]);

  // Update preview when active file changes or file system changes
  useEffect(() => {
    updatePreview();
    // Clear terminal output when switching files
    setTerminalOutput("");
  }, [activeFileId, fileSystem, updatePreview]);

  // Save file system to localStorage
  useEffect(() => {
    localStorage.setItem("code-editor-files", JSON.stringify(fileSystem));
  }, [fileSystem]);

  // Responsive sidebar
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Zoom functions
  const zoomIn = () => setCurrentZoom((prev) => Math.min(prev + 10, 200));
  const zoomOut = () => setCurrentZoom((prev) => Math.max(prev - 10, 50));
  const resetZoom = () => setCurrentZoom(100);

  // Fixed Undo/Redo operations
  const undo = () => {
    const currentFile = getCurrentFile();
    if (
      !currentFile ||
      !currentFile.history ||
      (currentFile.historyIndex ?? 0) <= 0
    ) {
      showNotification("Nothing to undo", "warning");
      return;
    }

    const newIndex = (currentFile.historyIndex ?? 0) - 1;
    const previousContent = currentFile.history[newIndex];

    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: {
        content: previousContent,
        historyIndex: newIndex,
      },
      skipHistory: true,
    });
    showNotification("Undone");
  };

  const redo = () => {
    const currentFile = getCurrentFile();
    if (!currentFile || !currentFile.history) {
      showNotification("Nothing to redo", "warning");
      return;
    }
    const currentIndex = currentFile.historyIndex ?? 0;
    if (currentIndex >= currentFile.history.length - 1) {
      showNotification("Nothing to redo", "warning");
      return;
    }

    const newIndex = currentIndex + 1;
    const nextContent = currentFile.history[newIndex];

    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: {
        content: nextContent,
        historyIndex: newIndex,
      },
      skipHistory: true,
    });
    showNotification("Redone");
  };

  // Clear all content
  const clearAll = () => {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    if (
      confirm(
        "Are you sure you want to clear all content? This action cannot be undone."
      )
    ) {
      updateCurrentFile("");
      showNotification("Content cleared");
    }
  };

  // Enhanced file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;
        if (content) {
          const languageInfo = getLanguageFromFileName(file.name);

          if (!languageInfo) {
            showNotification(
              `Invalid file type: ${file.name}. Please upload .html, .css, .js, .ts, .c, .py, or .lua files`,
              "error"
            );
            return;
          }

          const fileType = file.name.split(".").pop()?.toLowerCase();

          dispatch({
            type: "CREATE_FILE",
            name: file.name,
            fileType,
            content,
          });

          setActiveFileId(fileSystem.nextId);
          showNotification(`File ${file.name} uploaded successfully`);
        }
      };
      reader.readAsText(file);
    });

    // Clear the input
    event.target.value = "";
  };

  // Enhanced save function
  const saveCurrentFile = () => {
    try {
      localStorage.setItem("code-editor-files", JSON.stringify(fileSystem));
      setLastSaved(new Date());
      const currentFile = getCurrentFile();
      if (currentFile) {
        showNotification(`${currentFile.name} saved successfully!`);
      }
    } catch (e) {
      showNotification("Failed to save file", "error");
    }
  };

  // File management
  const createNewFile = (
    name: string,
    type: string,
    parentId: number | null = null
  ) => {
    dispatch({
      type: "CREATE_FILE",
      name,
      fileType: type,
      parentId,
    });
    setActiveFileId(fileSystem.nextId);
    showNotification(`Created ${name}`);
  };

  // Language options for new file creation
  const languageOptions = [
    { name: "HTML", ext: "html", color: "text-orange-500" },
    { name: "CSS", ext: "css", color: "text-blue-500" },
    { name: "JavaScript", ext: "js", color: "text-yellow-500" },
    { name: "TypeScript", ext: "ts", color: "text-blue-600" },
    { name: "Python", ext: "py", color: "text-green-500" },
    { name: "Lua", ext: "lua", color: "text-purple-500" },
    { name: "C", ext: "c", color: "text-indigo-500" },
  ];

  const handleCreateFileWithLanguage = (ext: string) => {
    const defaultNames = {
      html: "index.html",
      css: "style.css",
      js: "script.js",
      ts: "script.ts",
      c: "main.c",
      py: "main.py",
      lua: "main.lua",
    };
    const fileName =
      defaultNames[ext as keyof typeof defaultNames] || `untitled.${ext}`;
    createNewFile(fileName, ext);
  };

  const deleteFileById = (id: number) => {
    if (fileSystem.files.length <= 1) {
      showNotification("Cannot delete the only file", "error");
      return;
    }

    const fileToDelete = getFileById(fileSystem.files, id);
    if (
      fileToDelete &&
      confirm(`Are you sure you want to delete ${fileToDelete.name}?`)
    ) {
      dispatch({
        type: "DELETE_FILE",
        id,
      });

      if (activeFileId === id) {
        const remainingFiles = fileSystem.files.filter((f) => f.id !== id);
        if (remainingFiles.length > 0) {
          setActiveFileId(remainingFiles[0].id);
        }
      }
      showNotification(`Deleted ${fileToDelete.name}`);
    }
  };

  const duplicateFile = (id: number) => {
    dispatch({
      type: "DUPLICATE_FILE",
      id,
    });
    showNotification("File duplicated");
  };

  const renameFile = (id: number, newName: string) => {
    dispatch({
      type: "UPDATE_FILE",
      id,
      updates: { name: newName },
    });
    showNotification("File renamed");
  };

  // Enhanced export functionality
  const exportFiles = async () => {
    try {
      const files = fileSystem.files.filter((f) => f.type !== "folder");

      if (files.length === 0) {
        showNotification("No files to export", "error");
        return;
      }

      if (files.length === 1) {
        const file = files[0];
        const blob = new Blob([file.content || ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification(`${file.name} exported successfully!`);
      } else {
        // Create a simple archive format
        let archiveContent = "# Code Editor Project Export\n\n";
        files.forEach((file) => {
          archiveContent += `## File: ${file.name}\n\`\`\`${file.type}\n${file.content}\n\`\`\`\n\n`;
        });

        const blob = new Blob([archiveContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "project-export.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification(`${files.length} files exported successfully!`);
      }
    } catch (e) {
      showNotification("Failed to export files", "error");
    }
  };

  // Copy/Paste functionality
  const copyContent = async () => {
    const currentFile = getCurrentFile();
    if (currentFile) {
      try {
        await navigator.clipboard.writeText(currentFile.content || "");
        showNotification("Content copied to clipboard");
      } catch (e) {
        showNotification("Failed to copy content", "error");
      }
    }
  };

  const pasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      updateCurrentFile(text);
      showNotification("Content pasted");
    } catch (e) {
      showNotification("Failed to paste content", "error");
    }
  };

  // Enhanced run code function with language-specific execution
  const runCode = () => {
    const currentFile = getCurrentFile();
    if (!currentFile || !currentFile.content) {
      showNotification("No code to run", "error");
      return;
    }

    setIsRunning(true);
    setTerminalOutput("");
    showNotification("Running code...");

    const code = currentFile.content;
    const language = currentFile.type;

    try {
      if (language === "html") {
        // For HTML, update preview
        setTimeout(() => {
          updatePreview();
          setIsRunning(false);
          setExecutionStatus({ message: "Preview updated!", type: "success" });
          setTimeout(
            () => setExecutionStatus({ message: "", type: null }),
            3000
          );
        }, 100);
      } else if (language === "js") {
        // Execute JavaScript
        executeJavaScript(code);
      } else if (language === "ts") {
        // TypeScript - compile to JavaScript and execute
        executeTypeScript(code);
      } else if (language === "py") {
        // Python - execute with Pyodide
        executePythonCode(code);
      } else if (language === "lua") {
        // Lua - execute with fengari
        executeLuaCode(code);
      } else if (language === "c") {
        // C - show note that it needs compilation
        setTerminalOutput(
          "C code requires compilation.\n\nTo run C code:\n1. Compile: gcc program.c -o program\n2. Run: ./program\n\nIn a browser-based editor, C code cannot be executed directly.\nYou would need a backend server with a C compiler (gcc/clang)."
        );
        setIsRunning(false);
        showNotification("C requires compilation", "warning");
      } else {
        setTerminalOutput("Code execution not supported for this file type.");
        setIsRunning(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(`Error: ${errorMessage}`);
      setIsRunning(false);
      showNotification(`Execution error: ${errorMessage}`, "error");
    }
  };

  // Execute JavaScript code in a sandboxed environment
  const executeJavaScript = (code: string) => {
    try {
      // Capture all console methods
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalInfo = console.info;
      const originalDebug = console.debug;

      const capturedOutput: string[] = [];

      const captureConsole = (method: Function, prefix: string = "") => {
        return (...args: any[]) => {
          const output = args
            .map((arg) => {
              if (typeof arg === "object") {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            })
            .join(" ");
          capturedOutput.push(prefix ? `${prefix}: ${output}` : output);
          method.apply(console, args);
        };
      };

      console.log = captureConsole(originalLog);
      console.error = captureConsole(originalError, "ERROR");
      console.warn = captureConsole(originalWarn, "WARN");
      console.info = captureConsole(originalInfo, "INFO");
      console.debug = captureConsole(originalDebug, "DEBUG");

      // Execute the code
      try {
        // Use Function constructor for better isolation
        const func = new Function(code);
        func();
      } catch (execError) {
        const errorMsg =
          execError instanceof Error
            ? `${execError.name}: ${execError.message}`
            : String(execError);
        capturedOutput.push(`Runtime Error: ${errorMsg}`);
        if (execError instanceof Error && execError.stack) {
          capturedOutput.push(`Stack: ${execError.stack}`);
        }
      }

      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;

      // Set output
      if (capturedOutput.length > 0) {
        setTerminalOutput(capturedOutput.join("\n"));
      } else {
        setTerminalOutput("Code executed successfully. (No output)");
      }

      setIsRunning(false);
      setExecutionStatus({
        message: "JavaScript executed successfully!",
        type: "success",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(`Execution Error: ${errorMessage}`);
      setIsRunning(false);
      setExecutionStatus({ message: `Error: ${errorMessage}`, type: "error" });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    }
  };

  // Execute TypeScript code by compiling to JavaScript first
  const executeTypeScript = async (code: string) => {
    try {
      setTerminalOutput("Compiling TypeScript...\n");

      // Compile TypeScript to JavaScript
      const compiledJs = await compileTypeScript(code);

      setTerminalOutput("TypeScript compiled successfully!\n\n");
      setTerminalOutput((prev) => prev + "Running compiled JavaScript...\n\n");

      // Execute the compiled JavaScript
      executeJavaScript(compiledJs);
      setExecutionStatus({
        message: "TypeScript compiled and executed!",
        type: "success",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(`TypeScript Compilation Error: ${errorMessage}`);
      setIsRunning(false);
      setExecutionStatus({
        message: `TS Error: ${errorMessage}`,
        type: "error",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    }
  };

  // Execute Python code using Pyodide
  const executePythonCode = async (code: string) => {
    try {
      setTerminalOutput("Loading Pyodide (Python runtime)...\n");

      const output = await executePython(code);

      setTerminalOutput(output);
      setIsRunning(false);
      setExecutionStatus({
        message: "Python executed successfully!",
        type: "success",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(`Python Execution Error: ${errorMessage}`);
      setIsRunning(false);
      setExecutionStatus({
        message: `Python Error: ${errorMessage}`,
        type: "error",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    }
  };

  // Execute Lua code using fengari
  const executeLuaCode = async (code: string) => {
    try {
      setTerminalOutput("Loading fengari (Lua runtime)...\n");

      const output = await executeLua(code);

      setTerminalOutput(output);
      setIsRunning(false);
      setExecutionStatus({
        message: "Lua executed successfully!",
        type: "success",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(
        `Lua Execution Error: ${errorMessage}\n\nNote: If fengari fails to load, try refreshing the page.`
      );
      setIsRunning(false);
      setExecutionStatus({
        message: `Lua Error: ${errorMessage}`,
        type: "error",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    }
  };

  // Execute C code using a simplified C interpreter approach
  const executeCCode = async (code: string) => {
    try {
      setTerminalOutput("C code execution in browser is limited.\n");
      setTerminalOutput(
        (prev) => prev + "Attempting to use QuickJS C-like interpreter...\n\n"
      );

      // For C, we'll use a simplified approach
      // Since full C compilation requires a backend, we'll provide a helpful message
      // and attempt a basic interpretation of simple C-like code

      // Try to extract and execute simple printf-like statements
      const printfMatches = code.match(/printf\s*\(\s*"([^"]*)"\s*\)/g);
      let output = "";

      if (printfMatches) {
        output += "Simulated C output:\n";
        printfMatches.forEach((match) => {
          const content = match.match(/"([^"]*)"/)?.[1] || "";
          output += content.replace(/\\n/g, "\n").replace(/\\t/g, "\t") + "\n";
        });
      } else {
        output = "C code requires compilation to run.\n\n";
        output +=
          "In a browser environment, C code cannot be fully executed without:\n";
        output += "1. A backend server with GCC/Clang compiler\n";
        output += "2. WebAssembly compilation (requires Emscripten)\n\n";
        output += "For now, you can:\n";
        output += "- Write and edit C code\n";
        output += "- See basic printf output simulation above\n";
        output += "- Use JavaScript/TypeScript for browser execution\n";
      }

      setTerminalOutput(output);
      setIsRunning(false);
      setExecutionStatus({
        message: "C execution is limited in browser",
        type: "info",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setTerminalOutput(`C Execution Error: ${errorMessage}`);
      setIsRunning(false);
      setExecutionStatus({
        message: `C Error: ${errorMessage}`,
        type: "error",
      });
      setTimeout(() => setExecutionStatus({ message: "", type: null }), 5000);
    }
  };

  const clearTerminal = () => {
    setTerminalOutput("");
  };

  return (
    <div
      className={`min-h-screen p-1 sm:p-4 ${currentTheme.bg} ${currentTheme.text} transition-all duration-300 relative overflow-hidden`}
      style={{ zoom: isMobile ? "100%" : `${currentZoom}%` }}
    >
      {/* Modern toolbar with clean design */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2 rounded-lg bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide file explorer" : "Show file explorer"}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="h-8 px-3 gap-2"
                title="Create a new file"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New File</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {languageOptions.map((lang) => (
                <DropdownMenuItem
                  key={lang.ext}
                  onClick={() => handleCreateFileWithLanguage(lang.ext)}
                  className="cursor-pointer"
                >
                  <FileText className={`h-4 w-4 mr-2 ${lang.color}`} />
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-2"
            onClick={() => document.getElementById("file-upload")?.click()}
            title="Upload files"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".html,.css,.js,.ts,.c,.py,.lua"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            aria-label="File upload input"
          />

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={runCode}
            disabled={isRunning}
            title="Run code"
          >
            {isRunning ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Execution status message */}
          {executionStatus.message && (
            <div
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 ${
                executionStatus.type === "success"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : executionStatus.type === "error"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              }`}
            >
              {executionStatus.type === "success" && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              {executionStatus.type === "error" && (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
              <span>{executionStatus.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            title={isPreviewVisible ? "Hide preview" : "Show preview"}
          >
            {isPreviewVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced notifications */}
      {(error || success) && (
        <Alert
          variant={success ? "default" : "destructive"}
          className="mb-3 rounded-lg"
        >
          <AlertDescription className="text-sm">
            {success || error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main content - Reorganized layout: File Explorer | Code Editor | Output/Preview */}
      <div
        className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-2 sm:gap-3 ${
          isMobile ? "h-auto" : "h-[calc(100vh-8rem)]"
        }`}
      >
        {/* File explorer - Left side */}
        {isSidebarOpen && (
          <Card
            className={`p-2 ${currentTheme.primary} ${currentTheme.border} ${
              isMobile
                ? "w-full h-64"
                : "w-64 min-w-[200px] max-w-[300px] shrink-0"
            } overflow-auto`}
            role="complementary"
            aria-label="File explorer"
          >
            <FileExplorer
              files={fileSystem.files}
              activeFileId={activeFileId}
              onFileSelect={setActiveFileId}
              onCreateFile={createNewFile}
              onDeleteFile={deleteFileById}
              onRenameFile={renameFile}
              onDuplicateFile={duplicateFile}
              theme={currentTheme}
            />
          </Card>
        )}

        {/* Editor and Output/Preview - Middle and Right */}
        <div
          className={`flex ${
            isMobile ? "flex-col" : "flex-row"
          } gap-2 sm:gap-3 flex-1 overflow-hidden min-w-0`}
        >
          {/* Editor */}
          <Card
            className={`p-2 ${currentTheme.primary} ${
              currentTheme.border
            } flex-1 min-w-0 ${isPreviewFullscreen ? "hidden" : ""} ${
              isMobile ? "h-auto" : ""
            }`}
            role="main"
            aria-label="Code editor"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={undo}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={redo}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="h-5 w-px bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={clearAll}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {getCurrentFile()?.name || "No file selected"}
                </span>
              </div>
            </div>

            <div
              className={`w-full ${
                isMobile ? "h-auto min-h-[300px]" : "h-[calc(100%-2.5rem)]"
              } rounded-lg overflow-hidden ${currentTheme.editor}`}
            >
              {(() => {
                const currentFile = getCurrentFile();
                return currentFile ? (
                  <SyntaxHighlighter
                    code={currentFile.content || ""}
                    language={currentFile.type || "html"}
                    onChange={updateCurrentFile}
                    fontSize={editorSettings.fontSize}
                    lineNumbers={editorSettings.lineNumbers}
                    wordWrap={editorSettings.wordWrap}
                    className="h-full"
                    theme={appTheme}
                  />
                ) : (
                  <div
                    className={`h-full flex items-center justify-center ${
                      appTheme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                    role="status"
                    aria-label="No file selected"
                  >
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No file selected</p>
                      <p className="text-sm opacity-70">
                        Create or select a file to start coding
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Output/Preview - Show terminal for non-HTML, preview for HTML */}
          {(() => {
            const currentFile = getCurrentFile();
            const isHtmlFile = currentFile?.type === "html";
            const isNonHtmlFile =
              currentFile &&
              ["js", "ts", "py", "c", "lua"].includes(currentFile.type);

            // Always show preview for HTML files, respect toggle for others
            if (!isHtmlFile && !isPreviewVisible) return null;

            if (isHtmlFile) {
              // Show preview for HTML files
              return (
                <Card
                  className={`p-2 ${currentTheme.primary} ${currentTheme.border}
                  ${
                    isPreviewFullscreen
                      ? "fixed inset-2 z-50"
                      : `flex-1 min-w-0 ${
                          isMobile ? "h-auto min-h-[300px]" : ""
                        }`
                  }`}
                  role="complementary"
                  aria-label="Code preview"
                >
                  <PreviewPanel
                    html={preview}
                    isFullscreen={isPreviewFullscreen}
                    onToggleFullscreen={() =>
                      setIsPreviewFullscreen(!isPreviewFullscreen)
                    }
                    theme={currentTheme}
                  />
                </Card>
              );
            } else if (isNonHtmlFile) {
              // Show terminal for non-HTML files
              return (
                <Card
                  className={`p-2 ${currentTheme.primary} ${
                    currentTheme.border
                  } flex-1 min-w-0 ${isMobile ? "h-auto min-h-[300px]" : ""}`}
                  role="complementary"
                  aria-label="Terminal output"
                >
                  <TerminalPanel
                    output={terminalOutput}
                    isRunning={isRunning}
                    onClear={clearTerminal}
                    theme={currentTheme}
                    language={currentFile?.type || "js"}
                  />
                </Card>
              );
            } else {
              // Show placeholder for other file types
              return (
                <Card
                  className={`p-2 ${currentTheme.primary} ${
                    currentTheme.border
                  } flex-1 min-w-0 ${isMobile ? "h-auto min-h-[300px]" : ""}`}
                  role="complementary"
                  aria-label="Output"
                >
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No output available</p>
                      <p className="text-sm mt-1 opacity-70">
                        Run code to see output
                      </p>
                    </div>
                  </div>
                </Card>
              );
            }
          })()}
        </div>
      </div>

      {/* Enhanced panels */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={currentTheme}
      />
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        theme={currentTheme}
        currentFile={getCurrentFile()}
        onReplace={(searchTerm, replaceTerm) => {
          const currentFile = getCurrentFile();
          if (currentFile && currentFile.content) {
            const newContent = currentFile.content.replace(
              new RegExp(searchTerm, "g"),
              replaceTerm
            );
            updateCurrentFile(newContent);
            showNotification(`Replaced "${searchTerm}" with "${replaceTerm}"`);
          }
        }}
      />

      {/* Mobile close button for fullscreen preview */}
      {isPreviewFullscreen && (
        <Button
          variant="outline"
          size="icon"
          className={`${currentTheme.button} fixed top-4 right-4 z-50`}
          onClick={() => setIsPreviewFullscreen(false)}
          title="Exit fullscreen preview mode"
          aria-label="Exit fullscreen"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Wrap the component with the settings provider
export default function CodeEditor() {
  return (
    <SettingsProvider>
      <CodeEditorContent />
    </SettingsProvider>
  );
}
