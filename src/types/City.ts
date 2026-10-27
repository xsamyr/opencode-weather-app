export interface City {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}
