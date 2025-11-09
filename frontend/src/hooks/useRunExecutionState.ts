import { useEffect, useState } from "react";

const RUN_EXECUTION_EVENT = "run-execution-state";

type RunExecutionDetail = {
  running: boolean;
};

export function emitRunExecutionState(running: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<RunExecutionDetail>(RUN_EXECUTION_EVENT, {
      detail: { running },
    }),
  );
}

export function useRunExecutionState(initial = false) {
  const [running, setRunning] = useState(initial);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<RunExecutionDetail>;
      setRunning(Boolean(customEvent.detail?.running));
    };

    window.addEventListener(RUN_EXECUTION_EVENT, handler as EventListener);

    return () => {
      window.removeEventListener(RUN_EXECUTION_EVENT, handler as EventListener);
    };
  }, []);

  return running;
}
