import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw, ZoomIn, ZoomOut, Crop as CropIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LogoCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  mode: 'light' | 'dark';
  companyId: string;
  onComplete: (url: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function LogoCropperModal({
  open,
  onOpenChange,
  imageFile,
  mode,
  companyId,
  onComplete,
}: LogoCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(4);
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Load image when file changes
  useEffect(() => {
    if (imageFile && open) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    } else if (!open) {
      // Reset when modal closes
      setImageSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      setScale(1);
    }
  }, [imageFile, open]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect || 4));
  }, [aspect]);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to desired output (200x50 recommended)
    const outputWidth = 400;
    const outputHeight = 100;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/png',
        1
      );
    });
  }, [completedCrop]);

  const handleSave = async () => {
    if (!completedCrop) {
      toast({
        title: 'No crop selected',
        description: 'Please select a crop area',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) throw new Error('Failed to crop image');

      const fileName = `${companyId}/logo-${mode}-${Date.now()}.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const newLogoUrl = urlData.publicUrl;

      // Update company record
      const updateField = mode === 'light' ? 'logo_url' : 'logo_url_dark';
      await supabase
        .from('companies')
        .update({ [updateField]: newLogoUrl })
        .eq('id', companyId);

      toast({
        title: 'Logo saved',
        description: `Your ${mode} mode logo has been cropped and saved`,
      });

      onComplete(newLogoUrl);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Crop/upload error:', error);
      toast({
        title: 'Failed to save logo',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setScale(1);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect || 4));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Crop {mode === 'light' ? 'Light' : 'Dark'} Mode Logo
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area to fit the recommended 4:1 aspect ratio (200×50px)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium w-16">Zoom</Label>
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[scale]}
              onValueChange={(values) => setScale(values[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Crop Area */}
          <div className="border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center min-h-[300px]">
            {imageSrc ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  style={{ transform: `scale(${scale})` }}
                  onLoad={onImageLoad}
                  className="max-w-full transition-transform"
                />
              </ReactCrop>
            ) : (
              <div className="text-muted-foreground">Loading image...</div>
            )}
          </div>

          {/* Aspect Ratio Options */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Aspect Ratio:</Label>
            <div className="flex gap-2">
              <Button
                variant={aspect === 4 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setAspect(4)}
              >
                4:1 (Recommended)
              </Button>
              <Button
                variant={aspect === 3 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setAspect(3)}
              >
                3:1
              </Button>
              <Button
                variant={aspect === undefined ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setAspect(undefined)}
              >
                Free
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={uploading || !completedCrop}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Cropped Logo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
