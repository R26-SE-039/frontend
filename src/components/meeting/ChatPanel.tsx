import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Trash2, Users } from 'lucide-react';
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
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <MessageSquare size={16} />
                    </div>
                    <div className="text-left">
                        <h2 className="font-bold text-gray-900 text-sm">Meeting Chat</h2>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Users size={10} /> {participantCount} participant{participantCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {chatMessages.length > 0 && (
                        <button 
                            onClick={clearChat}
                            title="Clear Chat History"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                            <MessageSquare size={22} />
                        </div>
                        <h3 className="text-xs font-bold text-gray-800 mb-1">In-Meeting Chat</h3>
                        <p className="text-xs font-normal text-gray-500 max-w-[200px] leading-relaxed">
                            Send messages to everyone present in this meeting.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {chatMessages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col gap-1 ${msg.isMe ? 'items-end' : 'items-start'}`}
                            >
                                {/* Sender name + timestamp */}
                                {!msg.isMe && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[11px] font-bold text-gray-900">{msg.sender}</span>
                                        <span className="text-[9px] font-medium text-gray-400">{msg.timestamp}</span>
                                    </div>
                                )}

                                <div className="flex items-end gap-2">
                                    {/* Avatar for others */}
                                    {!msg.isMe && (
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {msg.sender.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Speech Bubble */}
                                    <div className={`max-w-[240px] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words font-medium ${
                                        msg.isMe 
                                            ? 'bg-blue-600 text-white rounded-br-xs shadow-xs' 
                                            : 'bg-white text-gray-800 border border-gray-200/70 rounded-bl-xs shadow-xs'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>

                                {msg.isMe && (
                                    <span className="text-[9px] font-medium text-gray-400 px-1">{msg.timestamp}</span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        maxLength={500}
                        className="flex-grow bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none py-1 min-w-0 font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs shrink-0 active:scale-95"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
