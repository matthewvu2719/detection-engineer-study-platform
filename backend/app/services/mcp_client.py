from contextlib import asynccontextmanager
from langchain_mcp_adapters.client import MultiServerMCPClient

MS_LEARN_SERVER = {
    "ms_learn": {
        "url": "https://learn.microsoft.com/api/mcp",
        "transport": "streamable_http",
    }
}


@asynccontextmanager
async def ms_learn_tools():
    """
    Async context manager that yields a list of LangChain tools
    backed by the Microsoft Learn MCP server.

    Usage:
        async with ms_learn_tools() as tools:
            agent = create_react_agent(llm, tools)
    """
    async with MultiServerMCPClient(MS_LEARN_SERVER) as client:
        yield client.get_tools()
