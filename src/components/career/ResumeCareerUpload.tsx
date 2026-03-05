import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ResumeCareerUploadProps {
  primaryColor: string;
  userId: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Extract text from PDF using pdf.js
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
}

export default function ResumeCareerUpload({ primaryColor, userId }: ResumeCareerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, Word document, or image (PNG, JPG).',
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

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(10);

    try {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      let resumeBase64 = '';
      let resumeText = '';
      
      if (isImage) {
        // Convert images to base64 for vision API
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        resumeBase64 = await base64Promise;
        setUploadProgress(40);
      } else if (isPDF) {
        // Extract text from PDF
        setUploadProgress(20);
        try {
          resumeText = await extractTextFromPDF(file);
          console.log('Extracted PDF text length:', resumeText.length);
        } catch (pdfErr) {
          console.error('PDF extraction failed:', pdfErr);
          // Continue without text - will use fallback
        }
        setUploadProgress(40);
      }

      setUploadProgress(50);
      setUploading(false);
      setAnalyzing(true);

      // Call the AI analysis function
      const { data, error } = await supabase.functions.invoke('analyze-career-resume', {
        body: {
          resumeBase64: isImage ? resumeBase64 : '',
          resumeText: resumeText, // Send extracted text for PDFs
          fileType: file.type,
          primaryColor,
        },
      });

      if (error) throw error;

      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Store analysis results in localStorage for the results page
      const analysisKey = `career_resume_analysis_${userId}`;
      localStorage.setItem(analysisKey, JSON.stringify({
        analysis: data.analysis,
        analyzedAt: new Date().toISOString(),
        fileName: file.name,
      }));

      toast({
        title: 'Resume Analyzed!',
        description: 'Your personalized career insights are ready.',
      });

      // Reset state before navigation to avoid setState on unmounted component
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
      setFileName(null);

      // Navigate to the resume results page
      navigate('/career-finder/resume-results');
      return; // Exit early - don't run finally setState

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze resume. Please try again.',
        variant: 'destructive',
      });
      // Only reset state on error since we're staying on page
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
      setFileName(null);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (analyzing) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">AI is Analyzing Your Resume</h3>
              <p className="text-muted-foreground">
                Matching your experience to careers that fit your <span className="font-semibold text-primary">{primaryColor}</span> profile...
              </p>
            </div>
            {fileName && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {fileName}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">This usually takes 15-30 seconds...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "cursor-pointer text-center transition-all",
            dragActive && "scale-105 opacity-70"
          )}
        >
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <div className="space-y-2">
                <p className="font-medium">Uploading resume...</p>
                <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Upload Your Resume</h3>
                <p className="text-muted-foreground text-sm">
                  Get AI-powered career insights personalized to your experience
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Drag & drop or click to upload</p>
                <p className="text-xs mt-1">PDF or Word document • Max 10MB</p>
              </div>
              <Button variant="outline" className="mt-2">
                <Upload className="w-4 h-4 mr-2" />
                Select Resume
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
