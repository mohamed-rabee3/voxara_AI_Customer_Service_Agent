"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/lib/livekit";

interface ControlButtonsProps {
    connectionState: ConnectionState;
    isMuted: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    onToggleMute: () => void;
    className?: string;
}

/**
 * ControlButtons Component
 * 
 * Provides controls for starting/ending conversation and muting.
 */
export function ControlButtons({
    connectionState,
    isMuted,
    onConnect,
    onDisconnect,
    onToggleMute,
    className,
}: ControlButtonsProps) {
    const isConnected = connectionState === "connected";
    const isConnecting = connectionState === "connecting" || connectionState === "reconnecting";
    const isDisconnected = connectionState === "disconnected" || connectionState === "error";

    return (
        <div className={cn("flex items-center justify-center gap-4", className)}>
            {/* Mute Button - Only visible when connected */}
            {isConnected && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                >
                    <Button
                        variant={isMuted ? "destructive" : "secondary"}
                        size="lg"
                        onClick={onToggleMute}
                        className="rounded-full w-14 h-14"
                        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    >
                        {isMuted ? (
                            <MicOff className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </Button>
                </motion.div>
            )}

            {/* Main Action Button */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isDisconnected && (
                    <Button
                        size="lg"
                        onClick={onConnect}
                        className={cn(
                            "rounded-full h-16 px-8 text-lg font-semibold",
                            "bg-gradient-to-r from-violet-600 to-purple-600",
                            "hover:from-violet-500 hover:to-purple-500",
                            "shadow-lg shadow-purple-500/30",
                            "transition-all duration-300"
                        )}
                    >
                        <Phone className="h-5 w-5 mr-2" />
                        Start Conversation
                    </Button>
                )}

                {isConnecting && (
                    <Button
                        size="lg"
                        disabled
                        className="rounded-full h-16 px-8 text-lg font-semibold"
                    >
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                    </Button>
                )}

                {isConnected && (
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={onDisconnect}
                        className="rounded-full h-16 px-8 text-lg font-semibold shadow-lg"
                    >
                        <PhoneOff className="h-5 w-5 mr-2" />
                        End Conversation
                    </Button>
                )}
            </motion.div>
        </div>
    );
}
