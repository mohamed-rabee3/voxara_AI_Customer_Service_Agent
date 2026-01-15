"""
RAG Function Tools for Voice Agent

Defines function calling tools for RAG retrieval that can be used
by the Gemini Live API during conversations.
"""

import json
import logging
from livekit.agents import function_tool, RunContext

logger = logging.getLogger(__name__)

# Global retriever instance (lazy loaded)
_retriever = None

# Global storage for last RAG context (for frontend display)
_last_rag_context = {
    "query": "",
    "context": "",
    "timestamp": None
}


def get_last_rag_context():
    """Get the last RAG context for API endpoint."""
    return _last_rag_context


async def _get_retriever():
    """Lazy-load the RAG retriever."""
    global _retriever
    if _retriever is None:
        try:
            from rag import Retriever
            _retriever = Retriever()
            logger.info("RAG retriever initialized for function tools")
        except Exception as e:
            logger.error(f"Failed to initialize RAG retriever: {e}")
    return _retriever


@function_tool(
    name="search_knowledge_base",
    description=(
        "Search the Voara AI company knowledge base to find accurate information. "
        "ALWAYS use this tool when the customer asks about: "
        "- Company information, services, or products "
        "- Pricing, plans, or packages "
        "- Features or capabilities "
        "- FAQs or common questions "
        "- Contact information or support "
        "- Any factual question about Voara AI. "
        "The tool returns relevant information from the company documentation."
    )
)
async def search_knowledge_base(
    context: RunContext,
    query: str,
) -> str:
    """
    Search the Voara knowledge base for relevant information.
    
    Args:
        context: The run context from LiveKit
        query: The search query to find relevant information
        
    Returns:
        Relevant information from the knowledge base
    """
    global _last_rag_context
    import datetime
    
    logger.info(f"[RAG Tool] Searching knowledge base for: {query}")
    
    retriever = await _get_retriever()
    if retriever is None:
        logger.warning("[RAG Tool] Retriever not available")
        return "I apologize, but I'm unable to access the knowledge base at the moment. Please try again."
    
    try:
        result = await retriever.retrieve_context(
            query=query,
            include_metadata=False
        )
        
        if result:
            logger.info(f"[RAG Tool] Retrieved {len(result)} chars of context")
            
            # Store for frontend access - write to file for cross-process sharing
            _last_rag_context = {
                "query": query,
                "context": result,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # Write to file so API can read it
            try:
                import os
                context_file = os.path.join(os.path.dirname(__file__), "..", "rag_context.json")
                with open(context_file, "w", encoding="utf-8") as f:
                    json.dump(_last_rag_context, f, ensure_ascii=False)
                logger.info(f"[RAG Tool] Context saved to {context_file}")
            except Exception as write_err:
                logger.warning(f"[RAG Tool] Failed to save context file: {write_err}")
            
            return result
        else:
            logger.info("[RAG Tool] No relevant information found")
            _last_rag_context = {
                "query": query,
                "context": "No specific information found.",
                "timestamp": datetime.datetime.now().isoformat()
            }
            return "No specific information found in the knowledge base for this query."
            
    except Exception as e:
        logger.error(f"[RAG Tool] Error during retrieval: {e}")
        return "I encountered an issue searching the knowledge base. Let me try to help you with what I know."


# List of all RAG tools to be passed to the agent
RAG_TOOLS = [search_knowledge_base]
