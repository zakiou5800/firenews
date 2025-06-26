import { useEffect } from "react";
import { Fire, MapPin, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type FireIncident } from "types";
import { Skeleton } from "@/components/ui/skeleton";
import { useFireIncidentsStore } from "utils/fireIncidentsStore";

interface Props {
  onIncidentSelect: (incident: FireIncident) => void;
}

interface ActiveFiresListProps {
  onItemClick: (incidentId: string) => void;
  selectedIncidentId: string | null;
}

export const ActiveFiresList = ({ onItemClick, selectedIncidentId }: ActiveFiresListProps) => {
  const { incidents, loading, error, fetchIncidents } = useFireIncidentsStore();

  // Fetch incidents on component mount
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  if (error) {
    return (
      <div className="text-red-500 bg-red-900 bg-opacity-30 p-4 rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-gray-800" />
        ))}
      </div>
    );
  }
  
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "border-red-500 bg-red-900 bg-opacity-30";
      case "High":
        return "border-yellow-500 bg-yellow-900 bg-opacity-30";
      case "Medium":
        return "border-orange-500 bg-orange-900 bg-opacity-30";
      default:
        return "border-gray-600 bg-gray-800 bg-opacity-50";
    }
  };
  
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const incidentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - incidentDate.getTime()) / 1000);

    const hours = Math.floor(diffInSeconds / 3600);
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-2 pr-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
      {incidents.map((incident) => (
        <div
          key={incident.id}
          onClick={() => onItemClick(incident.id)}
          className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 ${getSeverityClass(
            incident.severity
          )} ${
            selectedIncidentId === incident.id
              ? "ring-2 ring-blue-500"
              : "hover:bg-gray-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-white">{incident.location.wilaya}</span>
            <span className="text-xs text-gray-400">{getTimeAgo(incident.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1 truncate">{incident.description}</p>
        </div>
      ))}
    </div>
  );
};
