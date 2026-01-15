"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RAGContext } from "@/lib/livekit";

interface ContextPanelProps {
    context: RAGContext | null;
    className?: string;
    defaultExpanded?: boolean;
}

/**
 * ContextPanel Component
 * 
 * Displays the RAG context retrieved from the knowledge base.
 * Collapsible panel with source information and auto-scroll.
 */
export function ContextPanel({
    context,
    className,
    defaultExpanded = true  // Default to expanded so user can see context
}: ContextPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-expand and scroll when new context arrives
    React.useEffect(() => {
        if (context) {
            setIsExpanded(true);
            // Scroll to bottom after a small delay to let animation complete
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 250);
        }
    }, [context]);

    return (
        <Card className={cn("glass bg-background/50 border", className)}>
            <CardHeader className="py-3 px-4 bg-muted/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        📚 Knowledge Context
                        {context && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-green-500/20 text-green-600">
                                Active
                            </Badge>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 p-0"
                        aria-label={isExpanded ? "Collapse context" : "Expand context"}
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CardContent className="pt-0 pb-4">
                            {context ? (
                                <div className="space-y-3">
                                    {/* Query Badge */}
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <Search className="h-3 w-3" />
                                            Query
                                        </Badge>
                                        <span className="text-xs text-muted-foreground truncate flex-1">
                                            {context.query}
                                        </span>
                                    </div>


                                    {/* Context Content with visible scrollbar */}
                                    <div
                                        ref={scrollRef}
                                        className="max-h-48 overflow-y-auto bg-muted/50 rounded-lg p-3 custom-scrollbar"
                                    >
                                        <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                            {context.context}
                                        </p>
                                    </div>

                                    {/* Timestamp */}
                                    <p className="text-xs text-muted-foreground text-right">
                                        Retrieved at {context.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Ask a question about Voara AI to see retrieved knowledge here.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
