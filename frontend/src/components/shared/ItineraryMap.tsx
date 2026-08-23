"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Location {
  lat: number;
  lng: number;
}

interface ItineraryStop {
  day: number;
  title: { en: string; am?: string };
  description: { en: string; am?: string };
  startTime?: string;
  location?: Location;
}

interface ItineraryMapProps {
  itinerary: ItineraryStop[];
}

const DEFAULT_CENTER: [number, number] = [7.2345, 37.8920]; // Kambata default
const DEFAULT_ZOOM = 10;

// Component to handle auto-fitting bounds based on markers
function MapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

export default function ItineraryMap({ itinerary }: ItineraryMapProps) {
  // Extract all valid coordinates for markers and polyline
  const validStops = itinerary?.filter(stop => stop.location && stop.location.lat && stop.location.lng) || [];
  const positions: [number, number][] = validStops.map(stop => [stop.location!.lat, stop.location!.lng]);

  const initialCenter = positions.length > 0 ? positions[0] : DEFAULT_CENTER;

  return (
    <div className="w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm relative z-0">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {positions.length > 0 && <MapBounds positions={positions} />}
        {positions.length > 1 && (
          <Polyline 
            positions={positions} 
            color="#FF8C00" 
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}

        {validStops.map((stop, idx) => (
          <Marker key={idx} position={[stop.location!.lat, stop.location!.lng]}>
            <Popup className="custom-popup">
              <div className="p-1 max-w-[200px]">
                <div className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider mb-1">
                  Day {stop.day}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{stop.title?.en || "Stop"}</h3>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {stop.description?.en}
                </p>
                {stop.startTime && (
                  <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
                    <span className="font-bold">Start:</span> {stop.startTime}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {positions.length === 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[400] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white dark:bg-[#0A0F1C] p-6 rounded-2xl shadow-xl max-w-sm text-center pointer-events-auto">
            <h3 className="font-black text-gray-900 dark:text-white mb-2 text-lg">No Map Data Available</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              The exact route coordinates for this tour have not been published yet. Check the itinerary list below for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
