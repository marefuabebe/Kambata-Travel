"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAP_MARKERS = [
  { id: "ajora", name: "Ajora Falls", lat: 7.25, lng: 37.85 },
  { id: "hambaricho", name: "Mount Hambaricho", lat: 7.28, lng: 37.80 },
  { id: "durame", name: "Durame", lat: 7.24, lng: 37.89 },
];

export default function MapWrapper({ setActiveCategory }: { setActiveCategory: (c: string) => void }) {
  // Use a unique key on mount to prevent the React 18 strict mode "Map container reused" error
  const [mapKey, setMapKey] = React.useState<string>("");

  useEffect(() => {
    setMapKey(Math.random().toString(36).substr(2, 9));
  }, []);

  if (!mapKey) return null;

  return (
    <MapContainer 
      key={mapKey}
      center={[7.25, 37.85]} 
      zoom={11} 
      scrollWheelZoom={false} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {MAP_MARKERS.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]}
          eventHandlers={{
            click: () => {
              setActiveCategory(marker.name.includes("Falls") ? "Waterfalls" : "Landscapes");
              document.getElementById('masonry-gallery')?.scrollIntoView({ behavior: 'smooth' });
            },
          }}
        >
          <Popup>{marker.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
