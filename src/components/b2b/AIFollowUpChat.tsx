import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, Loader2, MessageSquare, User, Sparkles } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  evaluateFollowUpQuestion,
  type FollowUpMessage,
} from '@/lib/followUpQuestionGuard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIFollowUpChatProps {
  contextType: 'candidate-fit' | 'team-insights';
  contextData: Record<string, unknown>;
  initialContext: string;
  onSendMessage: (messages: Message[], newQuestion: string) => Promise<string>;
}

export default function AIFollowUpChat({
  contextType,
  contextData,
  initialContext,
  onSendMessage,
}: AIFollowUpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const markdownComponents: Components = {
    h1: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    h2: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    h3: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    h4: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    h5: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    h6: ({ children }) => <p className="mb-2 text-sm font-semibold leading-6">{children}</p>,
    p: ({ children }) => <p className="mb-2 text-sm leading-6 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-sm leading-6">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-sm leading-6">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-border/80 pl-3 text-sm italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <div className="my-3 border-t border-border/70" />,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const messageHistory: FollowUpMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const questionEvaluation = evaluateFollowUpQuestion({
      contextType,
      question: userMessage,
      contextData: { contextData, initialContext },
      messages: messageHistory,
    });
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    if (!questionEvaluation.allowed) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            questionEvaluation.responseMessage ||
            "We aren't able to answer that question here. Please contact support@rolecolorfinder.com.",
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const response = await onSendMessage(messages, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your question. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = contextType === 'candidate-fit' 
    ? [
        "What interview questions should I ask?",
        "How would they work with the team?",
        "What are the red flags to watch for?",
      ]
    : [
        "How can we improve team collaboration?",
        "What roles are we missing?",
        "How should we handle conflicts?",
      ];

  return (
    <Card className="border-t mt-4">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Ask Follow-up Questions</span>
        </div>

        {messages.length === 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setInput(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <ScrollArea className="h-48 mb-3 pr-4" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="max-w-none break-words">
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
}
