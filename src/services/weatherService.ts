/**
 * Weather Service
 * Contains shared weather-related utilities and API helpers
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export class WeatherService {
  // Constants
  private static readonly NWS_API_BASE = "https://api.weather.gov";
  private static readonly USER_AGENT = "weather-app/1.0";

  /**
   * Helper method to make NWS API requests
   */
  static async makeNWSRequest(url: string) {
    const headers = {
      "User-Agent": this.USER_AGENT,
      Accept: "application/geo+json",
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.error(`NWS API error: ${response.status} ${response.statusText}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Error making NWS request:", error);
      return null;
    }
  }

  /**
   * Helper method to get coordinates for a city using OpenStreetMap
   */
  static async getCoordinatesForCity(location: string): Promise<Coordinates | null> {
    try {
      const encodedLocation = encodeURIComponent(location + ', USA');
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`, {
        headers: {
          'User-Agent': 'weather-app/1.0 (https://example.com/contact)'
        }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  /**
   * Get the NWS API base URL
   */
  static get apiBase(): string {
    return this.NWS_API_BASE;
  }

  /**
   * Get current weather for a location - MCP compatible
   */
  static async getCurrentWeather(location: string): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting current weather for ${location}`);
      
      const coords = await this.getCoordinatesForCity(location);
      if (!coords) {
        return {
          success: false,
          error: 'Location not found',
          message: `Could not find coordinates for "${location}". Please try with a US city and state, e.g., "San Francisco, CA"`
        };
      }

      const pointsUrl = `${this.apiBase}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
      const pointsData = await this.makeNWSRequest(pointsUrl);

      if (!pointsData?.properties?.forecast) {
        return {
          success: false,
          error: 'NWS API error',
          message: `Failed to retrieve grid point data for ${location}. This location may not be supported by the NWS API (only US locations are supported).`
        };
      }

      const forecastData = await this.makeNWSRequest(pointsData.properties.forecast);
      const periods = forecastData?.properties?.periods || [];
      
      if (periods.length === 0) {
        return {
          success: false,
          error: 'No forecast data',
          message: "No forecast periods available"
        };
      }

      const currentPeriod = periods[0];
      return {
        success: true,
        data: {
          location,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
          period: currentPeriod.name || "Current",
          temperature: `${currentPeriod.temperature || "Unknown"}°${currentPeriod.temperatureUnit || "F"}`,
          wind: `${currentPeriod.windSpeed || "Unknown"} ${currentPeriod.windDirection || ""}`,
          conditions: currentPeriod.shortForecast || "No forecast available"
        },
        message: `Current weather for ${location}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get current weather'
      };
    }
  }

  /**
   * Get weather forecast for a location - MCP compatible
   */
  static async getForecast(location: string): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting forecast for ${location}`);
      
      const coords = await this.getCoordinatesForCity(location);
      if (!coords) {
        return {
          success: false,
          error: 'Location not found',
          message: `Could not find coordinates for "${location}". Please try with a US city and state, e.g., "Plainfield, IL"`
        };
      }

      const pointsUrl = `${this.apiBase}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
      const pointsData = await this.makeNWSRequest(pointsUrl);

      if (!pointsData?.properties?.forecast) {
        return {
          success: false,
          error: 'NWS API error',
          message: `Failed to retrieve grid point data for ${location}. This location may not be supported by the NWS API (only US locations are supported).`
        };
      }

      const forecastData = await this.makeNWSRequest(pointsData.properties.forecast);
      const periods = forecastData?.properties?.periods || [];
      
      if (periods.length === 0) {
        return {
          success: false,
          error: 'No forecast data',
          message: "No forecast periods available"
        };
      }

      const formattedForecast = periods.map((period: any) => ({
        name: period.name || "Unknown",
        temperature: `${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        wind: `${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        conditions: period.shortForecast || "No forecast available"
      }));

      return {
        success: true,
        data: {
          location,
          forecast: formattedForecast,
          count: periods.length
        },
        message: `Weather forecast for ${location}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get weather forecast'
      };
    }
  }

  /**
   * Get weather alerts for a state - MCP compatible
   */
  static async getAlerts(state: string): Promise<any> {
    try {
      console.log(`🌤️ Weather: Getting alerts for ${state}`);
      
      const stateCode = state.toUpperCase();
      if (stateCode.length !== 2) {
        return {
          success: false,
          error: 'Invalid state code',
          message: 'State code must be a two-letter US state code (e.g., IL, CA, NY)'
        };
      }

      const alertsUrl = `${this.apiBase}/alerts?area=${stateCode}`;
      const alertsData = await this.makeNWSRequest(alertsUrl);

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
