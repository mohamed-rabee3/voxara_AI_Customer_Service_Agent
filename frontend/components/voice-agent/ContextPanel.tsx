"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
 * Collapsible panel with source information.
 */
export function ContextPanel({
    context,
    className,
    defaultExpanded = false
}: ContextPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <Card className={cn("glass", className)}>
            <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Context
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
                                        <Badge variant="secondary" className="text-xs">
                                            Query
                                        </Badge>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {context.query}
                                        </span>
                                    </div>

                                    {/* Context Content */}
                                    <ScrollArea className="max-h-48">
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                                {context.context}
                                            </p>
                                        </div>
                                    </ScrollArea>

                                    {/* Timestamp */}
                                    <p className="text-xs text-muted-foreground text-right">
                                        Retrieved at {context.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Knowledge context will appear here when the agent retrieves information.
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
