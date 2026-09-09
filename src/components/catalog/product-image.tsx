"use client";
import { useState } from "react";
export function ProductImageView({ src, alt, thumbnail = false, eager = false }: { src?: string; alt: string; thumbnail?: boolean; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <span className="image-unavailable" role={thumbnail ? undefined : "img"} aria-label={thumbnail ? undefined : alt}>{thumbnail ? "—" : "Visuel indisponible"}</span>;
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailedSrc(src)} />;
}
