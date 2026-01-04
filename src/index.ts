import { http } from '@google-cloud/functions-framework';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from './server.js';

// Store active transports by session ID
const transports = new Map<string, SSEServerTransport>();

http('mcpHandler', async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

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

  // SSE endpoint - establishes connection
  if (path === '/sse' && req.method === 'GET') {
    const server = createMcpServer();
    const transport = new SSEServerTransport('/message', res);

    // Store transport for message routing
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    // Clean up on disconnect
    res.on('close', () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
    return;
  }

  // Message endpoint - receives client messages
  if (path === '/message' && req.method === 'POST') {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error('Error handling message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // Default response
  res.status(404).json({
    error: 'Not found',
    availableEndpoints: {
      '/health': 'GET - Health check',
      '/sse': 'GET - SSE connection for MCP',
      '/message': 'POST - Message endpoint for MCP (requires sessionId query param)',
    }
  });
});

// For local development with stdio
if (process.env.MCP_STDIO === 'true') {
  import('@modelcontextprotocol/sdk/server/stdio.js').then(({ StdioServerTransport }) => {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    server.connect(transport);
    console.error('MCP server running on stdio');
  });
}
