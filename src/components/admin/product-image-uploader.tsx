"use client";

import { useEffect, useRef, useState } from "react";

type PreviewImage = {
  file: File;
  name: string;
  size: number;
  url: string;
};

type ProductImageUploaderProps = {
  disabled?: boolean;
  emptyHint?: string;
  hint?: string;
  title?: string;
};

const maxImageCount = 6;

export function ProductImageUploader({
  disabled = false,
  emptyHint = "Aucune image sélectionnée. La première image pourra devenir la couverture.",
  hint = "ou cliquer pour ajouter jusqu'à 6 fichiers de 12 Mo maximum",
  title = "Glisser les images ici"
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewImage[]>([]);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  function addFiles(files: File[]) {
    const availableSlots = Math.max(maxImageCount - images.length, 0);
    const nextFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .filter((file) => !images.some((image) => isSameFile(image.file, file)))
      .slice(0, availableSlots);

    if (nextFiles.length === 0) {
      syncInputFiles(images);
      return;
    }

    const nextImages = [
      ...images,
      ...nextFiles.map((file) => ({
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      }))
    ];

    syncInputFiles(nextImages);
    setImages(nextImages);
    setCoverIndex((current) => Math.min(current, Math.max(nextImages.length - 1, 0)));
  }

  function removeImage(indexToRemove: number) {
    const removedImage = images[indexToRemove];
    const nextImages = images.filter((_, index) => index !== indexToRemove);

    if (removedImage) {
      URL.revokeObjectURL(removedImage.url);
    }

    syncInputFiles(nextImages);
    setImages(nextImages);
    setCoverIndex((current) => {
      if (nextImages.length === 0) {
        return 0;
      }

      if (indexToRemove === current) {
        return Math.min(current, nextImages.length - 1);
      }

      if (indexToRemove < current) {
        return current - 1;
      }

      return current;
    });
  }

  function syncInputFiles(nextImages: PreviewImage[]) {
    const transfer = new DataTransfer();

    nextImages.forEach((image) => transfer.items.add(image.file));

    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }

  return (
    <>
      <input name="coverImageIndex" type="hidden" value={String(coverIndex)} />
      <input
        ref={inputRef}
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        multiple
        name="images"
        onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
        type="file"
      />

      <button
        className={`drop-zone${isDragging ? " drop-zone--active" : ""}`}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (disabled) {
            return;
          }

          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled) {
            return;
          }

          setIsDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        type="button"
      >
        <span>{title}</span>
        <small>{hint}</small>
      </button>

      {images.length > 0 ? (
        <div className="image-uploader-grid" aria-label="Images sélectionnées">
          {images.map((image, index) => (
            <div className="image-uploader-item" key={`${image.name}-${image.size}-${image.file.lastModified}`}>
              <img alt="" src={image.url} />
              <button
                aria-pressed={coverIndex === index}
                className="cover-button"
                disabled={disabled}
                onClick={() => setCoverIndex(index)}
                type="button"
              >
                {coverIndex === index ? "\u2605" : "\u2606"}
                <span>Image de couverture</span>
              </button>
              <button
                aria-label={`Retirer ${image.name}`}
                className="remove-image-button"
                disabled={disabled}
                onClick={() => removeImage(index)}
                type="button"
              >
                {"\u00d7"}
                <span>Retirer l'image</span>
              </button>
              <p>{image.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="form-hint">{emptyHint}</p>
      )}
    </>
  );
}

function isSameFile(firstFile: File, secondFile: File) {
  return (
    firstFile.name === secondFile.name &&
    firstFile.size === secondFile.size &&
    firstFile.lastModified === secondFile.lastModified
  );
}
