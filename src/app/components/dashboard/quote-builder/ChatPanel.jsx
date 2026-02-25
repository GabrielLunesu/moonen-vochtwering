'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Bot, User, Send, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function ToolCallResult({ toolName, result }) {
  if (!result) return null;

  // Display confirmations for tool calls
  switch (result.action) {
    case 'add_lines':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-green-600 font-medium">✓</span>{' '}
          {result.treatment_label || 'Regels'} — {result.lines?.length || 0} regel(s) toegevoegd
          {result.total > 0 && ` (€${result.total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })})`}
        </div>
      );

    case 'update_line':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-blue-600 font-medium">✎</span>{' '}
          Regel {(result.line_index || 0) + 1} bijgewerkt naar {result.new_quantity}
        </div>
      );

    case 'remove_line':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-red-600 font-medium">✕</span>{' '}
          Regel {(result.line_index || 0) + 1} verwijderd
        </div>
      );

    case 'set_customer':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-green-600 font-medium">✓</span>{' '}
          Klantgegevens bijgewerkt
          {result.customer?.name && `: ${result.customer.name}`}
        </div>
      );

    case 'set_discount':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-green-600 font-medium">✓</span>{' '}
          Korting ingesteld: {result.discount?.type === 'percentage' ? `${result.discount.value}%` : `€${result.discount.value}`}
        </div>
      );

    case 'set_quote_details':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-green-600 font-medium">✓</span>{' '}
          Offertegegevens ingesteld
          {result.oplossingen?.length > 0 && ` — ${result.oplossingen.join(', ')}`}
        </div>
      );

    case 'area_calculated':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-blue-600 font-medium">📐</span>{' '}
          {result.wall_area && `Muuroppervlak: ${result.wall_area} m²`}
          {result.wall_area && result.floor_area && ' | '}
          {result.floor_area && `Vloeroppervlak: ${result.floor_area} m²`}
        </div>
      );

    case 'suggestions':
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 my-1">
          <span className="text-blue-600 font-medium">💡</span>{' '}
          {result.treatments?.length || 0} suggestie(s) voor &ldquo;{result.problem}&rdquo;
        </div>
      );

    case 'error':
      return (
        <div className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2 my-1">
          ⚠️ {result.message}
        </div>
      );

    default:
      return null;
  }
}

export default function ChatPanel({ messages, input, handleInputChange, handleSubmit, isLoading, stop }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Bot className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-base font-medium">Offerte-assistent</p>
              <p className="text-sm max-w-xs">
                Beschrijf de situatie en ik stel de offerte samen. Bijv. &ldquo;kelder 4x5, 2.5m hoog, doorslag op de muren&rdquo;
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          // Skip tool messages — their results are shown inline
          if (message.role === 'tool') return null;

          return (
            <div key={message.id}>
              <div className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div
                    className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: '#355b23' }}
                  >
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <Card className={`max-w-[85%] ${message.role === 'user' ? 'bg-muted' : ''}`}>
                  <CardContent className="p-2.5">
                    {/* Tool invocations shown as inline results */}
                    {message.parts?.map((part, i) => {
                      // AI SDK v3: tool parts have type "tool-{toolName}"
                      if (part.type?.startsWith('tool-') && part.toolCallId) {
                        const toolName = part.type.replace('tool-', '');
                        return (
                          <ToolCallResult
                            key={i}
                            toolName={toolName}
                            result={part.output}
                          />
                        );
                      }
                      if (part.type === 'text' && part.text) {
                        return (
                          <div key={i} className="text-sm prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2">
                            <ReactMarkdown>{part.text}</ReactMarkdown>
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Fallback for messages without parts (e.g. user messages) */}
                    {!message.parts && message.content && (
                      message.role === 'assistant' ? (
                        <div className="text-sm prose prose-sm prose-neutral max-w-none prose-p:my-1">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )
                    )}

                    {/* Streaming indicator */}
                    {message.role === 'assistant' && isLoading && message.id === messages[messages.length - 1]?.id && !message.content && !message.parts?.some((p) => p.type === 'text' && p.text) && (
                      <div className="flex gap-1 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </CardContent>
                </Card>
                {message.role === 'user' && (
                  <div className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input || ''}
            onChange={handleInputChange}
            placeholder="Beschrijf de situatie..."
            disabled={isLoading}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon" onClick={stop} className="shrink-0">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input?.trim()} className="shrink-0" style={{ backgroundColor: '#355b23' }}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
