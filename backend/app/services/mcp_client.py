from langchain_mcp_adapters.client import MultiServerMCPClient

MS_LEARN_SERVER = {
    "ms_learn": {
        "url": "https://learn.microsoft.com/api/mcp",
        "transport": "streamable_http",
    }
}


async def get_ms_learn_tools():
    client = MultiServerMCPClient(MS_LEARN_SERVER)
    return await client.get_tools()
