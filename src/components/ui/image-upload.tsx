
"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  currentImage?: string | null;
  onFileChange: (file: File | null) => Promise<void>;
  disabled?: boolean;
}

export function ImageUpload({ currentImage, onFileChange, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadStatus('uploading');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Simulate progress for immediate feedback
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if(progress >= 90) clearInterval(interval);
      }, 100);

      onFileChange(file).then(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadStatus('success');
      }).catch(() => {
        setUploadStatus('error');
      }).finally(() => {
         setTimeout(() => {
            setUploadProgress(null);
            setUploadStatus('idle');
         }, 2000);
      });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    return (names[0][0] + (names.length > 1 ? names[names.length-1][0] : '')).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={preview || currentImage || undefined} />
        <AvatarFallback className="text-xl">
            {getInitials(preview)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
             <UploadCloud className="mr-2 h-4 w-4" />
          )}
          
          {uploadStatus === 'uploading' ? `Uploading...` : 'Change Avatar'}
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        {uploadProgress !== null && (
            <div className="mt-2 flex items-center gap-2">
                <Progress value={uploadProgress} className="w-full" />
                {uploadStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {uploadStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
        )}
      </div>
    </div>
  );
}
