import { useState, useRef, cloneElement, isValidElement, ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ResumeUploadProps {
  candidateId: string;
  companyId: string;
  existingResumeUrl?: string | null;
  onUploadComplete?: (url: string) => void;
  onRemove?: () => void;
  compact?: boolean;
  primaryColor?: string;
  trigger?: ReactElement;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ResumeUpload({
  candidateId,
  companyId,
  existingResumeUrl,
  onUploadComplete,
  onRemove,
  compact = false,
  primaryColor = '#9b87f5',
  trigger,
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingResumeUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${candidateId}/resume-${Date.now()}.${fileExt}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('candidate-resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('candidate-resumes')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      const resumeUrl = urlData?.signedUrl || '';

      setUploadProgress(80);

      // Update candidate record
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ resume_url: resumeUrl })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      setUploadProgress(100);
      setUploadedUrl(resumeUrl);

      toast({
        title: 'Resume uploaded',
        description: 'Your resume has been uploaded successfully.',
      });

      onUploadComplete?.(resumeUrl);

      // Trigger AI parsing in background
      supabase.functions.invoke('parse-resume', {
        body: { candidateId, resumeUrl },
      }).catch(err => console.error('Resume parsing failed:', err));

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload resume.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    try {
      await supabase
        .from('candidates')
        .update({ resume_url: null, resume_parsed_content: null })
        .eq('id', candidateId);

      setUploadedUrl(null);
      onRemove?.();

      toast({ title: 'Resume removed' });
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  // If a custom trigger is provided, render it with click handler
  if (trigger && isValidElement(trigger)) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        {cloneElement(trigger as ReactElement<any>, {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          },
          disabled: uploading,
        })}
      </>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {uploadedUrl ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(uploadedUrl, '_blank')}
            >
              <FileText className="h-4 w-4 mr-1" />
              View Resume
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload Resume
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        
        {uploadedUrl ? (
          <div className="p-4 flex items-center justify-between bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Resume Uploaded</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Click to view or replace
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(uploadedUrl, '_blank')}
              >
                <FileText className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "p-8 text-center cursor-pointer transition-colors border-2 border-dashed rounded-lg m-2",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-primary/20">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium mb-1">Upload Your Resume</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF or Word document, max 10MB
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
