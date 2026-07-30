"use client";

import { useMemo, useState } from "react";
import type { ProductImage } from "@/types/catalog";

type ProductGalleryProps = {
  images: ProductImage[];
  title: string;
};

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const sortedImages = useMemo(
    () => [...images].sort((first, second) => first.position - second.position),
    [images]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = sortedImages[currentIndex];
  const hasMultipleImages = sortedImages.length > 1;

  function showPreviousImage() {
    setCurrentIndex((index) => (index === 0 ? sortedImages.length - 1 : index - 1));
  }

  function showNextImage() {
    setCurrentIndex((index) => (index === sortedImages.length - 1 ? 0 : index + 1));
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        {currentImage ? (
          <img alt={currentImage.altText ?? title} src={currentImage.url} />
        ) : (
          <div className="product-gallery__empty">
            <span>Visuel à venir</span>
            <strong>{title}</strong>
          </div>
        )}

        {hasMultipleImages ? (
          <>
            <button
              aria-label="Image précédente"
              className="product-gallery__nav product-gallery__nav--previous"
              onClick={showPreviousImage}
              type="button"
            >
              {"<"}
            </button>
            <button
              aria-label="Image suivante"
              className="product-gallery__nav product-gallery__nav--next"
              onClick={showNextImage}
              type="button"
            >
              {">"}
            </button>
            <span className="product-gallery__counter">
              {currentIndex + 1} / {sortedImages.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="product-gallery__thumbs" aria-label="Images du produit">
          {sortedImages.map((image, index) => (
            <button
              aria-current={index === currentIndex ? "true" : undefined}
              aria-label={`Afficher l'image ${index + 1}`}
              className="product-gallery__thumb"
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              type="button"
            >
              <img alt="" src={image.url} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
