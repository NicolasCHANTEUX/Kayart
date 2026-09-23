"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import type { Product } from "@/types/catalog";
import { ProductCard } from "./product-card";

const intervalMs = 5000;

export function FeaturedProductsCarousel({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(1);
  const visibleRef = useRef(3);
  const movingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreClickUntilRef = useRef(0);
  const canSlide = products.length > visibleCount;

  const moveTo = useCallback((nextPosition: number, withAnimation: boolean) => {
    positionRef.current = nextPosition;
    movingRef.current = withAnimation;
    setAnimate(withAnimation);
    setPosition(nextPosition);
  }, []);

  const next = useCallback(() => {
    if (!canSlide || movingRef.current) return;
    const lastPosition = products.length;
    if (reducedMotion) moveTo(positionRef.current >= lastPosition ? 1 : positionRef.current + 1, false);
    else moveTo(positionRef.current + 1, true);
  }, [canSlide, moveTo, products.length, reducedMotion]);

  const previous = useCallback(() => {
    if (!canSlide || movingRef.current) return;
    if (reducedMotion) moveTo(positionRef.current <= 1 ? products.length : positionRef.current - 1, false);
    else moveTo(positionRef.current - 1, true);
  }, [canSlide, moveTo, products.length, reducedMotion]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      if (first && second) setStep(second.offsetLeft - first.offsetLeft);
      const count = window.innerWidth <= 800 ? 2 : 3;
      if (count !== visibleRef.current) {
        visibleRef.current = count;
        setVisibleCount(count);
        moveTo(1, false);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [moveTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!canSlide || paused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") next();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [canSlide, interacting, next, paused, reducedMotion]);

  const onTransitionEnd = () => {
    movingRef.current = false;
    if (positionRef.current === products.length + 1) moveTo(1, false);
    if (positionRef.current === 0) moveTo(products.length, false);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    ignoreClickUntilRef.current = Date.now() + 500;
    if (deltaX < 0) next();
    else previous();
  };

  const preventClickAfterSwipe = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() < ignoreClickUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const currentNumber = ((position - 1 + products.length) % products.length) + 1;
  const renderSlide = (product: Product, key: string, duplicate = false) =>
    <div className="featured-carousel__slide" key={key} aria-hidden={duplicate ? true : undefined} inert={duplicate}>
      <ProductCard product={product} />
    </div>;

  return <div className="featured-carousel" role="region" aria-roledescription="carrousel" aria-label="Produits mis en avant">
    <div className="featured-carousel__viewport" ref={viewportRef} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClickCapture={preventClickAfterSwipe}>
      <div className="featured-carousel__track" ref={trackRef} onTransitionEnd={event => { if (event.target === trackRef.current && event.propertyName === "transform") onTransitionEnd(); }} style={step ? { transform: `translate3d(-${position * step}px, 0, 0)`, transition: animate ? undefined : "none" } : undefined}>
        {renderSlide(products[products.length - 1], `before-${products[products.length - 1].id}`, true)}
        {products.map(product => renderSlide(product, product.id))}
        {products.slice(0, 3).map(product => renderSlide(product, `after-${product.id}`, true))}
      </div>
    </div>
    {canSlide ? <div className="featured-carousel__controls">
      <span className="featured-carousel__count" aria-label={`Produit ${currentNumber} sur ${products.length}`}>{currentNumber} / {products.length}</span>
      <button type="button" className="featured-carousel__control" onClick={previous} aria-label="Produits précédents">←</button>
      <button type="button" className="featured-carousel__control" onClick={next} aria-label="Produits suivants">→</button>
      {!reducedMotion ? <button type="button" className="featured-carousel__pause" onClick={() => setPaused(value => !value)}>{paused ? "Reprendre" : "Pause"}</button> : null}
    </div> : null}
  </div>;
}
