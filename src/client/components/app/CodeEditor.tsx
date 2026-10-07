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
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-dark",
  height = "420px",
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-[#1e1e1e]">
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        options={{
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
