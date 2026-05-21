import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function Dropzone({
  onFiles,
  disabled,
  maxFiles = 5,
  maxSizeMb = 10,
}: DropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], _rejected: FileRejection[]) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles,
    maxSize: maxSizeMb * 1024 * 1024,
    disabled,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors cursor-pointer hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudUpload className="h-6 w-6" />
        </span>
        <div>
          <p className="font-medium">
            {isDragActive ? 'Drop your files here' : 'Drag & drop booking documents'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse · PDF, JPG, PNG · up to {maxFiles} files · {maxSizeMb}MB each
          </p>
        </div>
      </div>
      {fileRejections.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-destructive">
          {fileRejections.map(({ file, errors }) => (
            <li key={file.name}>
              {file.name}: {errors.map((e) => e.message).join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
