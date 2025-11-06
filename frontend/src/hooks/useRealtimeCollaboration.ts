import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { EditorFileState } from "./useProjectEditor";
import {
  applyOperation,
  diffToOperation,
  type TextOperation,
} from "../utils/textOt";

const COLLAB_URL =
  import.meta.env.VITE_COLLAB_WS_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000";

type OperationAppliedEvent = {
  fileId: number;
  version: number;
  components: TextOperation;
  clientId: string;
};

type PendingOperation = {
  version: number;
  components: TextOperation;
};

type UseRealtimeCollaborationParams = {
  activeFile?: EditorFileState;
  canEdit: boolean;
  syncFileContent(fileId: number, content: string, markClean?: boolean): void;
};

export type RealtimeCollaborationStatus = "idle" | "connecting" | "ready" | "error";

export function useRealtimeCollaboration({
  activeFile,
  canEdit,
  syncFileContent,
}: UseRealtimeCollaborationParams) {
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
  const clientIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Math.random().toString(36).slice(2, 10)}`,
  );

  const activeFileId = activeFile?.id ?? null;

  const joinDocument = useCallback((fileId: number | null) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !fileId) {
      return;
    }
    socket.emit("editor:join", { fileId });
    setStatus("connecting");
  }, []);

  const applyRemoteOperation = useCallback(
    (payload: OperationAppliedEvent) => {
      if (payload.fileId !== fileIdRef.current) {
        return;
      }
      const nextContent = applyOperation(contentRef.current, payload.components);
      contentRef.current = nextContent;
      serverVersionRef.current = payload.version;
      localVersionRef.current = Math.max(localVersionRef.current, payload.version);
      syncFileContent(payload.fileId, nextContent, true);
    },
    [syncFileContent],
  );

  const processBufferedRemoteOps = useCallback(() => {
    if (pendingOpsRef.current.length > 0) {
      return;
    }
    const buffer = remoteBufferRef.current;
    while (buffer.length > 0) {
      const payload = buffer.shift();
      if (!payload) break;
      applyRemoteOperation(payload);
    }
  }, [applyRemoteOperation]);

  useEffect(() => {
    const socket = io(COLLAB_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;
    setStatus("connecting");

    const handleConnect = () => {
      setStatus("connecting");
      if (activeFileId) {
        joinDocument(activeFileId);
      }
    };

    const handleDisconnect = () => {
      setStatus("idle");
    };

    const handleReady = (payload: { fileId: number; content: string; version: number }) => {
      if (payload.fileId !== activeFileId) {
        return;
      }
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

    const handleOperationApplied = (payload: OperationAppliedEvent) => {
      if (payload.fileId !== fileIdRef.current) {
        return;
      }

      if (payload.clientId === clientIdRef.current) {
        pendingOpsRef.current.shift();
        serverVersionRef.current = payload.version;
        if (pendingOpsRef.current.length === 0) {
          processBufferedRemoteOps();
        }
        return;
      }

      if (pendingOpsRef.current.length > 0) {
        remoteBufferRef.current.push(payload);
        return;
      }

      applyRemoteOperation(payload);
    };

    const handleError = (payload: { message?: string }) => {
      setCollabError(payload?.message ?? "Collaboration error.");
      setStatus("error");
    };

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

  useEffect(() => {
    if (activeFileId == null) {
      fileIdRef.current = null;
      contentRef.current = "";
      pendingOpsRef.current = [];
      remoteBufferRef.current = [];
      return;
    }

    if (fileIdRef.current === activeFileId) {
      return;
    }

    contentRef.current = activeFile?.draftContent ?? "";
    fileIdRef.current = activeFileId;
    pendingOpsRef.current = [];
    remoteBufferRef.current = [];
    joinDocument(activeFileId);
  }, [activeFile?.draftContent, activeFileId, joinDocument]);

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
      if (nextValue === previousValue) {
        return;
      }

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
