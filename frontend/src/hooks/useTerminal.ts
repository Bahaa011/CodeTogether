import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { io, type Socket } from "socket.io-client";
import { emitRunExecutionState } from "./useRunExecutionState";

type RunFileRequestDetail = {
  fileId: number;
  filename: string;
  code: string;
  fileType?: string | null;
  language?: string | null;
};

type OutputKind = "stdout" | "stderr" | "info" | "error" | "command";

type OutputEntry = {
  id: number;
  text: string;
  kind: OutputKind;
};

type StartExecutionPayload = {
  language: string;
  code: string;
  filename: string;
};

const SUPPORTED_LANGUAGES = new Set(["python", "javascript", "cpp", "java"]);

const TERMINAL_URL =
  import.meta.env.VITE_TERMINAL_WS_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000";

function resolveLanguage(detail: RunFileRequestDetail): string | null {
  const toCheck = [
    detail.language,
    detail.fileType,
    detail.filename.split(".").pop(),
  ]
    .filter(Boolean)
    .map((value) => value?.toLowerCase() ?? "");

  for (const candidate of toCheck) {
    if (!candidate) continue;
    if (SUPPORTED_LANGUAGES.has(candidate)) {
      return candidate;
    }
    if (candidate === "js" || candidate === "jsx") {
      return "javascript";
    }
    if (candidate === "py") {
      return "python";
    }
    if (["cpp", "cc", "cxx", "hpp", "hxx"].includes(candidate)) {
      return "cpp";
    }
  }

  return null;
}

function normalizeChunk(raw: string) {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function useTerminal() {
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [inputValue, setInputValue] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const pendingRunRef = useRef<StartExecutionPayload | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const lineCounterRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      emitRunExecutionState(false);
    };
  }, []);

  const appendOutput = useCallback((chunk: string, kind: OutputKind) => {
    const normalized = normalizeChunk(chunk);
    const segments = normalized.split("\n");
    setOutput((prev) => [
      ...prev,
      ...segments.map((text) => ({
        id: lineCounterRef.current++,
        text,
        kind,
      })),
    ]);
  }, []);

  useEffect(() => {
    const socket = io(TERMINAL_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionState("connected");
      if (pendingRunRef.current) {
        socket.emit("start-execution", pendingRunRef.current);
        pendingRunRef.current = null;
      }
    };

    const handleDisconnect = () => {
      setConnectionState("disconnected");
      setIsRunning(false);
      emitRunExecutionState(false);
    };

    const handleConnectError = (error: Error) => {
      setConnectionState("disconnected");
      setIsRunning(false);
      pendingRunRef.current = null;
      appendOutput(`Connection error: ${error.message}`, "error");
      emitRunExecutionState(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("stdout", (data: string) => {
      appendOutput(data, "stdout");
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    });
    socket.on("stderr", (data: string) => appendOutput(data, "stderr"));
    socket.on("started", (payload: { filename?: string; language?: string }) => {
      emitRunExecutionState(true);
      const languageLabel = payload.language
        ? ` (${payload.language})`
        : "";
      appendOutput(
        `Execution started for ${payload.filename ?? "file"}${languageLabel}`,
        "info",
      );
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    });
    socket.on("exit", (payload: { code: number }) => {
      setIsRunning(false);
      emitRunExecutionState(false);
      setInputValue("");
      appendOutput(
        `Process exited with code ${payload.code}`,
        payload.code === 0 ? "info" : "error",
      );
    });
    socket.on("stopped", () => {
      setIsRunning(false);
      emitRunExecutionState(false);
      setInputValue("");
      appendOutput("Execution stopped by user", "info");
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("stdout");
      socket.off("stderr");
      socket.off("started");
      socket.off("exit");
      socket.off("stopped");
      socket.disconnect();
    };
  }, [appendOutput]);

  useEffect(() => {
    if (!outputRef.current) {
      return;
    }
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    inputRef.current?.focus({ preventScroll: true });
  }, [output, isRunning]);

  const startExecution = useCallback(
    (detail: RunFileRequestDetail) => {
      const socket = socketRef.current;
      if (!socket) {
        appendOutput("Terminal connection is not ready.", "error");
        setIsRunning(false);
        emitRunExecutionState(false);
        return;
      }

      const language = resolveLanguage(detail);
      if (!language) {
        appendOutput(
          `Unable to run ${detail.filename}: unsupported language.`,
          "error",
        );
        setIsRunning(false);
        emitRunExecutionState(false);
        return;
      }

      setOutput([]);
      lineCounterRef.current = 0;
      setActiveFileName(detail.filename);
      setIsRunning(true);
      emitRunExecutionState(true);
      setInputValue("");
      appendOutput(`Preparing to execute ${detail.filename}…`, "info");

      const payload = {
        language,
        code: detail.code,
        filename: detail.filename,
      };

      if (!socket.connected) {
        setConnectionState("connecting");
        pendingRunRef.current = payload;
        socket.connect();
        return;
      }

      socket.emit("start-execution", payload);
    },
    [appendOutput],
  );

  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<RunFileRequestDetail>;
      if (!customEvent.detail) {
        return;
      }
      startExecution(customEvent.detail);
    };

    window.addEventListener("run-file-requested", listener as EventListener);
    return () => {
      window.removeEventListener("run-file-requested", listener as EventListener);
    };
  }, [startExecution]);

  const handleSubmitInput = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const socket = socketRef.current;
      const value = inputValue;
      if (!value.trim()) {
        setInputValue("");
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
        return;
      }

      if (!socket) {
        appendOutput("Terminal connection is not ready.", "error");
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
        return;
      }

      socket.emit("input", value);
      appendOutput(value, "command");
      setInputValue("");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [appendOutput, inputValue],
  );

  const handleStop = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !isRunning) {
      return;
    }
    socket.emit("stop");
    setIsRunning(false);
    emitRunExecutionState(false);
    setInputValue("");
  }, [isRunning]);

  const statusLabel = useMemo(() => {
    if (isRunning && activeFileName) {
      return `Running ${activeFileName}`;
    }
    if (connectionState === "connecting") {
      return "Connecting…";
    }
    if (connectionState === "disconnected") {
      return "Disconnected";
    }
    return "Idle";
  }, [activeFileName, connectionState, isRunning]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  return {
    output,
    inputValue,
    isRunning,
    statusLabel,
    handleSubmitInput,
    handleStop,
    handleInputChange,
    outputRef,
    inputRef,
  };
}
