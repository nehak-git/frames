import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  description?: string;
  tags?: string[];
}

interface ImageUploadProps {
  onUploadComplete?: (image: UploadedImage) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  accept = "image/jpeg,image/png,image/gif,image/webp",
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        onUploadError?.(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setIsUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        setProgress(100);
        const result = await response.json();
        onUploadComplete?.(result);
      } catch (error) {
        onUploadError?.(
          error instanceof Error ? error.message : "Upload failed"
        );
        setPreview(null);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [maxSizeMB, onUploadComplete, onUploadError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-ring/50 hover:bg-secondary/50"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {preview ? (
          <div className="relative h-full w-full p-4">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-40 rounded-lg object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-bg/80">
                <div className="w-48">
                  <div className="mb-2 text-center text-sm text-muted-fg">
                    Uploading... {progress}%
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-8">
            <svg
              className="h-10 w-10 text-muted-fg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-muted-fg">
              Click or drag and drop to upload
            </p>
            <p className="text-xs text-muted-fg">
              JPEG, PNG, GIF, WebP (max {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {preview && !isUploading && (
        <Button
          intent="secondary"
          size="sm"
          onPress={() => {
            setPreview(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
