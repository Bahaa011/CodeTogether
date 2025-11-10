/**
 * CodeEditor Component
 * ---------------------
 * The main Monaco Editor integration for CodeTogether.
 *
 * Responsibilities:
 * - Render and manage a Monaco code editor instance.
 * - Handle language inference based on filename/type.
 * - Support real-time collaboration updates using diff-based OT operations.
 * - Detect and apply remote file changes without disrupting local user focus.
 * - Register keyboard shortcuts (Ctrl/Cmd + S) for manual saving.
 * - Respect read-only mode (for non-editable or public views).
 *
 * Dependencies:
 * - @monaco-editor/react for the Monaco integration
 * - useTheme hook for dark/light theme switching
 * - diffToOperation utility for translating text diffs into OT-style edit operations
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useTheme } from "../../hooks/useTheme";
import type { EditorFileState } from "../../hooks/useProjectEditor";
import { diffToOperation } from "../../utils/textOt";
import "../../styles/editor-workspace.css";

/**
 * Props
 * ------
 * - file: Current file state (with draft content)
 * - loading: Whether the editor is loading
 * - onChange: Handler triggered on local content edits
 * - onSave: Invoked when user presses Ctrl/Cmd + S
 * - readOnly: Whether editor is in non-editable mode
 */
type CodeEditorProps = {
  file?: EditorFileState;
  loading: boolean;
  onChange(value: string | undefined): void;
  onSave(): void;
  readOnly?: boolean;
};

/**
 * inferLanguage
 * ----------------
 * Maps file extensions or MIME-like types to Monaco-recognized languages.
 * Used to provide accurate syntax highlighting.
 */
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

  if (map[extension]) return map[extension];
  if (map[fallback]) return map[fallback];
  return "plaintext";
}

/**
 * CodeEditor
 * -------------
 * Main functional component rendering the editor instance.
 */
export default function CodeEditor({
  file,
  loading,
  onChange,
  onSave,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const applyingRemoteChangeRef = useRef(false);
  const activeFileId = file?.id ?? null;

  /** Automatically infer syntax language */
  const language = useMemo(
    () => inferLanguage(file?.filename, file?.file_type),
    [file?.filename, file?.file_type],
  );

  /** Theme adaptation */
  const { theme } = useTheme();
  const monacoTheme = theme === "light" ? "vs" : "vs-dark";

  /**
   * handleMount
   * -------------
   * Called when Monaco editor mounts.
   * Sets up editor reference and keyboard shortcuts (Ctrl/Cmd + S).
   */
  const handleMount = useCallback(
    (
      editor: MonacoEditor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor;
      if (!readOnly) {
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          () => onSave(),
        );
      }
    },
    [onSave, readOnly],
  );

  /** Cleanup editor reference on unmount */
  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  /** Focus editor when switching files */
  useEffect(() => {
    if (activeFileId == null) return;
    editorRef.current?.focus();
  }, [activeFileId]);

  /**
   * Synchronize external (remote) updates into editor.
   * Uses OT diff operations to avoid replacing entire buffer.
   */
  useEffect(() => {
    if (!file || !editorRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const nextValue = file.draftContent ?? "";
    const currentValue = model.getValue();
    if (currentValue === nextValue) return;

    const components = diffToOperation(currentValue, nextValue);
    if (components.length === 0) return;

    type PendingEdit = {
      start: number;
      end: number;
      text: string;
      order: number;
    };

    const edits: PendingEdit[] = [];
    let offset = 0;

    /** Convert diff components into Monaco edit ranges */
    components.forEach((component, index) => {
      if ("retain" in component) {
        offset += component.retain;
        return;
      }
      if ("delete" in component) {
        const start = offset;
        const end = offset + component.delete;
        edits.push({ start, end, text: "", order: index });
        offset += component.delete;
        return;
      }
      if ("insert" in component) {
        edits.push({ start: offset, end: offset, text: component.insert, order: index });
      }
    });

    /** Preserve scroll position and restore it after applying remote updates */
    const restoreIfIdle = (
      editorInstance: MonacoEditor.IStandaloneCodeEditor,
      viewState: ReturnType<MonacoEditor.IStandaloneCodeEditor["saveViewState"]>,
    ) => {
      if (!viewState) return;
      if (editorInstance.hasTextFocus()) return;
      editorInstance.restoreViewState(viewState);
    };

    /** Apply all edits atomically */
    const applyEdits = (transform: typeof edits) => {
      const monacoEdits = transform
        .sort((a, b) => (a.start === b.start ? b.order - a.order : b.start - a.start))
        .map(({ start, end, text }) => {
          const startPos = model.getPositionAt(start);
          const endPos = model.getPositionAt(end);
          return {
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            text,
            forceMoveMarkers: true,
          };
        });

      const viewState = editor.saveViewState?.() ?? null;
      applyingRemoteChangeRef.current = true;
      try {
        editor.executeEdits("remote-sync", monacoEdits);
      } finally {
        applyingRemoteChangeRef.current = false;
      }
      restoreIfIdle(editor, viewState);
    };

    if (edits.length === 0) {
      const viewState = editor.saveViewState?.() ?? null;
      applyingRemoteChangeRef.current = true;
      try {
        editor.setValue(nextValue);
      } finally {
        applyingRemoteChangeRef.current = false;
      }
      restoreIfIdle(editor, viewState);
      return;
    }

    applyEdits(edits);
  }, [file?.draftContent]);

  /** Apply read-only mode dynamically */
  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

  /**
   * JSX Structure
   * ---------------
   * - Main editor pane with placeholder fallbacks
   * - Error display (e.g., failed saves)
   */
  return (
    <section className="editor-view">
      <div className="editor-view__canvas">
        {loading ? (
          <div className="editor-view__placeholder">Loading editor…</div>
        ) : file ? (
          <Editor
            key={file.id}
            height="100%"
            theme={monacoTheme}
            language={language}
            defaultValue={file.draftContent ?? ""}
            path={file.filename}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              readOnly,
            }}
            onMount={handleMount}
            onChange={(value) => {
              if (applyingRemoteChangeRef.current) return;
              onChange(value);
            }}
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
