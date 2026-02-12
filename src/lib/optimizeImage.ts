/**
 * Client-side image optimization: resizes and converts to WebP before upload.
 * Uses Canvas API — no server-side dependencies needed.
 */

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.82
}

const DEFAULT_OPTIONS: OptimizeOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.82,
};

export async function optimizeImage(
  file: File,
  options?: OptimizeOptions
): Promise<File> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;

  // Skip SVGs — can't rasterize meaningfully
  if (file.type === "image/svg+xml") return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate scale to fit within max dimensions
      const scale = Math.min(
        1,
        (maxWidth ?? width) / width,
        (maxHeight ?? height) / height
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Build new filename with .webp extension
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
          });

          resolve(optimizedFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = url;
  });
}
