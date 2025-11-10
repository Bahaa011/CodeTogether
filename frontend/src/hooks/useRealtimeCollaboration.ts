/**
 * useRealtimeCollaboration Hook
 * ---------------------------------------
 * Provides real-time collaborative editing for a code or text file
 * using an Operational Transformation (OT)-based synchronization model.
 *
 * This hook manages:
 * - Connection to a collaboration WebSocket server
 * - Joining documents and receiving remote edits
 * - Sending local edits as operations
 * - Transforming and applying incoming operations correctly
 * - Handling version synchronization and resyncing
 *
 * Dependencies:
 * - Socket.IO for the WebSocket layer
 * - OT helpers from utils/textOt.ts (diffToOperation, applyOperation)
 *
 * Responsibilities:
 * - Maintain and synchronize document state (content + versions)
 * - Queue and apply remote and local operations
 * - Handle out-of-order or concurrent edits
 * - Automatically resync when errors or version mismatches occur
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { EditorFileState } from "./useProjectEditor";
import {
  applyOperation,
  diffToOperation,
  type TextOperation,
} from "../utils/textOt";

/** Collaboration server base URL. */
const COLLAB_URL =
  import.meta.env.VITE_COLLAB_WS_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000";

/**
 * Types
 * ---------------------------------------
 */

/** Event payload broadcasted when an operation is applied by the server. */
type OperationAppliedEvent = {
  fileId: number;
  version: number;
  components: TextOperation;
  clientId: string;
};

/** Local record of an operation pending acknowledgment from the server. */
type PendingOperation = {
  version: number;
  components: TextOperation;
};

/** Hook input parameters. */
type UseRealtimeCollaborationParams = {
  activeFile?: EditorFileState;
  canEdit: boolean;
  syncFileContent(fileId: number, content: string, markClean?: boolean): void;
};

/** High-level connection status for UI components. */
export type RealtimeCollaborationStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "error";

/**
 * useRealtimeCollaboration
 *
 * Manages full lifecycle of real-time editing and synchronization
 * between multiple connected users editing the same file.
 *
 * @param activeFile - The currently opened file object.
 * @param canEdit - Whether the user can send edits to the server.
 * @param syncFileContent - Callback to sync the file content to the local editor.
 *
 * @returns {
 *   status: RealtimeCollaborationStatus,
 *   error: string | null,
 *   resyncing: boolean,
 *   handleLocalChange(value?: string): void
 * }
 */
export function useRealtimeCollaboration({
  activeFile,
  canEdit,
  syncFileContent,
}: UseRealtimeCollaborationParams) {
  // ───────────────────────────────
  // 🔹 State and Refs
  // ───────────────────────────────
  const [status, setStatus] = useState<RealtimeCollaborationStatus>("idle");
  const [collabError, setCollabError] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pendingOpsRef = useRef<PendingOperation[]>([]);
  const remoteBufferRef = useRef<OperationAppliedEvent[]>([]);
  const serverVersionRef = useRef(0);
  const localVersionRef = useRef(0);
  const contentRef = useRef("");
  const fileIdRef = useRef<number | null>(null);

  /** Unique client ID for this editor instance (used to identify self-originated ops). */
  const clientIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Math.random().toString(36).slice(2, 10)}`,
  );

  const activeFileId = activeFile?.id ?? null;

  // ───────────────────────────────
  // 🔹 Join Document
  // ───────────────────────────────
  const joinDocument = useCallback((fileId: number | null) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !fileId) return;
    socket.emit("editor:join", { fileId });
    setStatus("connecting");
  }, []);

  // ───────────────────────────────
  // 🔹 Apply Remote Operation
  // ───────────────────────────────
  const applyRemoteOperation = useCallback(
    (payload: OperationAppliedEvent) => {
      if (payload.fileId !== fileIdRef.current) return;

      const nextContent = applyOperation(contentRef.current, payload.components);
      contentRef.current = nextContent;
      serverVersionRef.current = payload.version;
      localVersionRef.current = Math.max(localVersionRef.current, payload.version);

      syncFileContent(payload.fileId, nextContent, true);
    },
    [syncFileContent],
  );

  // ───────────────────────────────
  // 🔹 Process Buffered Remote Operations
  // (applied after all pending local ops are confirmed)
  // ───────────────────────────────
  const processBufferedRemoteOps = useCallback(() => {
    if (pendingOpsRef.current.length > 0) return;
    const buffer = remoteBufferRef.current;
    while (buffer.length > 0) {
      const payload = buffer.shift();
      if (!payload) break;
      applyRemoteOperation(payload);
    }
  }, [applyRemoteOperation]);

  // ───────────────────────────────
  // 🔹 WebSocket Connection Setup
  // ───────────────────────────────
  useEffect(() => {
    const socket = io(COLLAB_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;
    setStatus("connecting");

    /** When the socket connects, join the active document. */
    const handleConnect = () => {
      setStatus("connecting");
      if (activeFileId) joinDocument(activeFileId);
    };

    /** When disconnected, mark the status as idle. */
    const handleDisconnect = () => setStatus("idle");

    /** When the server sends full doc content + version (initial ready state). */
    const handleReady = (payload: { fileId: number; content: string; version: number }) => {
      if (payload.fileId !== activeFileId) return;
      pendingOpsRef.current = [];
      remoteBufferRef.current = [];
      contentRef.current = payload.content ?? "";
      fileIdRef.current = payload.fileId;
      serverVersionRef.current = payload.version;
      localVersionRef.current = payload.version;
      syncFileContent(payload.fileId, payload.content ?? "", true);
      setStatus("ready");
      setCollabError(null);
      setResyncing(false);
    };

    /** When a new operation is broadcasted by the server. */
    const handleOperationApplied = (payload: OperationAppliedEvent) => {
      if (payload.fileId !== fileIdRef.current) return;

      // If this operation originated from this client
      if (payload.clientId === clientIdRef.current) {
        pendingOpsRef.current.shift();
        serverVersionRef.current = payload.version;
        if (pendingOpsRef.current.length === 0) processBufferedRemoteOps();
        return;
      }

      // Otherwise, buffer or apply immediately
      if (pendingOpsRef.current.length > 0) {
        remoteBufferRef.current.push(payload);
        return;
      }

      applyRemoteOperation(payload);
    };

    /** When the server reports a collaboration-level error. */
    const handleError = (payload: { message?: string }) => {
      setCollabError(payload?.message ?? "Collaboration error.");
      setStatus("error");
    };

    /** When resync is triggered (e.g., by version mismatch). */
    const handleResync = () => {
      setResyncing(true);
      joinDocument(fileIdRef.current);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("editor:ready", handleReady);
    socket.on("editor:operation-applied", handleOperationApplied);
    socket.on("editor:error", handleError);
    socket.on("editor:resync", handleResync);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("editor:ready", handleReady);
      socket.off("editor:operation-applied", handleOperationApplied);
      socket.off("editor:error", handleError);
      socket.off("editor:resync", handleResync);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeFileId, applyRemoteOperation, joinDocument, processBufferedRemoteOps, syncFileContent]);

  // ───────────────────────────────
  // 🔹 Reset State When File Changes
  // ───────────────────────────────
  useEffect(() => {
    if (activeFileId == null) {
      fileIdRef.current = null;
      contentRef.current = "";
      pendingOpsRef.current = [];
      remoteBufferRef.current = [];
      return;
    }

    // Avoid rejoining the same document unnecessarily
    if (fileIdRef.current === activeFileId) return;

    contentRef.current = activeFile?.draftContent ?? "";
    fileIdRef.current = activeFileId;
    pendingOpsRef.current = [];
    remoteBufferRef.current = [];
    joinDocument(activeFileId);
  }, [activeFile?.draftContent, activeFileId, joinDocument]);

  // ───────────────────────────────
  // 🔹 Handle Local Edits
  // Converts user changes → diff → OT operation → emits via socket
  // ───────────────────────────────
  const handleLocalChange = useCallback(
    (value: string | undefined) => {
      const socket = socketRef.current;
      const fileId = fileIdRef.current;
      if (!socket || !socket.connected || !fileId || !canEdit) {
        contentRef.current = value ?? contentRef.current;
        return;
      }

      const nextValue = value ?? "";
      const previousValue = contentRef.current;
      if (nextValue === previousValue) return;

      const components = diffToOperation(previousValue, nextValue);
      if (components.length === 0) {
        contentRef.current = nextValue;
        return;
      }

      const baseVersion = localVersionRef.current;
      localVersionRef.current += 1;
      pendingOpsRef.current.push({ version: baseVersion, components });
      contentRef.current = nextValue;

      socket.emit("editor:operation", {
        fileId,
        version: baseVersion,
        components,
        clientId: clientIdRef.current,
      });
    },
    [canEdit],
  );

  // ───────────────────────────────
  // 🔹 Public API
  // ───────────────────────────────
  const info = useMemo(
    () => ({
      status,
      error: collabError,
      resyncing,
    }),
    [status, collabError, resyncing],
  );

  return {
    ...info,
    handleLocalChange,
  };
}
