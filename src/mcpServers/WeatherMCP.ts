/**
 * Weather MCP Server
 * Contains all weather-related tools using National Weather Service API
 */

import { BaseMCPServer } from './BaseMCP';
import { WeatherService } from '../services/weatherService';

export class WeatherMCPServer extends BaseMCPServer {
  readonly serverName = "Weather Information Server";
  readonly serverDescription = "Provides current weather, forecasts, and weather alerts";

  /**
   * Set up all tools using server.tool() pattern
   */
  protected setupTools(): void {
    this.tool(
      "get_current_weather",
      {
        location: {
          type: "string",
          description: "US city and state for current weather conditions, e.g. 'San Francisco, CA'",
          required: true
        }
      },
      "Get current weather conditions for a US city",
      async (args) => await WeatherService.getCurrentWeather(args.location)
    );

    this.tool(
      "get_forecast",
      {
        location: {
          type: "string",
          description: "US city and state for multi-day weather forecast, e.g. 'Plainfield, IL'",
          required: true
        }
      },
      "Get multi-day weather forecast for a US city",
      async (args) => await WeatherService.getForecast(args.location)
    );

    this.tool(
      "get_alerts",
      {
        state: {
          type: "string",
          description: "Two-letter US state code for weather alerts (e.g., IL, CA, NY)",
          required: true
        }
      },
      "Get active weather alerts for a US state",
      async (args) => await WeatherService.getAlerts(args.state)
    );
  }
}
