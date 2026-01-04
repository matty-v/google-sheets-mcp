import { http } from '@google-cloud/functions-framework';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';

// Create a single transport instance for stateless mode
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Stateless mode
});

// Create and connect the MCP server
const server = createMcpServer();
server.connect(transport);

http('mcpHandler', async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
  res.set('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path = req.path || '/';

  // Health check endpoint
  if (path === '/health' && req.method === 'GET') {
    res.json({ status: 'ok' });
    return;
  }

  // MCP protocol version discovery (HEAD request to root)
  if (path === '/' && req.method === 'HEAD') {
    res.set('MCP-Protocol-Version', '2025-06-18');
    res.status(200).send('');
    return;
  }

  // Handle MCP requests at root path (Streamable HTTP transport)
  if (path === '/' || path === '/mcp') {
    if (req.method === 'GET' || req.method === 'POST' || req.method === 'DELETE') {
      try {
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
      return;
    }
  }

  // Default response
  res.status(404).json({
    error: 'Not found',
    availableEndpoints: {
      '/': 'GET/POST - MCP Streamable HTTP endpoint',
      '/health': 'GET - Health check',
    }
  });
});

// For local development with stdio
if (process.env.MCP_STDIO === 'true') {
  import('@modelcontextprotocol/sdk/server/stdio.js').then(({ StdioServerTransport }) => {
    const stdioServer = createMcpServer();
    const stdioTransport = new StdioServerTransport();
    stdioServer.connect(stdioTransport);
    console.error('MCP server running on stdio');
  });
}
