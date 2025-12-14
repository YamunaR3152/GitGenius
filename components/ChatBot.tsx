import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { RepoMetadata, GeminiAnalysis } from '../types';
import { initializeChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

interface ChatBotProps {
  repo: RepoMetadata;
  analysis: GeminiAnalysis;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ repo, analysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (repo && analysis && !chatSessionRef.current) {
      chatSessionRef.current = initializeChatSession(repo, analysis);
      // Initial greeting
      setMessages([
        { 
          role: 'model', 
          text: `Hi! I'm your AI Mentor for **${repo.name}**. I've analyzed your code and I'm ready to help you improve it. Ask me about your scores or roadmap!` 
        }
      ]);
    }
  }, [repo, analysis]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatSessionRef.current) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMessage });
      const responseText = response.text || "I'm having trouble thinking right now. Please try again.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render simple text with basic formatting
  const renderMessageText = (text: string) => {
    // Basic bold handling for **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-primary to-accent text-white rounded-full shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group animate-fade-in-up"
        aria-label="Open AI Mentor"
      >
        <div className="relative">
            <Sparkles className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
            </span>
        </div>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat with AI Mentor
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden ${isMinimized ? 'w-72 h-16' : 'w-80 md:w-96 h-[500px] max-h-[80vh]'}`}>
      
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 flex items-center justify-between shrink-0 cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
                <h3 className="text-white font-bold text-sm">AI Mentor</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      {!isMinimized && (
        <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>
                        <div className={`rounded-2xl p-3 text-sm max-w-[80%] whitespace-pre-wrap ${
                            msg.role === 'user' 
                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-600 rounded-tr-none' 
                                : 'bg-primary text-white shadow-md rounded-tl-none'
                        }`}>
                            {renderMessageText(msg.text)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-tl-none p-4 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about your score..."
                        className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !inputValue.trim()}
                        className="p-1.5 bg-primary text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-2">
                    AI can make mistakes. Review generated code.
                </div>
            </form>
        </>
      )}
    </div>
  );
};

export default ChatBot;