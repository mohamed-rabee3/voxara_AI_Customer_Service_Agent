"""
LiveKit Voice Agent Entry Point

Starts the Voara Voice Agent with Gemini Live API.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, room_io, cli
from livekit.plugins import google, silero

from .config import get_agent_settings, validate_agent_settings, VOARA_SYSTEM_INSTRUCTIONS
from .voice_agent import VoaraAgent, setup_session_events
from .tools import RAG_TOOLS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Validate settings on import
try:
    validate_agent_settings()
    logger.info("Agent settings validated successfully")
except ValueError as e:
    logger.error(f"Configuration error: {e}")
    logger.error("Please set required environment variables in .env file")


# Create agent server
server = AgentServer()


@server.rtc_session()
async def voara_agent(ctx: agents.JobContext):
    """
    Main agent session handler.
    
    Called when a participant joins a room that requests an agent.
    Sets up the Gemini Live API model and starts the conversation.
    """
    settings = get_agent_settings()
    
    logger.info(f"Starting agent session for room: {ctx.room.name}")
    
    # Clear RAG context file when a new session starts
    # This prevents showing old tool calling results from previous sessions
    try:
        import json
        context_file = os.path.join(Path(__file__).parent.parent, "rag_context.json")
        if os.path.exists(context_file):
            with open(context_file, "w", encoding="utf-8") as f:
                json.dump({"query": "", "context": "", "timestamp": None}, f, ensure_ascii=False)
            logger.info(f"Cleared RAG context file for new session: {ctx.room.name}")
    except Exception as e:
        logger.warning(f"Failed to clear RAG context file: {e}")
    
    # Create the Voara agent with RAG support
    agent = VoaraAgent(
        base_instructions=VOARA_SYSTEM_INSTRUCTIONS,
        enable_rag=settings.enable_rag
    )
    
    # Note: We no longer pre-fetch context - the agent will use the function tool
    # to retrieve context dynamically for each user query
    logger.info("RAG function calling enabled - agent will search knowledge base per query")
    
    # Create AgentSession with Gemini Live API and RAG tools
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=settings.gemini_model,
            voice=settings.gemini_voice,
            temperature=settings.temperature,
            instructions=VOARA_SYSTEM_INSTRUCTIONS,
        ),
        vad=silero.VAD.load(),  # Voice Activity Detection
        tools=RAG_TOOLS,  # Pass RAG function tools for dynamic retrieval
    )
    
    # Set up event handlers (sync function that registers async callbacks)
    setup_session_events(session, agent, ctx.room)
    
    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                # Enable noise cancellation if available
                # noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )
    
    logger.info("Agent session started, waiting for user interaction...")
    
    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user warmly and introduce yourself as Voara AI. "
                    "Ask how you can help them today. Keep it brief and friendly."
    )
    
    # Wait for the room to close
    # The session will be automatically cleaned up when the room closes
    close_event = asyncio.Event()
    
    @session.on("close")
    def on_close(event):
        close_event.set()
    
    await close_event.wait()
    
    logger.info("Agent session ended")


def main():
    """
    Main entry point for the agent.
    
    Handles CLI arguments and starts the agent server.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Voara Voice Agent")
    parser.add_argument(
        "command",
        choices=["dev", "start", "download-files"],
        help="Command to run"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level"
    )
    
    args = parser.parse_args()
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    if args.command == "download-files":
        logger.info("Downloading model files...")
        # Silero VAD and other models are downloaded automatically on first use
        silero.VAD.load()
        logger.info("Model files downloaded successfully")
        return
    
    # Start the agent server
    logger.info("Starting Voara Voice Agent...")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL', 'not set')}")
    
    # The cli.run_app handles both 'dev' and 'start' modes
    cli.run_app(server)


if __name__ == "__main__":
    main()
