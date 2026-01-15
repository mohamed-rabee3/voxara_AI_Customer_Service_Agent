"use client";

import * as React from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useConnectionState,
    useRoomContext,
    useLocalParticipant,
    useTranscriptions,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { motion } from "framer-motion";
import { AlertCircle, WifiOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { MagicSphere } from "./MagicSphere";
import { ControlButtons } from "./ControlButtons";
import { TranscriptPanel } from "./TranscriptPanel";
import { ContextPanel } from "./ContextPanel";

import {
    fetchToken,
    generateRoomName,
    type AgentState,
    type TranscriptMessage,
    type RAGContext,
} from "@/lib/livekit";
import { cn } from "@/lib/utils";

interface VoiceAgentProps {
    participantName?: string;
    className?: string;
}

/**
 * VoiceAgent Component
 * 
 * Main container for the voice agent UI.
 * Handles LiveKit room connection and state management.
 */
export function VoiceAgent({
    participantName = "User",
    className
}: VoiceAgentProps) {
    const [token, setToken] = React.useState<string | null>(null);
    const [liveKitUrl, setLiveKitUrl] = React.useState<string | null>(null);
    const [roomName, setRoomName] = React.useState<string>("");
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Handle connection
    const handleConnect = React.useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const newRoomName = generateRoomName();
            setRoomName(newRoomName);

            const { token: newToken, livekit_url } = await fetchToken({
                room_name: newRoomName,
                participant_name: participantName
            });

            setToken(newToken);
            setLiveKitUrl(livekit_url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect");
            setToken(null);
            setLiveKitUrl(null);
        } finally {
            setIsConnecting(false);
        }
    }, [participantName]);

    // Handle disconnection
    const handleDisconnect = React.useCallback(() => {
        setToken(null);
        setLiveKitUrl(null);
        setRoomName("");
    }, []);

    // Not connected - show Start Conversation button
    if (!token || !liveKitUrl) {
        return (
            <div className={cn("flex flex-col items-center justify-center h-full w-full", className)}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <div className="flex justify-center w-full">
                        <MagicSphere state="idle" size="lg" />
                    </div>
                    <p className="mt-6 text-muted-foreground">
                        {isConnecting ? "Connecting to voice agent..." : "Ready to start"}
                    </p>
                    {!isConnecting && (
                        <div className="flex justify-center w-full mt-4">
                            <button
                                onClick={handleConnect}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
                            >
                                Start Conversation
                            </button>
                        </div>
                    )}
                    {error && (
                        <div className="flex justify-center w-full mt-4">
                            <Alert variant="destructive" className="max-w-md">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Connection Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={liveKitUrl}
            connect={true}
            audio={true}
            video={false}
            className={cn("h-full", className)}
            onDisconnected={handleDisconnect}
        >
            <RoomContent
                onDisconnect={handleDisconnect}
                roomName={roomName}
            />
        </LiveKitRoom>
    );
}

interface RoomContentProps {
    onDisconnect: () => void;
    roomName: string;
}

/**
 * RoomContent Component
 * 
 * Content rendered inside the LiveKitRoom context.
 * Manages agent state and transcripts.
 */
function RoomContent({ onDisconnect, roomName }: RoomContentProps) {
    const room = useRoomContext();
    const connectionState = useConnectionState(room);
    const { localParticipant } = useLocalParticipant();

    // Get real transcriptions from LiveKit
    const transcriptions = useTranscriptions();

    const [agentState, setAgentState] = React.useState<AgentState>("idle");
    const [messages, setMessages] = React.useState<TranscriptMessage[]>([]);
    const [ragContext, setRagContext] = React.useState<RAGContext | null>(null);
    const [isMuted, setIsMuted] = React.useState(false);

    // Map LiveKit connection state to our type
    const mappedConnectionState = React.useMemo(() => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return "connected" as const;
            case ConnectionState.Connecting:
            case ConnectionState.Reconnecting:
                return "connecting" as const;
            case ConnectionState.Disconnected:
                return "disconnected" as const;
            default:
                return "disconnected" as const;
        }
    }, [connectionState]);

    // Handle mute toggle
    const handleToggleMute = React.useCallback(async () => {
        if (localParticipant) {
            const newMuted = !isMuted;
            await localParticipant.setMicrophoneEnabled(!newMuted);
            setIsMuted(newMuted);
        }
    }, [localParticipant, isMuted]);

    // Keep track of exact texts we've already shown to avoid duplicates
    const shownTexts = React.useRef<Set<string>>(new Set());
    const messageCounter = React.useRef(0);

    // Process transcriptions - track by exact text to avoid duplicates
    React.useEffect(() => {
        if (!transcriptions || transcriptions.length === 0) return;

        // Process each transcription stream
        transcriptions.forEach((stream) => {
            const participantId = stream.participantInfo?.identity || 'agent';
            const text = (stream.text || "").trim();

            // Skip empty or very short texts
            if (!text || text.length < 3) return;

            // Check if we've already shown this exact text
            if (shownTexts.current.has(text)) return;

            // Add to shown texts
            shownTexts.current.add(text);

            // Determine if this is from user or agent
            const isAgent = participantId.toLowerCase().includes("agent") ||
                participantId.toLowerCase().includes("voara") ||
                !participantId.toLowerCase().includes("user");

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                
                // Extra check: don't add if last message has same text
                if (lastMsg && lastMsg.text === text) {
                    return prev;
                }

                // Don't add if this text is a substring of the last message (streaming update)
                if (lastMsg && lastMsg.role === (isAgent ? "agent" : "user") && lastMsg.text.includes(text)) {
                    return prev;
                }

                // Don't add if last message is a substring of this (this is an update, replace it)
                // CRITICAL FIX: Preserve the existing message ID to prevent flickering
                if (lastMsg && lastMsg.role === (isAgent ? "agent" : "user") && text.includes(lastMsg.text)) {
                    const updatedMessage: TranscriptMessage = {
                        ...lastMsg,  // Preserve ID and other properties
                        text,        // Update text
                        timestamp: new Date(),  // Update timestamp
                    };
                    return [...prev.slice(0, -1), updatedMessage];
                }

                // Create new message only when adding (not replacing)
                messageCounter.current += 1;
                const newMessage: TranscriptMessage = {
                    id: `msg-${messageCounter.current}-${Date.now()}`,
                    role: isAgent ? "agent" : "user",
                    text,
                    timestamp: new Date(),
                    isFinal: true,
                };

                return [...prev, newMessage];
            });

            setAgentState(isAgent ? "speaking" : "listening");
        });
    }, [transcriptions]);

    // Track last RAG timestamp to detect new context
    const lastRagTimestamp = React.useRef<string | null>(null);

    // Poll API for RAG context every 2 seconds while connected
    React.useEffect(() => {
        if (mappedConnectionState !== "connected") return;

        const pollRagContext = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/rag/context");
                if (res.ok) {
                    const data = await res.json();
                    if (data.has_context && data.timestamp !== lastRagTimestamp.current) {
                        lastRagTimestamp.current = data.timestamp;
                        setRagContext({
                            query: data.query || "",
                            context: data.context || "",
                            timestamp: new Date(data.timestamp),
                        });
                    }
                }
            } catch (err) {
                // Silent fail - API might not be ready
            }
        };

        // Poll immediately and then every 2 seconds
        pollRagContext();
        const interval = setInterval(pollRagContext, 2000);

        return () => clearInterval(interval);
    }, [mappedConnectionState]);

    // Listen for room events (for RAG context from metadata - fallback)
    React.useEffect(() => {
        if (!room) return;

        const handleParticipantMetadataChanged = () => {
            // Parse metadata from agent participant for RAG context
            const agentParticipant = Array.from(room.remoteParticipants.values())
                .find(p => p.identity.includes("agent") || p.identity.includes("voara"));

            if (agentParticipant?.metadata) {
                try {
                    const metadata = JSON.parse(agentParticipant.metadata);
                    if (metadata.rag_context) {
                        setRagContext({
                            query: metadata.rag_context.query || "",
                            context: metadata.rag_context.context || "",
                            timestamp: new Date(),
                        });
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        };

        room.on("participantMetadataChanged", handleParticipantMetadataChanged);

        return () => {
            room.off("participantMetadataChanged", handleParticipantMetadataChanged);
        };
    }, [room]);

    // Update agent state based on active speakers
    React.useEffect(() => {
        if (!room) return;

        const handleActiveSpeakersChanged = () => {
            const activeSpeakers = room.activeSpeakers;

            if (activeSpeakers.length === 0) {
                setAgentState("idle");
                return;
            }

            // Check if agent is speaking
            const agentSpeaking = activeSpeakers.some(
                p => p.identity.includes("agent") || p.identity.includes("voara")
            );

            // Check if user is speaking
            const userSpeaking = activeSpeakers.some(
                p => p === localParticipant
            );

            if (agentSpeaking) {
                setAgentState("speaking");
            } else if (userSpeaking) {
                setAgentState("listening");
            } else {
                setAgentState("idle");
            }
        };

        room.on("activeSpeakersChanged", handleActiveSpeakersChanged);

        return () => {
            room.off("activeSpeakersChanged", handleActiveSpeakersChanged);
        };
    }, [room, localParticipant]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4">
            {/* Audio Renderer */}
            <RoomAudioRenderer />

            {/* Main Content - Sphere and Controls */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    {/* Connection Status */}
                    {mappedConnectionState !== "connected" && (
                        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                            <WifiOff className="h-4 w-4" />
                            <span className="text-sm">
                                {mappedConnectionState === "connecting"
                                    ? "Connecting to room..."
                                    : "Disconnected"}
                            </span>
                        </div>
                    )}

                    {/* Magic Sphere */}
                    <MagicSphere state={agentState} size="xl" />

                    {/* Room Info */}
                    <p className="text-xs text-muted-foreground mt-4 mb-8">
                        Room: {roomName}
                    </p>

                    {/* Controls */}
                    <ControlButtons
                        connectionState={mappedConnectionState}
                        isMuted={isMuted}
                        onConnect={() => { }}
                        onDisconnect={onDisconnect}
                        onToggleMute={handleToggleMute}
                    />
                </motion.div>
            </div>

            {/* Side Panel - Transcript and Context */}
            <div className="flex flex-col gap-4 h-full min-h-[400px] lg:min-h-0">
                <Card className="flex-1 overflow-hidden">
                    <TranscriptPanel messages={messages} className="h-full" />
                </Card>

                <ContextPanel context={ragContext} defaultExpanded={true} />
            </div>
        </div>
    );
}
