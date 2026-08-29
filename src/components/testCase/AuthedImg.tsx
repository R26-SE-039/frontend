import { useEffect, useRef, useState } from "react";
import { useMeetingStore } from "../../store/useMeetingStore";

type AuthedImgProps = {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
};

/**
 * Renders an <img> whose source sits behind the gateway's JWT auth. A plain
 * <img src> can't send the Authorization header, so protected artifacts (run
 * screenshots, live frames) 401 and show broken. This fetches the bytes WITH
 * the bearer token, turns them into an object URL, and keeps the previous frame
 * visible until the next one loads (no flicker while polling).
 */
export default function AuthedImg({ src, alt, className, onError }: AuthedImgProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const token = useMeetingStore.getState().user?.accessToken;
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setObjectUrl(url);
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current?.();
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Revoke the last object URL when the component unmounts.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  if (!objectUrl) {
    return <div className={className} style={{ background: "#f1f5f9" }} aria-label={alt} />;
  }
  return <img src={objectUrl} alt={alt} className={className} />;
}
