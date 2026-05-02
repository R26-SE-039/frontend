import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Layout, Trash2, Users } from 'lucide-react';
import { ChatMessage } from '../../store/useMeetingStore';

interface ChatPanelProps {
    chatMessages: ChatMessage[];
    sendChat: (text: string) => void;
    clearChat: () => void;
    onClose: () => void;
    participantCount: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
    chatMessages, sendChat, clearChat, onClose, participantCount 
}) => {
    const [inputText, setInputText] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Focus input on open
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendChat(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <MessageSquare size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Meeting Chat</h2>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Users size={9} /> {participantCount} participant{participantCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {chatMessages.length > 0 && (
                        <button 
                            onClick={clearChat}
                            title="Clear chat"
                            className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                        <Layout size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center gap-4 py-12"
                    >
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <MessageSquare size={28} className="text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400">No messages yet</p>
                            <p className="text-xs text-gray-300 mt-1">Be the first to say something!</p>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence initial={false}>
                        {chatMessages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className={`flex flex-col gap-1 ${msg.isMe ? 'items-end' : 'items-start'}`}
                            >
                                {/* Sender name + timestamp */}
                                {!msg.isMe && (
                                    <p className="text-[10px] font-bold text-gray-400 px-1">{msg.sender}</p>
                                )}

                                <div className="flex items-end gap-2">
                                    {/* Avatar for others */}
                                    {!msg.isMe && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-blue-800">
                                            {msg.sender.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={`max-w-[230px] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                        msg.isMe 
                                            ? 'bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20' 
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <p className={`text-[9px] text-gray-300 px-1 font-medium ${msg.isMe ? 'text-right' : ''}`}>
                                    {msg.timestamp}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-300 focus-within:bg-white transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message…"
                        maxLength={500}
                        className="flex-grow bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none py-1 min-w-0"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-blue-500/30 flex-shrink-0"
                    >
                        <Send size={15} />
                    </button>
                </div>
                <p className="text-[9px] text-gray-300 text-center mt-2 font-medium">Enter to send · Shift+Enter for newline</p>
            </div>
        </div>
    );
};
