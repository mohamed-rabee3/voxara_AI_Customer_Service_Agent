"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentState } from "@/lib/livekit";

interface MagicSphereProps {
    state: AgentState;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
};

const stateGradients = {
    idle: "from-blue-500 via-violet-500 to-cyan-500",
    listening: "from-green-500 via-emerald-500 to-teal-500",
    speaking: "from-purple-500 via-pink-500 to-rose-500",
    thinking: "from-amber-500 via-orange-500 to-red-500",
};

const stateLabels = {
    idle: "Ready",
    listening: "Listening...",
    speaking: "Speaking...",
    thinking: "Thinking...",
};

/**
 * MagicSphere Component
 * 
 * An animated orb that represents the voice agent's state.
 * Uses framer-motion for smooth transitions between states.
 */
export function MagicSphere({
    state,
    size = "lg",
    className
}: MagicSphereProps) {
    return (
        <div className={cn("relative flex flex-col items-center gap-4", className)}>
            {/* Glow Effect */}
            <motion.div
                className="absolute inset-0 blur-3xl opacity-30"
                animate={{
                    scale: state === "speaking" ? [1, 1.2, 1] : 1,
                    opacity: state === "idle" ? 0.2 : 0.4,
                }}
                transition={{
                    duration: state === "speaking" ? 0.8 : 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            >
                <div
                    className={cn(
                        "w-full h-full rounded-full bg-gradient-to-br",
                        stateGradients[state]
                    )}
                />
            </motion.div>

            {/* Main Sphere */}
            <motion.div
                className={cn(
                    "relative rounded-full bg-gradient-to-br shadow-2xl",
                    sizeClasses[size],
                    stateGradients[state]
                )}
                animate={{
                    scale: state === "listening" ? [1, 1.05, 1] :
                        state === "speaking" ? [1, 1.08, 1] : 1,
                    rotate: state === "thinking" ? 360 : 0,
                }}
                transition={{
                    scale: {
                        duration: state === "speaking" ? 0.6 : 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    },
                    rotate: {
                        duration: 2,
                        repeat: state === "thinking" ? Infinity : 0,
                        ease: "linear",
                    },
                }}
                style={{
                    boxShadow: state === "speaking"
                        ? "0 0 80px rgba(236, 72, 153, 0.5), 0 0 120px rgba(168, 85, 247, 0.3)"
                        : "0 0 60px rgba(139, 92, 246, 0.4), 0 0 100px rgba(139, 92, 246, 0.2)",
                }}
            >
                {/* Inner Highlight */}
                <div
                    className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm"
                    style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                    }}
                />

                {/* Particles */}
                <AnimatePresence>
                    {state === "speaking" && (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-white/60"
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        opacity: 0,
                                        scale: 0.5,
                                    }}
                                    animate={{
                                        x: Math.cos((i * 60) * Math.PI / 180) * 80,
                                        y: Math.sin((i * 60) * Math.PI / 180) * 80,
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1, 0.5],
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeOut",
                                    }}
                                    style={{
                                        left: "50%",
                                        top: "50%",
                                        marginLeft: "-4px",
                                        marginTop: "-4px",
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* State Label */}
            <motion.p
                key={state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-muted-foreground"
            >
                {stateLabels[state]}
            </motion.p>
        </div>
    );
}
