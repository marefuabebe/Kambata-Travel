// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet components to avoid SSR 'window is not defined' error
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface MapViewerProps {
  destinations: any[];
  onMarkerClick?: (destination: any) => void;
}

const MapViewer = ({ destinations, onMarkerClick }: MapViewerProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-full h-full bg-dark/20 animate-pulse" />;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass border-white/5">
      <MapContainer
        // @ts-ignore
        center={[7.2, 37.8]} // Center of Kambata region
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {destinations.map((dest) => (
          <Marker
            key={dest._id}
            position={[dest.location?.coordinates?.[1] || 7.2, dest.location?.coordinates?.[0] || 37.8]}
            eventHandlers={{
              click: () => onMarkerClick?.(dest),
            }}
          >
            <Popup className="premium-popup">
              <div className="p-2">
                <h3 className="font-bold text-primary">{dest.name}</h3>
                <p className="text-xs opacity-70">{dest.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapViewer;
