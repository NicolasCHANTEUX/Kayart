"use client";

import { ProductImageView } from "@/components/catalog/product-image";
import { useCallback, useEffect, useRef, useState } from "react";

type PreviewImage = {
  file: File;
  name: string;
  size: number;
  url: string;
};

type DirectUploadTarget = { receipt: string };

type ProductImageUploaderProps = {
  disabled?: boolean;
  emptyHint?: string;
  hint?: string;
  title?: string;
  maxFiles?: number;
};

const maxImageCount = 6;
const maxImageSizeBytes = 4 * 1024 * 1024;
const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png", "image/webp"];

export function ProductImageUploader({
  disabled = false,
  maxFiles = 6,
  emptyHint = "Aucune image sélectionnée. La première image pourra devenir la couverture.",
  hint = "ou cliquer pour ajouter jusqu'à 6 fichiers de 4 Mo maximum",
  title = "Glisser les images ici"
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewImage[]>([]);
  const coverIndexRef = useRef(0);
  const disabledRef = useRef(disabled);
  const maxFilesRef = useRef(maxFiles);
  const isDirectUploadReadyRef = useRef(false);
  const isUploadingRef = useRef(false);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isDisabled = disabled || isUploading;

  const syncInputFiles = useCallback((nextImages: PreviewImage[]) => {
    const transfer = new DataTransfer();

    nextImages.forEach((image) => transfer.items.add(image.file));

    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }, []);

  const prepareDirectUploadAndSubmit = useCallback(async (form: HTMLFormElement, selectedImages: PreviewImage[]) => {
    setUploadError(null);
    setIsUploading(true);
    isUploadingRef.current = true;

    try {
      const uploadedImages = await uploadImagesToSupabase(selectedImages, coverIndexRef.current);
      attachUploadedImageFields(form, uploadedImages);

      syncInputFiles([]);
      isDirectUploadReadyRef.current = true;
      form.requestSubmit();
    } catch (error) {
      setUploadError(getUploadErrorMessage(error));
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [syncInputFiles]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    coverIndexRef.current = coverIndex;
  }, [coverIndex]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => { maxFilesRef.current = maxFiles; }, [maxFiles]);

  useEffect(() => {
    const form = inputRef.current?.form;

    if (!form) {
      return;
    }

    const currentForm = form;

    function handleSubmit(event: SubmitEvent) {
      if (disabledRef.current) {
        return;
      }

      if (isDirectUploadReadyRef.current) {
        isDirectUploadReadyRef.current = false;
        return;
      }

      const currentImages = imagesRef.current;

      if (currentImages.length > maxFilesRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setUploadError("Six images maximum au total. Retirez une image avant d’enregistrer.");
        return;
      }

      if (currentImages.length === 0) {
        return;
      }

      if (isUploadingRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (!currentForm.checkValidity()) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      void prepareDirectUploadAndSubmit(currentForm, currentImages);
    }

    currentForm.addEventListener("submit", handleSubmit, true);

    return () => {
      currentForm.removeEventListener("submit", handleSubmit, true);
    };
  }, [prepareDirectUploadAndSubmit]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  function addFiles(files: File[]) {
    const availableSlots = Math.max(Math.min(maxImageCount, maxFiles) - images.length, 0);
    const imageFiles = files.filter((file) => acceptedImageTypes.includes(file.type));
    const hasRejectedFile = files.some((file) => !acceptedImageTypes.includes(file.type));
    const hasOversizedFile = imageFiles.some((file) => file.size > maxImageSizeBytes);
    const nextFiles = imageFiles
      .filter((file) => file.size <= maxImageSizeBytes)
      .filter((file) => !images.some((image) => isSameFile(image.file, file)))
      .slice(0, availableSlots);

    if (hasRejectedFile) {
      setUploadError("Seuls les fichiers JPG, PNG, WebP ou GIF sont acceptés.");
    } else if (hasOversizedFile) {
      setUploadError("Chaque image doit faire 4 Mo maximum.");
    } else if (imageFiles.length > availableSlots) {
      setUploadError("Six images maximum au total, images déjà enregistrées comprises.");
    } else {
      setUploadError(null);
    }

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

  function moveImage(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    syncInputFiles(reordered);
    setImages(reordered);
    setCoverIndex(current => current === index ? target : current === target ? index : current);
  }


  return (
    <>
      <input name="coverImageIndex" type="hidden" value={String(coverIndex)} />
      <input
        ref={inputRef}
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={isDisabled}
        multiple
        name="images"
        onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
        type="file"
      />

      <button
        className={`drop-zone${isDragging ? " drop-zone--active" : ""}`}
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) {
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (isDisabled) {
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
          if (isDisabled) {
            return;
          }

          setIsDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        type="button"
      >
        <span>{isUploading ? "Envoi des images..." : title}</span>
        <small>{isUploading ? "Merci de patienter pendant le traitement des images." : hint}</small>
      </button>

      {uploadError ? <p className="form-notice form-notice--error">{uploadError}</p> : null}

      {images.length > 0 ? (
        <div className="image-uploader-grid" aria-label="Images sélectionnées">
          {images.map((image, index) => (
            <div className="image-uploader-item" key={`${image.name}-${image.size}-${image.file.lastModified}`}>
              <ProductImageView alt="" src={image.url} />
              <button
                aria-pressed={coverIndex === index}
                className="cover-button"
                disabled={isDisabled}
                onClick={() => setCoverIndex(index)}
                type="button"
              >
                {coverIndex === index ? "\u2605" : "\u2606"}
                <span>Image de couverture</span>
              </button>
              <button
                aria-label={`Retirer ${image.name}`}
                className="remove-image-button"
                disabled={isDisabled}
                onClick={() => removeImage(index)}
                type="button"
              >
                {"\u00d7"}
                <span>Retirer l'image</span>
              </button>
              <p>{image.name}</p>
              <div className="actions-row">
                <button type="button" disabled={isDisabled || index === 0} aria-label={`Avancer ${image.name}`} onClick={() => moveImage(index, -1)}>Avancer</button>
                <button type="button" disabled={isDisabled || index === images.length - 1} aria-label={`Reculer ${image.name}`} onClick={() => moveImage(index, 1)}>Reculer</button>
              </div>
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

async function uploadImagesToSupabase(images: PreviewImage[], coverIndex: number) {
  const results: DirectUploadTarget[] = [];
  for (const [index, image] of images.entries()) {
    const body = new FormData();
    body.set("image", image.file);
    body.set("position", String(index));
    body.set("isPrimary", String(index === coverIndex));
    const response = await fetch("/api/admin/product-images/upload", { method: "POST", body });
    const payload = await response.json().catch(() => ({})) as { receipt?: string; error?: string };
    if (!response.ok || !payload.receipt) throw new Error(payload.error ?? "Envoi impossible.");
    results.push({ receipt: payload.receipt });
  }
  return results;
}

function attachUploadedImageFields(form: HTMLFormElement, uploadedImages: DirectUploadTarget[]) {
  form
    .querySelectorAll<HTMLInputElement>('input[data-direct-upload-field="true"]')
    .forEach((field) => field.remove());

  uploadedImages.forEach((image) => {
    const field = document.createElement("input");

    field.dataset.directUploadField = "true";
    field.name = "uploadedImage";
    field.type = "hidden";
    field.value = image.receipt;

    form.appendChild(field);
  });
}

function getUploadErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Impossible d'envoyer les images pour le moment.";
}
