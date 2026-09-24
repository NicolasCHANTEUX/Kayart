"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ProductImage } from "@/types/catalog";
import { ProductImageView, UnavailableImageArt } from "./product-image";

type ProductGalleryProps = { images: ProductImage[]; title: string };
type Point = { x: number; y: number };

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const sortedImages = useMemo(
    () => [...images].sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary) || first.position - second.position),
    [images]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const dragStartRef = useRef<(Point & { panX: number; panY: number }) | null>(null);
  const swipeStartRef = useRef<Point | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const wasPinchingRef = useRef(false);
  const currentIndex = Math.max(0, sortedImages.findIndex(image => image.id === selectedId));
  const currentImage = sortedImages[currentIndex];
  const hasMultipleImages = sortedImages.length > 1;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  function applyPan(x: number, y: number, scale = zoomRef.current) {
    const viewport = viewportRef.current;
    const maxX = viewport ? (scale - 1) * viewport.clientWidth / 2 : 0;
    const maxY = viewport ? (scale - 1) * viewport.clientHeight / 2 : 0;
    const next = { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    panRef.current = next;
    setPan(next);
  }

  function applyZoom(value: number, focus?: Point) {
    const previous = zoomRef.current;
    const next = Math.max(1, Math.min(4, Math.round(value * 100) / 100));
    zoomRef.current = next;
    setZoom(next);
    const viewport = viewportRef.current;
    if (focus && viewport) {
      const rect = viewport.getBoundingClientRect();
      const x = focus.x - rect.left - rect.width / 2;
      const y = focus.y - rect.top - rect.height / 2;
      applyPan(x - (x - panRef.current.x) * next / previous, y - (y - panRef.current.y) * next / previous, next);
    } else {
      applyPan(panRef.current.x, panRef.current.y, next);
    }
  }

  function resetView() {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pointersRef.current.clear();
    dragStartRef.current = null;
    swipeStartRef.current = null;
    pinchStartRef.current = null;
    wasPinchingRef.current = false;
  }

  function selectImage(index: number) {
    setSelectedId(sortedImages[index]?.id ?? null);
    resetView();
  }
  function showPreviousImage() { selectImage(currentIndex === 0 ? sortedImages.length - 1 : currentIndex - 1); }
  function showNextImage() { selectImage(currentIndex === sortedImages.length - 1 ? 0 : currentIndex + 1); }

  function openLightbox() {
    if (!currentImage || dialogRef.current?.open) return;
    resetView();
    dialogRef.current?.showModal();
    setIsOpen(true);
    closeButtonRef.current?.focus();
  }

  function handleDialogClose() {
    setIsOpen(false);
    resetView();
    openButtonRef.current?.focus();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft" && hasMultipleImages) { event.preventDefault(); showPreviousImage(); }
    if (event.key === "ArrowRight" && hasMultipleImages) { event.preventDefault(); showNextImage(); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); applyZoom(zoomRef.current + 0.5); }
    if (event.key === "-") { event.preventDefault(); applyZoom(zoomRef.current - 0.5); }
    if (event.key === "0") { event.preventDefault(); resetView(); }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.pointerType === "mouse" && event.button !== 0) || (event.target as Element).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size === 1) {
      dragStartRef.current = { ...point, panX: panRef.current.x, panY: panRef.current.y };
      swipeStartRef.current = point;
      wasPinchingRef.current = false;
    } else if (pointersRef.current.size === 2) {
      pinchStartRef.current = { distance: pointerDistance(pointersRef.current), zoom: zoomRef.current };
      wasPinchingRef.current = true;
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      applyZoom(pinchStartRef.current.zoom * pointerDistance(pointersRef.current) / pinchStartRef.current.distance, pointerMidpoint(pointersRef.current));
    } else if (zoomRef.current > 1 && dragStartRef.current) {
      applyPan(dragStartRef.current.panX + event.clientX - dragStartRef.current.x, dragStartRef.current.panY + event.clientY - dragStartRef.current.y);
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    if (!pointersRef.current.has(event.pointerId)) return;
    if (!cancelled && !wasPinchingRef.current && zoomRef.current === 1 && swipeStartRef.current && hasMultipleImages) {
      const dx = event.clientX - swipeStartRef.current.x;
      const dy = event.clientY - swipeStartRef.current.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx < 0) showNextImage(); else showPreviousImage();
      }
    }
    pointersRef.current.delete(event.pointerId);
    pinchStartRef.current = null;
    const remaining = pointersRef.current.values().next().value;
    dragStartRef.current = remaining ? { ...remaining, panX: panRef.current.x, panY: panRef.current.y } : null;
    if (!remaining) { swipeStartRef.current = null; wasPinchingRef.current = false; }
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        {currentImage ? (
          <button aria-label={`Agrandir l’image ${currentIndex + 1} de ${title}`} className="product-gallery__open" onClick={openLightbox} ref={openButtonRef} type="button">
            <ProductImageView eager alt={currentImage.altText ?? title} src={currentImage.url} />
            <span aria-hidden="true" className="product-gallery__expand"><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 2H2v5M13 2h5v5M2 13v5h5m11-5v5h-5" /></svg>Agrandir</span>
          </button>
        ) : (
          <div className="product-gallery__empty"><UnavailableImageArt /><span>Visuel à venir</span><strong>{title}</strong></div>
        )}
        {hasMultipleImages ? (
          <>
            <button aria-label="Image précédente" className="product-gallery__nav product-gallery__nav--previous" onClick={showPreviousImage} type="button">{"<"}</button>
            <button aria-label="Image suivante" className="product-gallery__nav product-gallery__nav--next" onClick={showNextImage} type="button">{">"}</button>
            <span className="product-gallery__counter">{currentIndex + 1} / {sortedImages.length}</span>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div aria-label="Images du produit" className="product-gallery__thumbs">
          {sortedImages.map((image, index) => (
            <button aria-current={index === currentIndex ? "true" : undefined} aria-label={`Afficher l’image ${index + 1}`} className="product-gallery__thumb" key={image.id} onClick={() => selectImage(index)} type="button">
              <ProductImageView thumbnail alt="" src={image.url} />
            </button>
          ))}
        </div>
      ) : null}

      {currentImage ? (
        <dialog aria-label={`Photos de ${title}`} className="product-lightbox" onClose={handleDialogClose} onKeyDown={handleDialogKeyDown} ref={dialogRef}>
          <div className="product-lightbox__header">
            <div className="product-lightbox__title"><strong>{title}</strong><span aria-live="polite">Image {currentIndex + 1} sur {sortedImages.length}</span></div>
            <button aria-label="Fermer la photo agrandie" className="product-lightbox__control" onClick={() => dialogRef.current?.close()} ref={closeButtonRef} type="button">✕</button>
          </div>
          <div className="product-lightbox__viewport" data-zoomed={zoom > 1} onDoubleClick={event => { if (!(event.target as Element).closest("button")) applyZoom(zoomRef.current === 1 ? 2.5 : 1, { x: event.clientX, y: event.clientY }); }} onPointerCancel={event => handlePointerEnd(event, true)} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} ref={viewportRef}>
            <div className="product-lightbox__media" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}>
              <ProductImageView eager alt={currentImage.altText ?? title} src={currentImage.url} />
            </div>
            {hasMultipleImages ? (
              <>
                <button aria-label="Photo précédente" className="product-lightbox__nav product-lightbox__nav--previous" onClick={showPreviousImage} type="button">‹</button>
                <button aria-label="Photo suivante" className="product-lightbox__nav product-lightbox__nav--next" onClick={showNextImage} type="button">›</button>
              </>
            ) : null}
          </div>
          <div className="product-lightbox__footer">
            <span className="product-lightbox__hint">Pincez ou double-cliquez pour zoomer</span>
            <div aria-label="Zoom" className="product-lightbox__controls">
              <button aria-label="Dézoomer" className="product-lightbox__control" disabled={zoom <= 1} onClick={() => applyZoom(zoomRef.current - 0.5)} type="button">−</button>
              <span aria-live="polite">{Math.round(zoom * 100)} %</span>
              <button aria-label="Zoomer" className="product-lightbox__control" disabled={zoom >= 4} onClick={() => applyZoom(zoomRef.current + 0.5)} type="button">+</button>
              <button aria-label="Réinitialiser le zoom" className="product-lightbox__control product-lightbox__control--reset" disabled={zoom === 1} onClick={resetView} type="button">1:1</button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

function pointerDistance(pointers: Map<number, Point>) {
  const [first, second] = [...pointers.values()];
  return Math.max(1, Math.hypot(first.x - second.x, first.y - second.y));
}

function pointerMidpoint(pointers: Map<number, Point>): Point {
  const [first, second] = [...pointers.values()];
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}
