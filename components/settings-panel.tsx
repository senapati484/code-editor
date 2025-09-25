"use client"
import { useSettings } from "@/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Plus, Minus, Check, X } from "lucide-react"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: any
}

export default function SettingsPanel({ isOpen, onClose, theme }: SettingsPanelProps) {
  const { theme: appTheme, setTheme, editorSettings, updateEditorSettings } = useSettings()

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.text} md:absolute md:inset-auto md:right-0 md:top-0 md:h-full md:w-80 ${theme.primary} ${theme.border} shadow-lg overflow-auto`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold flex items-center ${theme.text}`}>
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Settings
          </h2>
          <Button variant="outline" size="icon" className={`border ${theme.border} hover:bg-accent`} onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Theme</h3>
            <div className="flex space-x-2">
              <Button
                variant={appTheme === "light" ? "default" : "outline"}
                className={
                  appTheme === "light"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : `border ${theme.border} hover:bg-accent`
                }
                onClick={() => setTheme("light")}
              >
                <Sun
                  className={`h-4 w-4 mr-2 ${appTheme === "light" ? "text-primary-foreground" : "text-muted-foreground"}`}
                />
                <span className={appTheme === "light" ? "text-primary-foreground font-medium" : "text-foreground"}>
                  Light
                </span>
              </Button>
              <Button
                variant={appTheme === "dark" ? "default" : "outline"}
                className={
                  appTheme === "dark"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : `border ${theme.border} hover:bg-accent`
                }
                onClick={() => setTheme("dark")}
              >
                <Moon
                  className={`h-4 w-4 mr-2 ${appTheme === "dark" ? "text-primary-foreground" : "text-muted-foreground"}`}
                />
                <span className={appTheme === "dark" ? "text-primary-foreground font-medium" : "text-foreground"}>
                  Dark
                </span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Editor</h3>

            <div className="space-y-4">
              <div>
                <label className={`text-xs mb-2 block ${theme.text} opacity-80`}>
                  Font Size: {editorSettings.fontSize}px
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 border ${theme.border} hover:bg-accent`}
                    onClick={() => updateEditorSettings({ fontSize: Math.max(10, editorSettings.fontSize - 1) })}
                    disabled={editorSettings.fontSize <= 10}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className={`flex-1 mx-2 h-2 bg-muted rounded-full overflow-hidden`}>
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${((editorSettings.fontSize - 10) / 14) * 100}%` }}
                    ></div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 border ${theme.border} hover:bg-accent`}
                    onClick={() => updateEditorSettings({ fontSize: Math.min(24, editorSettings.fontSize + 1) })}
                    disabled={editorSettings.fontSize >= 24}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className={`text-xs mb-2 block ${theme.text} opacity-80`}>
                  Tab Size: {editorSettings.tabSize} spaces
                </label>
                <div className="flex space-x-2">
                  {[2, 4, 8].map((size) => (
                    <Button
                      key={size}
                      variant={editorSettings.tabSize === size ? "default" : "outline"}
                      className={
                        editorSettings.tabSize === size
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : `border ${theme.border} hover:bg-accent`
                      }
                      onClick={() => updateEditorSettings({ tabSize: size })}
                    >
                      <span className="font-semibold">{size}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {[
                { key: "lineNumbers", label: "Line Numbers" },
                { key: "wordWrap", label: "Word Wrap" },
                { key: "autoSave", label: "Auto Save" },
                { key: "autoComplete", label: "Auto Complete" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className={`text-sm ${theme.text} font-medium`}>{label}</label>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`${editorSettings[key] ? "bg-primary text-primary-foreground hover:bg-primary/90" : `border ${theme.border} hover:bg-accent`} h-8 w-8 transition-all duration-300`}
                    onClick={() => updateEditorSettings({ [key]: !editorSettings[key] })}
                  >
                    {editorSettings[key] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Keyboard Shortcuts</h3>
            <div className={`text-xs space-y-2 ${theme.text} opacity-80 overflow-x-auto pb-2`}>
              <table className="w-full min-w-full">
                <tbody>
                  {[
                    { action: "Save", shortcut: "Ctrl+S" },
                    { action: "Undo", shortcut: "Ctrl+Z" },
                    { action: "Redo", shortcut: "Ctrl+Y" },
                    { action: "Clear All", shortcut: "Ctrl+Shift+D" },
                  ].map(({ action, shortcut }) => (
                    <tr key={action} className={`border-b border-border`}>
                      <td className="py-2 font-medium">{action}</td>
                      <td className="py-2 text-right">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-foreground">{shortcut}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
