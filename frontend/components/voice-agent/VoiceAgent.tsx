"use client";

import * as React from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useConnectionState,
    useRoomContext,
    useLocalParticipant,
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
    const [error, setError] = React.useState<string | null>(null);
    const [isConnecting, setIsConnecting] = React.useState(false);

    const handleConnect = React.useCallback(async () => {
        setError(null);
        setIsConnecting(true);

        try {
            const newRoomName = generateRoomName();
            setRoomName(newRoomName);

            const response = await fetchToken({
                room_name: newRoomName,
                participant_name: participantName,
            });

            setToken(response.token);
            setLiveKitUrl(response.livekit_url);
        } catch (err) {
            console.error("Failed to connect:", err);
            setError(err instanceof Error ? err.message : "Failed to connect");
        } finally {
            setIsConnecting(false);
        }
    }, [participantName]);

    const handleDisconnect = React.useCallback(() => {
        setToken(null);
        setLiveKitUrl(null);
        setRoomName("");
    }, []);

    // If no token, show initial state
    if (!token || !liveKitUrl) {
        return (
            <div className={cn("flex flex-col items-center justify-center h-full", className)}>
                <MagicSphere state="idle" size="xl" />

                <div className="mt-8 text-center">
                    <h2 className="text-2xl font-bold gradient-text mb-2">
                        Voara AI Assistant
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        Your AI-powered voice assistant. Click below to start a conversation.
                    </p>
                </div>

                <ControlButtons
                    connectionState={isConnecting ? "connecting" : "disconnected"}
                    isMuted={false}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onToggleMute={() => { }}
                />

                {error && (
                    <Alert variant="destructive" className="mt-6 max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={liveKitUrl}
            token={token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => handleDisconnect()}
            className={cn("h-full", className)}
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

    // Listen for room events
    React.useEffect(() => {
        if (!room) return;

        const handleParticipantMetadataChanged = () => {
            // Parse metadata from agent participant for RAG context
            const agentParticipant = Array.from(room.remoteParticipants.values())
                .find(p => p.identity.includes("agent"));

            if (agentParticipant?.metadata) {
                try {
                    const data = JSON.parse(agentParticipant.metadata);
                    if (data.rag_context) {
                        setRagContext({
                            query: data.rag_query || "",
                            context: data.rag_context,
                            timestamp: new Date(),
                        });
                    }
                    if (data.agent_state) {
                        setAgentState(data.agent_state as AgentState);
                    }
                } catch (e) {
                    console.warn("Failed to parse agent metadata:", e);
                }
            }
        };

        room.on("participantMetadataChanged", handleParticipantMetadataChanged);

        return () => {
            room.off("participantMetadataChanged", handleParticipantMetadataChanged);
        };
    }, [room]);

    // Simulate agent state based on audio activity
    React.useEffect(() => {
        // This is a simplified state detection
        // In production, this would come from the agent's metadata
        const updateInterval = setInterval(() => {
            // Check if local participant is speaking (user input)
            if (localParticipant?.isSpeaking) {
                setAgentState("listening");
            }
        }, 100);

        return () => clearInterval(updateInterval);
    }, [localParticipant]);

    // Demo message addition (in production, from transcription events)
    const addMessage = React.useCallback((role: "user" | "agent", text: string) => {
        const newMessage: TranscriptMessage = {
            id: crypto.randomUUID(),
            role,
            text,
            timestamp: new Date(),
            isFinal: true,
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    // Add welcome message when connected
    React.useEffect(() => {
        if (mappedConnectionState === "connected" && messages.length === 0) {
            // Add initial agent greeting after a short delay
            setTimeout(() => {
                addMessage("agent", "Hello! I'm Voara AI, your voice assistant. How can I help you today?");
                setAgentState("idle");
            }, 1500);
        }
    }, [mappedConnectionState, messages.length, addMessage]);

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

                <ContextPanel context={ragContext} defaultExpanded={false} />
            </div>
        </div>
    );
}
