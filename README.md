# MCP SSE Server for Cloudflare Workers

A TypeScript implementation of your FastAPI MCP SSE server optimized for Cloudflare Workers.

## Features

- Server-Sent Events (SSE) streaming using `cloudflare-workers-sse`
- Model Context Protocol (MCP) integration
- Weather tools (alerts and forecasts) using National Weather Service API
- TypeScript with full type safety
- Cloudflare Workers optimized

## Project Structure

```
cloudflare/
├── src/
│   ├── index.ts      # Main worker entry point
│   ├── mcp.ts        # MCP protocol implementation
│   └── weather.ts    # Weather tools
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript configuration
├── wrangler.toml     # Cloudflare Workers configuration
└── README.md         # This file
```

## Setup

1. Install dependencies:
   ```bash
   cd cloudflare
   npm install
   ```

2. Configure environment variables in `wrangler.toml` (already set with defaults)

3. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

## Development

Start local development server:
```bash
npm run dev
```

This will start the worker at `http://localhost:8787`

## Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## API Endpoints

- `/` - Homepage with API documentation
- `/sse` - SSE endpoint for MCP communication
- `/tools` - List available MCP tools
- `/docs` - API documentation

## Available Tools

- **get_alerts(state)** - Get weather alerts for a US state
- **get_forecast(latitude, longitude)** - Get weather forecast for coordinates

## Environment Variables

Configure in `wrangler.toml`:
- `NWS_API_BASE` - National Weather Service API base URL
- `USER_AGENT` - User agent for API requests
- `REQUEST_TIMEOUT` - Request timeout in milliseconds
- `MAX_FORECAST_PERIODS` - Maximum forecast periods to return

## Usage Example

Connect to SSE endpoint:
```javascript
const eventSource = new EventSource('https://your-worker.your-subdomain.workers.dev/sse');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

eventSource.addEventListener('mcp_response', function(event) {
    const mcpResponse = JSON.parse(event.data);
    console.log('MCP Response:', mcpResponse);
});
```

## Differences from Python Version

- Uses `cloudflare-workers-sse` instead of FastAPI's SSE
- Native fetch API instead of httpx
- TypeScript instead of Python
- Optimized for Cloudflare Workers runtime
- No external dependencies in production (uses Workers runtime APIs)# mcp-weather
