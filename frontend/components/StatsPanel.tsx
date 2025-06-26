import { useState, useEffect } from "react";
import brain from "brain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FireIncident } from "types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, TrendingUp, Siren, Users } from "lucide-react";

const StatCard = ({
  icon: Icon,
  label,
  value,
  isLoading,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  isLoading: boolean;
  color: string;
}) => (
  <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm p-4 rounded-lg flex items-center shadow-lg border border-gray-700">
    {isLoading ? (
      <>
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </>
    ) : (
      <>
        <Icon className={`w-8 h-8 ${color}`} />
        <div className="ml-4">
          <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
            {label}
          </div>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </>
    )}
  </div>
);

export const StatsPanel = ({ incidents }: { incidents: FireIncident[] }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (incidents && incidents.length > 0) {
      setLoading(false);
    }
  }, [incidents]);

  const activeFires = incidents.length;
  const alertsToday = incidents.filter(
    (i) => new Date(i.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const affectedWilayas = new Set(incidents.map((i) => i.location.wilaya))
    .size;

  const statCards = [
    {
      icon: Siren,
      label: "Active Fires",
      value: activeFires ?? "...",
      color: "text-red-500",
    },
    {
      icon: AlertTriangle,
      label: "Alerts Today",
      value: alertsToday ?? "...",
      color: "text-yellow-500",
    },
    {
      icon: Users,
      label: "Affected Wilayas",
      value: affectedWilayas ?? "...",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          isLoading={loading}
          color={stat.color}
        />
      ))}
    </div>
  );
};
