'use client';

import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Send, Bot, User, ImagePlus, X, Square } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      resolve({
        name: file.name,
        type: file.type,
        base64,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });
}

export default function AIAssistentPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addImages = useCallback(async (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const results = await Promise.all(imageFiles.map(fileToBase64));
    setAttachments((prev) => [...prev, ...results]);
  }, []);

  const handlePaste = useCallback((e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean);
      addImages(files);
    }
  }, [addImages]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const stopStreaming = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  };

  const sendMessage = async () => {
    if (!text.trim() && attachments.length === 0) return;

    // Build the user message content for Anthropic API format
    const content = [];
    for (const a of attachments) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: a.type,
          data: a.base64,
        },
      });
    }
    if (text.trim()) {
      content.push({ type: 'text', text: text });
    }

    // Build display message for UI
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: attachments.map((a) => a.dataUrl),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setText('');
    setAttachments([]);
    setIsStreaming(true);

    // Build API messages array (full history)
    const apiMessages = newMessages.map((msg) => {
      if (msg.images?.length > 0 && msg.role === 'user') {
        const parts = [];
        for (const img of msg.images) {
          const base64 = img.split(',')[1];
          const mediaType = img.split(';')[0].split(':')[1];
          parts.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          });
        }
        if (msg.content) {
          parts.push({ type: 'text', text: msg.content });
        }
        return { role: msg.role, content: parts };
      }
      return { role: msg.role, content: msg.content };
    });

    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + parsed.text,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[CHAT_ERROR]', err);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant' && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: 'Er ging iets mis. Probeer het opnieuw.',
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold">AI Assistent</h1>
        <p className="text-sm text-muted-foreground">
          Chat met de Moonen Vochtwering AI
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Bot className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg font-medium">Hallo! Hoe kan ik helpen?</p>
              <p className="text-sm">Stel een vraag over vochtbestrijding, klanten, of het bedrijf.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#355b23' }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-muted' : ''}`}>
              <CardContent className="p-3 space-y-2">
                {message.images?.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Bijlage"
                    className="max-w-full rounded-md max-h-64 object-contain"
                  />
                ))}
                {message.content ? (
                  message.role === 'assistant' ? (
                    <div className="text-sm prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )
                ) : message.role === 'assistant' && isStreaming ? (
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {message.role === 'user' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="border-t px-4 pt-3 pb-1 shrink-0">
          <div className="flex gap-2 max-w-4xl mx-auto overflow-x-auto">
            {attachments.map((attachment, i) => (
              <div key={i} className="relative shrink-0">
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="h-16 w-16 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 shrink-0">
        <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Typ een bericht..."
            disabled={isStreaming}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
          />
          {isStreaming ? (
            <Button type="button" variant="outline" size="icon" onClick={stopStreaming}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!text.trim() && attachments.length === 0} style={{ backgroundColor: '#355b23' }}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
