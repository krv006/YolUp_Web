import { useEffect, useRef } from "react";

export interface SharePreviewProps {
  stream: MediaStream | null;
  className?: string;
}

export function SharePreview({ stream, className = "size-full" }: SharePreviewProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !stream) return undefined;
    element.srcObject = stream;
    void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return <video ref={ref} className={`bg-black object-contain ${className}`} autoPlay muted playsInline aria-hidden="true" />;
}
