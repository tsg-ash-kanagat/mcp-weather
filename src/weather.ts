// Weather MCP tools for Cloudflare Workers
export interface WeatherConfig {
  NWS_API_BASE: string;
  USER_AGENT: string;
  REQUEST_TIMEOUT: number;
  MAX_FORECAST_PERIODS: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    description?: string;
    instruction?: string;
  };
}

export interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  detailedForecast: string;
}

export class WeatherMCP {
  private config: WeatherConfig;

  constructor(env: any) {
    this.config = {
      NWS_API_BASE: env.NWS_API_BASE || "https://api.weather.gov",
      USER_AGENT: env.USER_AGENT || "cloudflare-mcp-sse/1.0",
      REQUEST_TIMEOUT: parseInt(env.REQUEST_TIMEOUT) || 30000,
      MAX_FORECAST_PERIODS: parseInt(env.MAX_FORECAST_PERIODS) || 5,
    };
  }

  private async makeNWSRequest(url: string): Promise<any | null> {
    const headers = {
      "User-Agent": this.config.USER_AGENT,
      "Accept": "application/geo+json",
    };

    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.config.REQUEST_TIMEOUT),
      });

      if (!response.ok) {
        console.error(`HTTP error ${response.status} while requesting ${url}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          console.error(`Timeout while requesting ${url}`);
        } else {
          console.error(`Error while requesting ${url}:`, error.message);
        }
      }
      return null;
    }
  }

  private formatAlert(feature: AlertFeature): string {
    const props = feature.properties;
    return `
Event: ${props.event || "Unknown"}
Area: ${props.areaDesc || "Unknown"}
Severity: ${props.severity || "Unknown"}
Description: ${props.description || "No description available"}
Instructions: ${props.instruction || "No specific instructions provided"}
`;
  }

  async getAlerts(state: string): Promise<string> {
    const url = `${this.config.NWS_API_BASE}/alerts/active/area/${state}`;
    const data = await this.makeNWSRequest(url);

    if (!data || !data.features) {
      return "Unable to fetch alerts or no alerts found.";
    }

    if (!data.features.length) {
      return "No active alerts for this state.";
    }

    const alerts = data.features.map((feature: AlertFeature) =>
      this.formatAlert(feature)
    );
    return alerts.join("\n---\n");
  }

  async getForecast(latitude: number, longitude: number): Promise<string> {
    const pointsUrl = `${this.config.NWS_API_BASE}/points/${latitude},${longitude}`;
    const pointsData = await this.makeNWSRequest(pointsUrl);

    if (!pointsData) {
      return "Unable to fetch forecast data for this location.";
    }

    const forecastUrl = pointsData.properties.forecast;
    const forecastData = await this.makeNWSRequest(forecastUrl);

    if (!forecastData) {
      return "Unable to fetch detailed forecast.";
    }

    const periods: ForecastPeriod[] = forecastData.properties.periods;
    const forecasts = periods
      .slice(0, this.config.MAX_FORECAST_PERIODS)
      .map((period) => `
${period.name}:
Temperature: ${period.temperature}°${period.temperatureUnit}
Wind: ${period.windSpeed} ${period.windDirection}
Forecast: ${period.detailedForecast}
`);

    return forecasts.join("\n---\n");
  }

  getTools(): MCPTool[] {
    return [
      {
        name: "get_alerts",
        description: "Get weather alerts for a US state",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Two-letter US state code (e.g. CA, NY)",
            },
          },
          required: ["state"],
        },
      },
      {
        name: "get_forecast",
        description: "Get weather forecast for a location",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location",
            },
            longitude: {
              type: "number",
              description: "Longitude of the location",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
    ];
  }

  async executeTool(name: string, args: any): Promise<string> {
    switch (name) {
      case "get_alerts":
        return await this.getAlerts(args.state);
      case "get_forecast":
        return await this.getForecast(args.latitude, args.longitude);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}