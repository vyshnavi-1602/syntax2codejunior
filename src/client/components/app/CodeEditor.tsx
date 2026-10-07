import React from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

loader.config({ monaco });
interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: "javascript" | "python" | "html" | "css" | "java" | "c" | "cpp";
  theme?: "vs-dark" | "light";
  height?: string;
  readOnly?: boolean;
  disablePaste?: boolean;
  onPasteAttempt?: () => void;
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-dark",
  height = "420px",
  readOnly = false,
  disablePaste = false,
  onPasteAttempt,
}: CodeEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      onPaste={(e) => {
        if (disablePaste) {
          e.preventDefault();
          e.stopPropagation();
          onPasteAttempt?.();
        }
      }}
      className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-[#1e1e1e]"
    >
      {disablePaste && (
        <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono pointer-events-none backdrop-blur-xs select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Anti-Cheat: Paste Disabled (Manual Typing Only)
        </div>
      )}
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={(editor, monacoInstance) => {
          if (disablePaste) {
            // Block Ctrl+V and Cmd+V keybindings
            editor.onKeyDown((e) => {
              const isCtrlOrCmd = e.ctrlKey || e.metaKey;
              const isV = e.keyCode === monacoInstance.KeyCode.KeyV;
              const isShiftInsert = e.shiftKey && e.keyCode === monacoInstance.KeyCode.Insert;

              if ((isCtrlOrCmd && isV) || isShiftInsert) {
                e.preventDefault();
                e.stopPropagation();
                onPasteAttempt?.();
              }
            });

            // Prevent native paste on editor DOM node
            const dom = editor.getDomNode();
            if (dom) {
              dom.addEventListener(
                "paste",
                (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPasteAttempt?.();
                },
                true,
              );
            }
          }
        }}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          readOnly: readOnly,
          wordWrap: "on",
          overviewRulerBorder: true,
          overviewRulerLanes: 3,
          scrollbar: {
            vertical: "visible",
            horizontal: "auto",
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 12,
            alwaysConsumeMouseWheel: false,
            useShadows: true,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
