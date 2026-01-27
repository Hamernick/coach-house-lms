import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
  onUpload?: (url: string) => void;
  uploadFile?: (file: File) => Promise<string>;
}

export function useImageUpload({ onUpload, uploadFile }: UseImageUploadProps = {}) {
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackUpload = async (_file: File, localUrl: string): Promise<string> => localUrl;

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        previewRef.current = localUrl;

        try {
          setUploading(true);
          const uploadedUrl = uploadFile
            ? await uploadFile(file)
            : await fallbackUpload(file, localUrl);
          setError(null);
          onUpload?.(uploadedUrl);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          setError(errorMessage);
          URL.revokeObjectURL(localUrl);
          setPreviewUrl(null);
          setFileName(null);
          setUploading(false);
          return console.error(err)
        } finally {
          setUploading(false);
        }
      }
    },
    [onUpload, uploadFile]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    previewRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  };
}
