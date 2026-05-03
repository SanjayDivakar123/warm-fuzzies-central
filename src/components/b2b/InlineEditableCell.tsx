// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableCellProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export default function InlineEditableCell({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  editable = true,
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!editable) {
    return (
      <span className={cn('text-sm', className)}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 text-sm py-0 px-2"
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          className="p-1 hover:bg-muted rounded text-green-600"
          disabled={isSaving}
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-muted rounded text-muted-foreground"
          disabled={isSaving}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'group flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 py-0.5',
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm">
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
