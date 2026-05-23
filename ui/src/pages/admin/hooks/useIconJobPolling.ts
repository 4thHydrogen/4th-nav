import { useCallback, useEffect, useRef, useState } from "react";
import { fetchIconJobStatus } from "../../../shared/api/tool";
import type { IconJobStatus } from "../../../shared/api/tool";

export function useIconJobPolling(reload: () => Promise<void>) {
  const [iconJob, setIconJob] = useState<IconJobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollIconStatus = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const status = await fetchIconJobStatus();
      setIconJob(status);
      if (!status.running) {
        stopPolling();
        reload();
      }
    }, 2000);
  }, [reload, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return {
    iconJob,
    pollIconStatus,
  };
}
