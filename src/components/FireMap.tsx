import { useState, useEffect } from "react";
import brain from "brain";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type FireIncident } from "types";
import { Skeleton } from "@/components/ui/skeleton";

// Custom icon for fire incidents
const fireIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/6831/6831368.png', // A temporary flame icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});


interface Props {
    onMarkerClick: (incidentId: string) => void;
}

interface FireMapProps {
  onMarkerClick: (incidentId: string) => void;
  selectedIncidentId: string | null;
  locations: FireIncident[];
}


export const FireMap: React.FC<FireMapProps> = ({ onMarkerClick, selectedIncidentId, locations }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locations && locations.length > 0) {
      setLoading(false);
    }
  }, [locations]);
  
  const algeriaCenter: [number, number] = [28.0339, 1.6596]; 

  if (loading) {
    return <Skeleton className="h-full w-full rounded-lg bg-gray-800" />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-900 bg-opacity-30 p-4 rounded-lg h-full flex items-center justify-center">{error}</div>;
  }

  return (
    <MapContainer center={algeriaCenter} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', backgroundColor: '#1a202c' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {locations.map((loc) => (
        <Marker 
          key={loc.id} 
          position={[loc.location.lat, loc.location.lon]} 
          icon={fireIcon}
          eventHandlers={{
            click: () => onMarkerClick(loc.id),
          }}
          opacity={selectedIncidentId === loc.id ? 1 : 0.7}
        >
          <Tooltip
            direction="top"
            offset={[0, -30]}
            opacity={1}
            permanent={false}
            className="bg-gray-800 text-white border-none rounded-md shadow-lg"
          >
            <span className="font-bold">{loc.location.wilaya}</span>
            <br />
            <span>Click to see details</span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};
