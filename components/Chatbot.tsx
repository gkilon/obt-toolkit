import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

interface ChatbotProps {
    history: ChatMessage[];
    onNewMessage: (message: string) => void;
    isBotTyping: boolean;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);


const Chatbot: React.FC<ChatbotProps> = ({ history, onNewMessage, isBotTyping, isExpanded, setIsExpanded }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Only scroll if the chat is expanded on mobile, or always on desktop
        if (isExpanded || window.innerWidth >= 1024) {
            scrollToBottom();
        }
    }, [history, isBotTyping, isExpanded]);
    
    // Auto-expand chat on new AI message on mobile
    useEffect(() => {
        if (history.length > 0 && history[history.length - 1].sender === 'ai' && window.innerWidth < 1024) {
            setIsExpanded(true);
        }
    }, [history, setIsExpanded]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isBotTyping) {
            onNewMessage(input);
            setInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          if (scrollHeight < 120) { // Max height for textarea
             textarea.style.height = `${scrollHeight}px`;
          } else {
             textarea.style.height = '120px';
          }
        }
    }, [input]);

    const mobileHeight = isExpanded ? 'h-[70vh]' : 'h-[135px]';

    return (
        <div className={`
            bg-white shadow-lg border-slate-200/80 flex flex-col
            lg:rounded-2xl lg:border lg:h-full lg:sticky lg:top-24
            fixed bottom-0 left-0 right-0 z-20 border-t
            transition-all duration-300 ease-in-out ${mobileHeight}
        `}>
            <button 
                type="button"
                className="p-4 border-b border-slate-200 flex-shrink-0 cursor-pointer lg:cursor-default"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6c0 1.887 1.12 3.535 2.756 4.332l-1.01 1.01A1 1 0 006.414 15H7a1 1 0 001-1v-1.086a1 1 0 00-.293-.707l-1.054-1.054A4 4 0 016 8a4 4 0 014-4V2z" />
                            <path d="M14 6a1 1 0 011 1v1.086a1 1 0 01.293.707l1.054 1.054A4 4 0 0014 8a4 4 0 00-4 4v2a6 6 0 016-6z" />
                        </svg>
                        OBT Expert
                    </div>
                    <svg className={`w-6 h-6 shrink-0 transition-transform duration-300 lg:hidden ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                </h3>
            </button>

            <div className={`flex-grow p-4 overflow-y-auto transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                <div className="space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3.5 ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`}>
                               <div className="prose prose-sm max-w-none text-white prose-headings:text-white prose-strong:text-white">
                                 <ReactMarkdown components={{ p: React.Fragment }}>{msg.text}</ReactMarkdown>
                               </div>
                            </div>
                        </div>
                    ))}
                    {isBotTyping && (
                        <div className="flex justify-start">
                             <div className="bg-slate-200 rounded-2xl rounded-bl-lg">
                                <TypingIndicator />
                             </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 flex-shrink-0 flex items-start gap-2 bg-white">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="כתוב/י כאן..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none text-slate-900 bg-slate-50 max-h-32"
                    rows={1}
                    disabled={isBotTyping}
                    onFocus={() => { if(window.innerWidth < 1024) setIsExpanded(true) }}
                />
                <button type="submit" disabled={isBotTyping || !input.trim()} className="bg-blue-600 text-white rounded-xl p-3 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chatbot;