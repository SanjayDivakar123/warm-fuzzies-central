import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThemeSettings {
  version: string;
  exportedAt: string;
  branding: {
    logo_url: string | null;
    logo_url_dark: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  };
}

interface ThemeExportImportProps {
  company: any;
  logoUrl: string;
  logoUrlDark: string;
  primaryColor: string;
  secondaryColor: string;
  onImport: (settings: {
    logoUrl: string;
    logoUrlDark: string;
    primaryColor: string;
    secondaryColor: string;
  }) => void;
  onSettingsSaved?: () => void;
}

export default function ThemeExportImport({
  company,
  logoUrl,
  logoUrlDark,
  primaryColor,
  secondaryColor,
  onImport,
  onSettingsSaved,
}: ThemeExportImportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateExportData = (): ThemeSettings => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      branding: {
        logo_url: logoUrl || null,
        logo_url_dark: logoUrlDark || null,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
      },
    };
  };

  const handleExport = () => {
    const data = generateExportData();
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create and download file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.subdomain}-theme-settings.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Theme exported',
      description: 'Your branding settings have been downloaded',
    });
  };

  const handleCopyToClipboard = async () => {
    const data = generateExportData();
    const jsonString = JSON.stringify(data, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied to clipboard',
        description: 'Theme settings JSON copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const validateImportData = (data: any): data is ThemeSettings => {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.branding) return false;
    if (typeof data.branding !== 'object') return false;
    return true;
  };

  const handleImport = async () => {
    setImportError(null);
    
    try {
      const parsed = JSON.parse(importData);
      
      if (!validateImportData(parsed)) {
        setImportError('Invalid theme settings format. Please check the JSON structure.');
        return;
      }

      setImporting(true);

      const { branding } = parsed;

      // Update local state
      onImport({
        logoUrl: branding.logo_url || '',
        logoUrlDark: branding.logo_url_dark || '',
        primaryColor: branding.primary_color || '#000000',
        secondaryColor: branding.secondary_color || '#666666',
      });

      // Save to database
      const { error } = await supabase
        .from('companies')
        .update({
          logo_url: branding.logo_url,
          logo_url_dark: branding.logo_url_dark,
          primary_color: branding.primary_color,
          secondary_color: branding.secondary_color,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Theme imported',
        description: 'Branding settings have been applied',
      });

      setImportDialogOpen(false);
      setImportData('');
      
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setImportError('Invalid JSON format. Please check your input.');
      } else {
        setImportError(error.message || 'Failed to import theme settings');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setImportError(null);
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <FileJson className="h-5 w-5" />
            Theme Transfer
          </CardTitle>
          <CardDescription>
            Export your branding settings to use in another company portal, or import settings from another portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Theme
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy as JSON'}
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Import Theme Settings</DialogTitle>
            <DialogDescription>
              Paste the theme JSON or upload a theme file to apply branding settings from another portal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto min-h-0 flex-1 pr-1">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON File
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Theme JSON</Label>
              <Textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setImportError(null);
                }}
                placeholder='{"version": "1.0", "branding": {...}}'
                className="font-mono text-sm min-h-[150px]"
              />
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {importData && !importError && (
              <Alert>
                <AlertDescription>
                  This will overwrite your current logo URLs and brand colors. Make sure to save any current settings first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importData || importing}>
              {importing ? 'Importing...' : 'Apply Theme'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
