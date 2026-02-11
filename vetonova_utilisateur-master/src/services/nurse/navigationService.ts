/**
 * Service de navigation utilisant l'API Mapbox Directions
 */
import { MAPBOX_API } from '@/src/constants/config';


// REMPLACE PAR TON TOKEN MAPBOX (Disponible gratuitement sur mapbox.com)
const MAPBOX_ACCESS_TOKEN = MAPBOX_API;

export interface RouteData {
  distance: string;    // Distance en km
  duration: number;    // Temps en minutes
  coordinates: {       // Points pour tracer la Polyline
    latitude: number;
    longitude: number;
  }[];
}

export const getRouteData = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteData | null> => {
  try {
    // On demande le trajet "driving" (conduite) avec la géométrie complète
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn("Mapbox: Aucun itinéraire trouvé");
      return null;
    }

    const route = data.routes[0];

    return {
      // Conversion mètres -> kilomètres (arrondi à 1 décimale)
      distance: (route.distance / 1000).toFixed(1),
      
      // Conversion secondes -> minutes (arrondi à l'entier supérieur)
      duration: Math.ceil(route.duration / 60),
      
      // Transformation des coordonnées Mapbox [lng, lat] vers format React Native Maps [lat, lng]
      coordinates: route.geometry.coordinates.map((point: [number, number]) => ({
        latitude: point[1],
        longitude: point[0],
      })),
    };
  } catch (error) {
    console.error("Erreur Navigation Service:", error);
    return null;
  }
};