import React, { useState, useEffect, useCallback } from "react";
import { UserButton } from "@stackframe/react";
import { Shield, Map, BarChart, Bell, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { auth, WS_API_URL } from "app";
import { Header } from "components/Header";
import { StatsPanel } from "components/StatsPanel";
import { FireMap } from "components/FireMap";
import { ActiveFiresList } from "components/ActiveFiresList";
import { IncidentDetail } from "components/IncidentDetail";
import { type FireIncident } from "types";
import { Toaster, toast } from "sonner";
import { useFireIncidentsStore } from "utils/fireIncidentsStore";
import { Button } from "@/components/ui/button";
import brain from "brain";


const App = () => {
  const { incidents, fetchIncidents } = useFireIncidentsStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [selectedIncident, setSelectedIncident] = useState<FireIncident | null>(
    null
  );
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [socketProtocols, setSocketProtocols] = useState<string[]>([]);
  const [reconnectCounter, setReconnectCounter] = useState(0);

  // Function to force a reconnect by changing the counter
  const forceReconnect = () => setReconnectCounter(prev => prev + 1);

  // Fetch incidents data on component mount and setup interval
  useEffect(() => {
    fetchIncidents(); // Initial fetch
    const interval = setInterval(fetchIncidents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Setup WebSocket URL with authentication
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await auth.getAuthToken();
        if (token) {
          setSocketUrl(`${WS_API_URL}/ws/fire-updates`);
          setSocketProtocols(["databutton.app", `Authorization.Bearer.${token}`]);
        } else {
          console.error("Authentication token not available.");
        }
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
      }
    };
    setupSocket();
  }, [reconnectCounter]);

  const { lastMessage, readyState } = useWebSocket(socketUrl, {
    protocols: socketProtocols,
    shouldReconnect: (closeEvent) => {
      // Limit reconnection attempts and provide better error handling
      console.log('WebSocket close event:', closeEvent);
      return closeEvent.code !== 1000; // Don't reconnect on normal closure
    },
    reconnectAttempts: 10, // Reduce from default 20 attempts
    reconnectInterval: (attemptNumber) => Math.min(1000 * Math.pow(2, attemptNumber), 30000), // Exponential backoff with max 30s
    onOpen: () => {
      console.log("WebSocket connection established.");
      toast.success("Connected to live updates", { position: "bottom-right" });
    },
    onClose: (event) => {
      console.log("WebSocket connection closed.", event);
      if (event.code !== 1000) {
        toast.error("Live updates disconnected", { position: "bottom-right" });
      }
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
      toast.error("Connection error - retrying...", { position: "bottom-right" });
    },
    onReconnectStop: () => {
      toast.error("Could not establish live connection. Check your internet connection.", { 
        position: "bottom-right",
        duration: 10000 
      });
    },
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage?.data === "fires_updated") {
      toast.info("Fire data has been updated.", {
        position: "bottom-right",
      });
      // Trigger a re-fetch using the centralized store
      fetchIncidents();
    }
  }, [lastMessage, fetchIncidents]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Live",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Disconnected",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];
  
  const handleMarkerClick = useCallback(async (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setIsDetailViewOpen(true);
    // Find the incident from the current incidents state
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      setSelectedIncident(incident);
    } else {
      toast.error("Could not find incident details.");
    }
  }, [incidents]);

  const handleCloseDetailView = useCallback(() => {
    setIsDetailViewOpen(false);
    setSelectedIncident(null);
    setSelectedIncidentId(null);
  }, []);

  const handleStartProcessing = async () => {
    try {
      setProcessing(true);
      const response = await brain.manual_scrape({});
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const results = await response.json();
      toast.success(`Processing completed: ${results.total_articles} articles found`, {
        position: "bottom-right"
      });
      // Refresh incidents after processing
      setTimeout(() => fetchIncidents(), 2000);
    } catch (error) {
      console.error("Error during processing:", error);
      toast.error("Processing failed", { position: "bottom-right" });
    } finally {
      setProcessing(false);
    }
  };
  
    // Add a status indicator for the WebSocket connection
  const getStatusColor = () => {
    switch (readyState) {
      case ReadyState.OPEN:
        return 'text-green-500';
      case ReadyState.CONNECTING:
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Toaster richColors theme="dark" />
      <Header />
      <main className="flex-grow p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleStartProcessing}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 text-lg shadow-lg"
            >
              {processing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  START PROCESSING
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate("/scraping-control")}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black px-6 py-3 border border-gray-600"
            >
              <Shield className="h-5 w-5 mr-2" />
              SCRAPING CONTROL
            </Button>
          </div>
        </div>
        <StatsPanel incidents={incidents} />
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="lg:col-span-2 h-full">
            <FireMap onMarkerClick={handleMarkerClick} selectedIncidentId={selectedIncidentId} locations={incidents} />
          </div>
          <div className="h-full bg-gray-800 bg-opacity-40 p-4 rounded-lg shadow-lg border border-gray-700">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Active Fires</h2>
                <div className="flex items-center space-x-2">
                   <span className={`text-sm font-semibold ${getStatusColor()}`}>{connectionStatus}</span>
                   <div className={`w-3 h-3 rounded-full ${getStatusColor().replace('text', 'bg')}`}></div>
                </div>
            </div>
            <ActiveFiresList onItemClick={handleMarkerClick} selectedIncidentId={selectedIncidentId} />
          </div>
        </div>
      </main>
      <IncidentDetail
        incident={selectedIncident}
        isOpen={isDetailViewOpen}
        onClose={handleCloseDetailView}
      />
    </div>
  );
}

export default App;
