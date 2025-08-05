import { MCPServer, MCPRequest } from './mcp';

export interface Env {
  NWS_API_BASE?: string;
  USER_AGENT?: string;
  REQUEST_TIMEOUT?: string;
  MAX_FORECAST_PERIODS?: string;
}

// Helper function to create SSE data format
function createSSEMessage(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Handle SSE streaming for MCP communication
async function handleSSERequest(request: Request, env: Env): Promise<Response> {
  const mcpServer = new MCPServer(env);
  
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // Send initial connection message
        controller.enqueue(encoder.encode(
          createSSEMessage('connected', { message: 'MCP SSE server ready' })
        ));

        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(
              createSSEMessage('ping', { timestamp: Date.now() })
            ));
          } catch (error) {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds

        // Handle connection close
        request.signal?.addEventListener('abort', () => {
          clearInterval(pingInterval);
          controller.close();
        });

      } catch (error) {
        controller.enqueue(encoder.encode(
          createSSEMessage('error', { 
            message: error instanceof Error ? error.message : 'Unknown error' 
          })
        ));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Handle MCP message processing via POST to /sse
async function handleSSEPost(request: Request, env: Env): Promise<Response> {
  try {
    const mcpRequest: MCPRequest = await request.json();
    const mcpServer = new MCPServer(env);
    const response = await mcpServer.handleRequest(mcpRequest);
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle MCP message processing
async function handleMCPMessage(request: Request, env: Env): Promise<Response> {
  try {
    const mcpRequest: MCPRequest = await request.json();
    const mcpServer = new MCPServer(env);
    const response = await mcpServer.handleRequest(mcpRequest);
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle regular HTTP requests
async function handleHTTPRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  switch (url.pathname) {
    case '/':
      return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>MCP SSE Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { margin: 10px 0; }
        .test-button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            margin-left: 10px;
        }
        #output { 
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            padding: 15px; 
            margin-top: 20px; 
            white-space: pre-wrap; 
            max-height: 400px; 
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>MCP SSE Server</h1>
    <p>Model Context Protocol Server with Server-Sent Events</p>
    
    <h2>Endpoints:</h2>
    <div class="endpoint">
        <strong>GET /sse</strong> - SSE endpoint for MCP communication
        <button class="test-button" onclick="testSSE()">Test SSE</button>
    </div>
    <div class="endpoint">
        <strong>POST /sse</strong> - POST MCP requests to SSE endpoint
    </div>
    <div class="endpoint">
        <strong>POST /mcp</strong> - Direct MCP JSON-RPC endpoint
        <button class="test-button" onclick="testMCP()">Test MCP</button>
    </div>
    <div class="endpoint">
        <strong>GET /tools</strong> - List available tools
        <a href="/tools" target="_blank">View Tools</a>
    </div>

    <div id="output"></div>

    <script>
        function testSSE() {
            const output = document.getElementById('output');
            output.textContent = 'Connecting to SSE...\\n';
            
            const eventSource = new EventSource('/sse');
            
            eventSource.onopen = function(event) {
                output.textContent += 'Connected to SSE\\n';
            };
            
            eventSource.onmessage = function(event) {
                output.textContent += 'Message: ' + event.data + '\\n';
            };
            
            eventSource.addEventListener('connected', function(event) {
                output.textContent += 'Connected: ' + event.data + '\\n';
            });
            
            eventSource.addEventListener('ping', function(event) {
                output.textContent += 'Ping: ' + event.data + '\\n';
            });
            
            eventSource.onerror = function(event) {
                output.textContent += 'Error occurred\\n';
                eventSource.close();
            };
            
            // Test sending a request via POST
            setTimeout(async () => {
                try {
                    const response = await fetch('/sse', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: 1,
                            method: 'initialize',
                            params: {
                                protocolVersion: '2025-06-18',
                                capabilities: {},
                                clientInfo: { name: 'test-client', version: '1.0.0' }
                            }
                        })
                    });
                    const result = await response.json();
                    output.textContent += 'POST Response: ' + JSON.stringify(result, null, 2) + '\\n';
                } catch (error) {
                    output.textContent += 'POST Error: ' + error.message + '\\n';
                }
            }, 2000);
            
            // Close connection after 30 seconds for demo
            setTimeout(() => {
                eventSource.close();
                output.textContent += 'Connection closed\\n';
            }, 30000);
        }
        
        async function testMCP() {
            const output = document.getElementById('output');
            output.textContent = 'Testing MCP endpoint...\\n';
            
            try {
                // Test initialize
                const initResponse = await fetch('/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'initialize',
                        params: {
                            protocolVersion: '2025-06-18',
                            capabilities: {},
                            clientInfo: { name: 'test-client', version: '1.0.0' }
                        }
                    })
                });
                const initResult = await initResponse.json();
                output.textContent += 'Initialize: ' + JSON.stringify(initResult, null, 2) + '\\n\\n';
                
                // Test tools/list
                const toolsResponse = await fetch('/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 2,
                        method: 'tools/list'
                    })
                });
                const toolsResult = await toolsResponse.json();
                output.textContent += 'Tools: ' + JSON.stringify(toolsResult, null, 2) + '\\n';
                
            } catch (error) {
                output.textContent += 'Error: ' + error.message + '\\n';
            }
        }
    </script>
</body>
</html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });

    case '/mcp':
      if (request.method === 'POST') {
        return handleMCPMessage(request, env);
      }
      return new Response('Method not allowed', { status: 405 });

    case '/tools':
      const mcpServer = new MCPServer(env);
      
      // Get tools list directly (no initialization check needed)
      const listRequest: MCPRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };
      const response = await mcpServer.handleRequest(listRequest);
      
      return new Response(JSON.stringify(response, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    case '/health':
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        protocolVersion: '2025-06-18'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    default:
      return new Response('Not Found', { status: 404 });
  }
}

// Main worker export with proper fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Route SSE requests
    if (url.pathname === '/sse') {
      if (request.method === 'POST') {
        return handleSSEPost(request, env);
      } else if (request.method === 'GET') {
        return handleSSERequest(request, env);
      }
    }
    
    // Route regular HTTP requests
    return handleHTTPRequest(request, env);
  },
};