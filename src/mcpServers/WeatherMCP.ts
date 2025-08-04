/**
 * Weather MCP Server
 * Contains all weather-related tools using National Weather Service API
 */

import { BaseMCPServer, MCPTool, MCPToolResult } from './BaseMCP';
import { WeatherService } from '../services/weatherService';

export class WeatherMCPServer extends BaseMCPServer {
  readonly serverName = "Weather Information Server";
  readonly serverDescription = "Provides current weather, forecasts, and weather alerts";

  /**
   * Define all tools available in this server
   */
  protected defineTools(): Record<string, MCPTool> {
    return {
      get_current_weather: {
        name: "get_current_weather",
        description: "Get current weather conditions for a US city",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "US city and state for current weather conditions, e.g. 'San Francisco, CA'"
            }
          },
          required: ["location"]
        }
      },

      get_forecast: {
        name: "get_forecast",
        description: "Get multi-day weather forecast for a US city",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "US city and state for multi-day weather forecast, e.g. 'Plainfield, IL'"
            }
          },
          required: ["location"]
        }
      },

      get_alerts: {
        name: "get_alerts",
        description: "Get active weather alerts for a US state",
        parameters: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Two-letter US state code for weather alerts (e.g., IL, CA, NY)"
            }
          },
          required: ["state"]
        }
      }
    };
  }

  // Tool implementations

  async get_current_weather(args: { location: string }): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting current weather for ${args.location}`);
      
      // Get coordinates for the location
      const coords = await WeatherService.getCoordinatesForCity(args.location);
      
      if (!coords) {
        return {
          success: false,
          error: 'Location not found',
          message: `Could not find coordinates for "${args.location}". Please try with a US city and state, e.g., "San Francisco, CA"`
        };
      }

      // Get grid point data
      const pointsUrl = `${WeatherService.apiBase}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
      const pointsData = await WeatherService.makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          success: false,
          error: 'NWS API error',
          message: `Failed to retrieve grid point data for ${args.location}. This location may not be supported by the NWS API (only US locations are supported).`
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          success: false,
          error: 'Forecast URL not found',
          message: "Failed to get forecast URL from grid point data"
        };
      }

      // Get forecast data
      const forecastData = await WeatherService.makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          success: false,
          error: 'Forecast data error',
          message: "Failed to retrieve forecast data"
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          success: false,
          error: 'No forecast data',
          message: "No forecast periods available"
        };
      }

      // Get current conditions (first period)
      const currentPeriod = periods[0];
      
      return {
        success: true,
        data: {
          location: args.location,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
          period: currentPeriod.name || "Current",
          temperature: `${currentPeriod.temperature || "Unknown"}°${currentPeriod.temperatureUnit || "F"}`,
          wind: `${currentPeriod.windSpeed || "Unknown"} ${currentPeriod.windDirection || ""}`,
          conditions: currentPeriod.shortForecast || "No forecast available"
        },
        message: `Current weather for ${args.location}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get current weather'
      };
    }
  }

  async get_forecast(args: { location: string }): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting forecast for ${args.location}`);
      
      // Get coordinates for the location
      const coords = await WeatherService.getCoordinatesForCity(args.location);
      
      if (!coords) {
        return {
          success: false,
          error: 'Location not found',
          message: `Could not find coordinates for "${args.location}". Please try with a US city and state, e.g., "Plainfield, IL"`
        };
      }

      const { lat: latitude, lon: longitude } = coords;
      
      // Get grid point data
      const pointsUrl = `${WeatherService.apiBase}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const pointsData = await WeatherService.makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          success: false,
          error: 'NWS API error',
          message: `Failed to retrieve grid point data for ${args.location} (${latitude}, ${longitude}). This location may not be supported by the NWS API (only US locations are supported).`
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          success: false,
          error: 'Forecast URL not found',
          message: "Failed to get forecast URL from grid point data"
        };
      }

      // Get forecast data
      const forecastData = await WeatherService.makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          success: false,
          error: 'Forecast data error',
          message: "Failed to retrieve forecast data"
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          success: false,
          error: 'No forecast data',
          message: "No forecast periods available"
        };
      }

      // Format forecast periods
      const formattedForecast = periods.map((period: any) => ({
        name: period.name || "Unknown",
        temperature: `${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        wind: `${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        conditions: period.shortForecast || "No forecast available"
      }));

      return {
        success: true,
        data: {
          location: args.location,
          forecast: formattedForecast,
          count: periods.length
        },
        message: `Weather forecast for ${args.location}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get weather forecast'
      };
    }
  }

  async get_alerts(args: { state: string }): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting alerts for ${args.state}`);
      
      const stateCode = args.state.toUpperCase();
      if (stateCode.length !== 2) {
        return {
          success: false,
          error: 'Invalid state code',
          message: 'State code must be a two-letter US state code (e.g., IL, CA, NY)'
        };
      }

      const alertsUrl = `${WeatherService.apiBase}/alerts?area=${stateCode}`;
      const alertsData = await WeatherService.makeNWSRequest(alertsUrl);

      if (!alertsData) {
        return {
          success: false,
          error: 'NWS API error',
          message: "Failed to retrieve alerts data"
        };
      }

      const features = alertsData.features || [];
      if (features.length === 0) {
        return {
          success: true,
          data: {
            state: stateCode,
            alerts: [],
            count: 0
          },
          message: `No active alerts for ${stateCode}`
        };
      }

      const formattedAlerts = features.map((feature: any) => {
        const props = feature.properties;
        return {
          event: props.event || "Unknown",
          area: props.areaDesc || "Unknown",
          severity: props.severity || "Unknown",
          status: props.status || "Unknown",
          headline: props.headline || "No headline"
        };
      });

      return {
        success: true,
        data: {
          state: stateCode,
          alerts: formattedAlerts,
          count: features.length
        },
        message: `Found ${features.length} active alerts for ${stateCode}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get weather alerts'
      };
    }
  }
}
