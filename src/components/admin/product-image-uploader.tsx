"use client";

import { useEffect, useRef, useState } from "react";

type PreviewImage = {
  file: File;
  name: string;
  size: number;
  url: string;
};

type DirectUploadTarget = {
  bucket: string;
  signedUrl: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  isPrimary: boolean;
  position: number;
};

type ProductImageUploaderProps = {
  disabled?: boolean;
  emptyHint?: string;
  hint?: string;
  title?: string;
};

const maxImageCount = 6;
const maxImageSizeBytes = 12 * 1024 * 1024;
const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png", "image/webp"];

export function ProductImageUploader({
  disabled = false,
  emptyHint = "Aucune image sélectionnée. La première image pourra devenir la couverture.",
  hint = "ou cliquer pour ajouter jusqu'à 6 fichiers de 12 Mo maximum",
  title = "Glisser les images ici"
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PreviewImage[]>([]);
  const coverIndexRef = useRef(0);
  const disabledRef = useRef(disabled);
  const isDirectUploadReadyRef = useRef(false);
  const isUploadingRef = useRef(false);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isDisabled = disabled || isUploading;

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    coverIndexRef.current = coverIndex;
  }, [coverIndex]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    const form = inputRef.current?.form;

    if (!form) {
      return;
    }

    const currentForm = form;

    function handleSubmit(event: SubmitEvent) {
      if (disabledRef.current || !shouldUseDirectImageUpload()) {
        return;
      }

      if (isDirectUploadReadyRef.current) {
        isDirectUploadReadyRef.current = false;
        return;
      }

      const currentImages = imagesRef.current;

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
  }, []);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  function addFiles(files: File[]) {
    const availableSlots = Math.max(maxImageCount - images.length, 0);
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
      setUploadError("Chaque image doit faire 12 Mo maximum.");
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

  async function prepareDirectUploadAndSubmit(form: HTMLFormElement, selectedImages: PreviewImage[]) {
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
        <small>{isUploading ? "Merci de patienter pendant le transfert vers Supabase." : hint}</small>
      </button>

      {uploadError ? <p className="form-notice form-notice--error">{uploadError}</p> : null}

      {images.length > 0 ? (
        <div className="image-uploader-grid" aria-label="Images sélectionnées">
          {images.map((image, index) => (
            <div className="image-uploader-item" key={`${image.name}-${image.size}-${image.file.lastModified}`}>
              <img alt="" src={image.url} />
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

function shouldUseDirectImageUpload() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

async function uploadImagesToSupabase(images: PreviewImage[], coverIndex: number) {
  const response = await fetch("/api/admin/product-images/upload-url", {
    body: JSON.stringify({
      files: images.map((image, index) => ({
        name: image.name,
        type: image.file.type,
        size: image.size,
        isPrimary: index === coverIndex,
        position: index
      }))
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    uploads?: DirectUploadTarget[];
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Impossible de préparer l'envoi des images.");
  }

  if (!payload.uploads || payload.uploads.length !== images.length) {
    throw new Error("La préparation des images est incomplète.");
  }

  await Promise.all(
    payload.uploads.map(async (target, index) => {
      const body = new FormData();

      body.append("cacheControl", "31536000");
      body.append("", images[index].file);

      const uploadResponse = await fetch(target.signedUrl, {
        body,
        headers: {
          "x-upsert": "false"
        },
        method: "PUT"
      });

      if (!uploadResponse.ok) {
        throw new Error("Impossible d'envoyer une image vers Supabase.");
      }
    })
  );

  return payload.uploads;
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
    field.value = JSON.stringify({
      bucket: image.bucket,
      path: image.publicUrl,
      originalFilename: image.originalFilename,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      isPrimary: image.isPrimary,
      position: image.position
    });

    form.appendChild(field);
  });
}

function getUploadErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Impossible d'envoyer les images pour le moment.";
}
