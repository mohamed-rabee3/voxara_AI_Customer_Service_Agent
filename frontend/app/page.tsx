"use client";

import { motion } from "framer-motion";
import { VoiceAgent } from "@/components/voice-agent";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Home Page
 * 
 * Main page for the Voara Voice Agent application.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none gradient-text">
                Voara AI
              </h1>
              <p className="text-xs text-muted-foreground">
                Voice Assistant
              </p>
            </div>
          </motion.div>

          {/* Right Side - Theme Toggle */}
          <div className="flex items-center justify-end ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container py-8 px-4 mx-auto">
        <VoiceAgent participantName="User" className="min-h-[calc(100vh-8rem)]" />
      </div>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <span className="font-medium">Gemini Live API</span>,{" "}
            <span className="font-medium">LiveKit</span>, and{" "}
            <span className="font-medium">RAG</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
