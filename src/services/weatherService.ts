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
}
