import { useCallback, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { EditorFileState } from "../../hooks/useProjectEditor";
import "../../styles/editor-workspace.css";

type CodeEditorProps = {
  file?: EditorFileState;
  loading: boolean;
  onChange(value: string | undefined): void;
  onSave(): void;
  readOnly?: boolean;
};

function inferLanguage(filename?: string, fileType?: string) {
  const normalizedName = filename?.toLowerCase() ?? "";
  const normalizedType = fileType?.toLowerCase() ?? "";

  const extension = normalizedName.split(".").pop() ?? "";
  const fallback = normalizedType || extension;

  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    hpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    dockerfile: "dockerfile",
    env: "properties",
    txt: "plaintext",
  };

  if (map[extension]) {
    return map[extension];
  }

  if (map[fallback]) {
    return map[fallback];
  }

  return "plaintext";
}

export default function CodeEditor({
  file,
  loading,
  onChange,
  onSave,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const language = useMemo(
    () => inferLanguage(file?.filename, file?.file_type),
    [file?.filename, file?.file_type],
  );

  const handleMount = useCallback(
    (
      editor: MonacoEditor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor;
      if (!readOnly) {
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          () => {
            onSave();
          },
        );
      }
    },
    [onSave, readOnly],
  );

  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      return;
    }
    editorRef.current?.focus();
  }, [file]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

  return (
    <section className="editor-view">
      <div className="editor-view__canvas">
        {loading ? (
          <div className="editor-view__placeholder">Loading editor…</div>
        ) : file ? (
          <Editor
            key={file.id}
            height="100%"
            theme="vs-dark"
            language={language}
            value={file.draftContent}
            path={file.filename}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              readOnly,
            }}
            onMount={handleMount}
            onChange={onChange}
          />
        ) : (
          <div className="editor-view__placeholder">
            Select a file to begin editing.
          </div>
        )}
      </div>

      {file?.saveError && (
        <div className="editor-view__error">{file.saveError}</div>
      )}
    </section>
  );
}
