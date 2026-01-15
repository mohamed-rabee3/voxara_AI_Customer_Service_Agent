"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    formatTimestamp,
    getTextDirection,
    type TranscriptMessage
} from "@/lib/livekit";

interface TranscriptPanelProps {
    messages: TranscriptMessage[];
    className?: string;
}

/**
 * TranscriptPanel Component
 * 
 * Displays the conversation transcript with user and agent messages.
 * Supports RTL text for Arabic messages.
 */
export function TranscriptPanel({ messages, className }: TranscriptPanelProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={cn("flex flex-col bg-background/50 rounded-lg border", className)} style={{ height: '300px' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 flex-shrink-0">
                <h3 className="font-semibold text-sm">💬 Conversation</h3>
                <span className="text-xs text-muted-foreground">
                    {messages.length} messages
                </span>
            </div>

            {/* Scrollable conversation area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 custom-scrollbar"
            >
                <div className="space-y-4 py-4">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </AnimatePresence>

                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                            Start a conversation to see the transcript here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface MessageBubbleProps {
    message: TranscriptMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";
    const textDir = getTextDirection(message.text);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex gap-3 transcript-message",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {/* Avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">V</span>
                </div>
            )}

            {/* Message Content */}
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md",
                    !message.isFinal && "opacity-70"
                )}
                dir={textDir}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                    {!message.isFinal && (
                        <span className="ml-2 inline-block">
                            <span className="animate-pulse">●</span>
                        </span>
                    )}
                </p>
                <p
                    className={cn(
                        "text-xs mt-1 opacity-60",
                        isUser ? "text-right" : "text-left"
                    )}
                >
                    {formatTimestamp(message.timestamp)}
                </p>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">U</span>
                </div>
            )}
        </motion.div>
    );
}
