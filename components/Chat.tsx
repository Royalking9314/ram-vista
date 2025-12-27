
import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse } from '../services/geminiService.ts';
import { Message } from '../types.ts';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-msg',
      role: 'model',
      content: 'Hello! I am your RAM Vista project assistant. Ask me about Redis configuration, Linux memory management, or specific details from your hackathon project.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    try {
      const stream = streamChatResponse(history, userMsg.content);
      
      const botMsgId = `bot-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      let fullContent = '';
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, content: fullContent } : m
        ));
      }
    } catch (error) {
      console.error("Chat Stream Error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-doodle-surface rounded-[2rem] border border-doodle-border overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Bot className="w-32 h-32 text-doodle-blue" />
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
              msg.role === 'user' ? 'bg-doodle-blue border-doodle-blue' : 'bg-doodle-base border-doodle-border'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-doodle-purple" />}
            </div>
            <div className={`max-w-[75%] rounded-3xl px-6 py-4 shadow-sm text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-doodle-blue text-white rounded-tr-sm' 
                : 'bg-doodle-base border border-doodle-border text-doodle-text rounded-tl-sm'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-doodle-border bg-doodle-base/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-doodle-surface border border-doodle-border rounded-full px-6 py-4 text-white placeholder-doodle-muted focus:outline-none focus:border-doodle-blue focus:ring-2 focus:ring-doodle-blue/20 transition-all shadow-inner"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-doodle-purple hover:bg-doodle-accent disabled:bg-doodle-surface disabled:text-doodle-muted text-white rounded-full h-14 w-14 transition-all flex items-center justify-center shadow-lg hover:shadow-purple-500/25 active:scale-95"
          >
            {isStreaming ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;