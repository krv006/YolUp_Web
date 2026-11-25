import { useEffect, useState } from "react";
import { apiClient } from "@/shared/api";

export function useProtectedAudio(url: string | null): { src: string | null; failed: boolean } {
  const [state, setState] = useState<{ url: string | null; src: string | null; failed: boolean }>({ url: null, src: null, failed: false });

  useEffect(() => {
    if (!url) return undefined;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    apiClient
      .get<Blob>(url, { signal: controller.signal, responseType: "blob", timeoutMs: 60_000 })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setState({ url, src: objectUrl, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ url, src: null, failed: true });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state.url === url ? { src: state.src, failed: state.failed } : { src: null, failed: false };
}
