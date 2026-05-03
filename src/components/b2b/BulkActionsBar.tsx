// @ts-nocheck
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Bell, Trash2, UserCheck, RefreshCw, Download } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onSendReminder?: () => void;
  onResendInvite?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onBulkCategoryChange?: () => void;
  isLoading?: boolean;
  type?: 'users' | 'candidates';
}

export default function BulkActionsBar({
  selectedCount,
  onClear,
  onSendReminder,
  onResendInvite,
  onExport,
  onDelete,
  onBulkCategoryChange,
  isLoading = false,
  type = 'users',
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-background border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} selected
        </Badge>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          {onSendReminder && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onSendReminder}
              disabled={isLoading}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          )}
          
          {onResendInvite && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onResendInvite}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Invite
            </Button>
          )}
          
          {onBulkCategoryChange && type === 'users' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onBulkCategoryChange}
              disabled={isLoading}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Change Category
            </Button>
          )}
          
          {onExport && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          {onDelete && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onClear}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
