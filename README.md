# MCP Weather Server

A TypeScript-based weather service implementing the Model Context Protocol (MCP) with Server-Sent Events (SSE) streaming, designed to run on Cloudflare Workers. This server provides real-time weather data and alerts through a standardized protocol interface.

## Table of Contents

- [What is This Project?](#what-is-this-project)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Available Tools](#available-tools)
- [Configuration](#configuration)
- [Examples](#examples)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Support](#support)
- [Contributing](#contributing)

## What is This Project?

This project solves the problem of accessing real-time weather data through a standardized, streaming interface. It's built for:

- **AI/LLM Integration**: Provides weather tools that AI models can call through the Model Context Protocol
- **Real-time Applications**: Uses Server-Sent Events for live weather updates
- **Edge Computing**: Runs on Cloudflare Workers for global, low-latency access
- **Developers**: Simple API for integrating weather data into applications

**Model Context Protocol (MCP)** is a standard for AI models to interact with external tools and data sources. **Server-Sent Events (SSE)** enables real-time, one-way communication from server to client.

## Key Features

- 🌦️ **Real-time Weather Data** - Live weather alerts and forecasts from the National Weather Service
- 🔄 **SSE Streaming** - Server-Sent Events for real-time updates
- 🤖 **MCP Protocol** - Standard interface for AI model integration
- ⚡ **Edge Optimized** - Runs on Cloudflare Workers for global performance
- 🛡️ **Type Safe** - Full TypeScript implementation with comprehensive error handling
- 🚀 **Zero Config** - Works out of the box with sensible defaults
- 🌍 **US Coverage** - Comprehensive weather data for all US states and territories

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (version 16 or higher)
- **npm or yarn** package manager
- **Cloudflare account** (free tier works)
- **Git** for version control

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tsg-ash-kanagat/mcp-weather.git
   cd mcp-weather
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Authenticate with Cloudflare:**
   ```bash
   npx wrangler login
   ```

## Usage

### Local Development

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:8787`

### Testing the Interface

Visit `http://localhost:8787` in your browser to access the built-in testing interface with:
- SSE connection testing
- MCP protocol testing
- Interactive tool execution

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Interactive testing interface |
| `/sse` | GET | SSE streaming endpoint for real-time communication |
| `/sse` | POST | Send MCP requests via SSE |
| `/mcp` | POST | Direct MCP JSON-RPC endpoint |
| `/tools` | GET | List all available weather tools |
| `/health` | GET | Health check and server status |

## Available Tools

### `get_alerts`
Get active weather alerts for any US state.

**Parameters:**
- `state` (string): Two-letter US state code (e.g., "CA", "NY", "TX")

**Example:**
```json
{
  "name": "get_alerts",
  "arguments": {
    "state": "CA"
  }
}
```

### `get_forecast`
Get detailed weather forecast for specific coordinates.

**Parameters:**
- `latitude` (number): Latitude coordinate
- `longitude` (number): Longitude coordinate

**Example:**
```json
{
  "name": "get_forecast",
  "arguments": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

## Configuration

Environment variables can be configured in `wrangler.toml`:

```toml
[vars]
NWS_API_BASE = "https://api.weather.gov"          # Weather service API URL
USER_AGENT = "cloudflare-mcp-sse/1.0"             # HTTP user agent
REQUEST_TIMEOUT = "30000"                          # Request timeout (ms)
MAX_FORECAST_PERIODS = "5"                        # Max forecast periods
```

## Examples

### SSE Connection (JavaScript)

```javascript
const eventSource = new EventSource('http://localhost:8787/sse');

// Listen for connection events
eventSource.addEventListener('connected', (event) => {
  console.log('Connected:', JSON.parse(event.data));
});

// Listen for responses
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send MCP request
fetch('http://localhost:8787/sse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'get_forecast',
      arguments: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    }
  })
});
```

### Direct MCP Call (curl)

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_alerts",
      "arguments": {
        "state": "CA"
      }
    }
  }'
```

## Project Structure

```
mcp-weather/
├── src/
│   ├── index.ts      # Main worker entry point & HTTP routing
│   ├── mcp.ts        # MCP protocol implementation
│   └── weather.ts    # Weather tools using NWS API
├── dist/             # Compiled JavaScript (auto-generated)
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── wrangler.toml     # Cloudflare Workers configuration
└── README.md         # This documentation
```

## Development

### Build the project:
```bash
npm run build
```

### Type checking:
```bash
npx tsc --noEmit
```

### Local testing:
```bash
npm run dev
```

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Your server will be available at `https://mcp-sse-server.your-subdomain.workers.dev`

### Custom Domain (Optional)

1. Add a custom domain in the Cloudflare Workers dashboard
2. Update your `wrangler.toml` with route configuration
3. Redeploy with `npm run deploy`

## Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/tsg-ash-kanagat/mcp-weather/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsg-ash-kanagat/mcp-weather/discussions)
- **Documentation**: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- **MCP Specification**: [Model Context Protocol](https://spec.modelcontextprotocol.io/)

### Reporting Issues

When reporting issues, please include:
- Node.js and npm versions
- Error messages and stack traces
- Steps to reproduce the problem
- Expected vs actual behavior

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally: `npm run dev`
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Submit a Pull Request

---

**Made with ❤️ for the developer community**