'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
  // Split text into lines for processing
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let elementKey = 0; // Unique key counter for elements

  const processInlineMarkdown = (line: string): React.ReactNode => {
    // Process inline markdown: bold, italic, code
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text** or __text__
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      // Italic: *text* or _text_
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/);
      // Inline code: `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      const matches = [
        { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
        { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
        { type: 'code', match: codeMatch, index: codeMatch?.index ?? Infinity },
      ].filter(m => m.match).sort((a, b) => a.index - b.index);

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const firstMatch = matches[0];
      const matchObj = firstMatch.match!;
      const matchIndex = firstMatch.index;

      // Add text before the match
      if (matchIndex > 0) {
        parts.push(remaining.slice(0, matchIndex));
      }

      // Add the formatted element
      const content = matchObj[1] || matchObj[2];
      switch (firstMatch.type) {
        case 'bold':
          parts.push(<strong key={key++} className="font-bold text-white">{content}</strong>);
          break;
        case 'italic':
          parts.push(<em key={key++} className="italic">{content}</em>);
          break;
        case 'code':
          parts.push(<code key={key++} className="bg-gray-700 px-1.5 py-0.5 rounded text-emerald-400 text-xs font-mono">{content}</code>);
          break;
      }

      remaining = remaining.slice(matchIndex + matchObj[0].length);
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      const listKey = `list-${elementKey++}`;
      elements.push(
        <ListTag key={listKey} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} list-inside space-y-1 my-2`}>
          {listItems.map((item, i) => (
            <li key={`${listKey}-item-${i}`} className="text-gray-200">{processInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line) => {
    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={`h4-${elementKey++}`} className="font-bold text-white text-sm mt-3 mb-1">{processInlineMarkdown(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={`h3-${elementKey++}`} className="font-bold text-white text-base mt-3 mb-1">{processInlineMarkdown(line.slice(3))}</h3>);
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={`h2-${elementKey++}`} className="font-bold text-white text-lg mt-3 mb-1">{processInlineMarkdown(line.slice(2))}</h2>);
    }
    // Unordered list items
    else if (line.match(/^[\*\-]\s+/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.replace(/^[\*\-]\s+/, ''));
    }
    // Ordered list items
    else if (line.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\.\s+/, ''));
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
      elements.push(<div key={`empty-${elementKey++}`} className="h-2" />);
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(<p key={`p-${elementKey++}`} className="text-gray-200">{processInlineMarkdown(line)}</p>);
    }
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m Trade Ledger Pro AI, your intelligent trading assistant. I can help you analyze your trading performance, fetch trade details for specific dates or months, provide insights from your analytics, goals, learning center, and notifications. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30'
        }`}
        title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 sm:max-w-[calc(100vw-3rem)] h-[60vh] sm:h-[500px] max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gray-800/80 backdrop-blur-xl px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xs sm:text-sm">Trade Ledger Pro AI</h3>
                <p className="text-[10px] sm:text-xs text-gray-400">Your trading assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] sm:text-xs text-gray-400">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-gray-800 text-gray-200 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm">
                    {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
                  </div>
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-emerald-200' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {speechSupported && (
                <button
                  onClick={handleToggleListening}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Ask about your trades...'}
                className="flex-1 bg-gray-800 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm placeholder-gray-500 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                disabled={isLoading || isListening}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 sm:p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                title="Send message"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
