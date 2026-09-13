"use client";
import { useState } from "react";
export function UnavailableImageArt() {
  return <svg className="unavailable-art" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M10 14H54V52H10Z" stroke="#105bc6" strokeWidth="3" />
    <path d="M14 10H58V48" stroke="#c80703" strokeWidth="3" />
    <path d="M6 18V56H50" stroke="#ffd500" strokeWidth="3" />
    <path d="m35 6-5 16 9 5-7 13" stroke="#883a7d" strokeWidth="4" />
    <circle cx="22" cy="29" r="3" fill="#ffd500" />
    <path d="m44 24 6 6m0-6-6 6M20 44q12-10 24 0" stroke="#151720" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
export function ProductImageView({ src, alt, thumbnail = false, eager = false }: { src?: string; alt: string; thumbnail?: boolean; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <span className={`image-unavailable${thumbnail ? " image-unavailable--thumbnail" : ""}`} role={thumbnail ? undefined : "img"} aria-label={thumbnail ? undefined : alt || "Visuel indisponible"}><UnavailableImageArt />{thumbnail ? null : <span>Visuel indisponible</span>}</span>;
  // Native requests preserve session cookies for private images and support local blob previews.
  // Uploaded product images are already resized and encoded as WebP on the server.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailedSrc(src)} />;
}
