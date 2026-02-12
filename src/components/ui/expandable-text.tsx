import { useState } from 'react';
import { Button } from './button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxWords?: number;
  className?: string;
}

/**
 * Truncates text to a maximum word count with expand/collapse toggle.
 * Default: 80 words when collapsed (per spec).
 */
export function ExpandableText({ 
  text, 
  maxWords = 80, 
  className = '' 
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const words = text.split(/\s+/);
  const needsTruncation = words.length > maxWords;
  
  const displayText = isExpanded || !needsTruncation 
    ? text 
    : words.slice(0, maxWords).join(' ') + '...';

  if (!needsTruncation) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className="space-y-2">
      <p className={className}>{displayText}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Expand ({words.length - maxWords} more words)
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Truncates text for overview sections (max 120 words per spec).
 */
export function ExpandableOverview({ text, className = '' }: Omit<ExpandableTextProps, 'maxWords'>) {
  return <ExpandableText text={text} maxWords={120} className={className} />;
}
