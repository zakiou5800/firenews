import React, { useEffect, useState } from "react";
import brain from "brain";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type FireAlert } from "types";
import { formatDistanceToNow } from 'date-fns';

export const AlertsFeed = () => {
  const [alerts, setAlerts] = useState<FireAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await brain.get_fire_alerts();
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        } else {
          setError("Failed to fetch fire alerts.");
        }
      } catch (err) {
        setError("An error occurred while fetching alerts.");
        console.error(err);
      }
    };

    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000); 

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="text-red-500 bg-red-900 bg-opacity-30 p-4 rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800">
            <TableHead className="text-white uppercase">Alert</TableHead>
            <TableHead className="text-white uppercase text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className="border-gray-800 hover:bg-gray-800">
              <TableCell className="font-medium">{alert.title}</TableCell>
              <TableCell className="text-right text-gray-400">
                 {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
