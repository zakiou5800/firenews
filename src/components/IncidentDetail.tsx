import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type FireIncident } from "types";
import { AlertTriangle, MapPin, Clock, ShieldAlert, Users, Flame, Wind, Home, Car, Siren } from "lucide-react";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Props {
  incident: FireIncident | null;
  onClose: () => void;
  loading: boolean;
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center text-sm">
    <Icon className="h-4 w-4 mr-3 text-gray-400" />
    <span className="font-semibold uppercase text-gray-400 w-24">{label}:</span>
    <span className="text-gray-200">{value}</span>
  </div>
);

const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'critical': return 'text-red-500 border-red-500';
        case 'high': return 'text-orange-400 border-orange-400';
        case 'medium': return 'text-yellow-400 border-yellow-400';
        case 'low': return 'text-green-400 border-green-400';
        default: return 'text-gray-400 border-gray-400';
    }
};

export const IncidentDetail = ({ incident, onClose, loading }: Props) => {
  const isOpen = !!incident || loading;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const getFireTypeIcon = (fireType: string) => {
    const type = fireType?.toLowerCase() || '';
    if (type.includes('غابة') || type.includes('forest')) return Flame;
    if (type.includes('منزل') || type.includes('house') || type.includes('home')) return Home;
    if (type.includes('مركبة') || type.includes('vehicle') || type.includes('car')) return Car;
    return AlertTriangle;
  };

  const formatEnhancedField = (value: string | null | undefined, defaultText = "غير محدد") => {
    return value && value.trim() !== '' ? value : defaultText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gray-900 bg-opacity-80 backdrop-blur-lg text-white border-l border-gray-700 w-full md:w-1/3 lg:w-1/4 flex flex-col">
        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="py-6 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
            <div className="py-6 border-t border-gray-800">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
          </div>
        ) : (
          incident && (
            <>
              <DialogHeader className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityClass(incident.severity).replace('text', 'bg').replace('border', 'bg')} bg-opacity-20`}>
                    {React.createElement(getFireTypeIcon(incident.fire_type || ''), { 
                      className: `h-6 w-6 ${getSeverityClass(incident.severity)}` 
                    })}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-red-400 text-2xl font-black">
                      {incident.location.wilaya}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-mono">
                      {incident.ai_enhanced && <Badge variant="outline" className="text-xs text-green-400 border-green-400 mr-2">AI ENHANCED</Badge>}
                      ID: {incident.id}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="font-black text-lg text-red-400 flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-2" />
                    INCIDENT STATUS
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoRow icon={AlertTriangle} label="SEVERITY" value={incident.severity} />
                    <InfoRow icon={Clock} label="STATUS" value={incident.status} />
                    <InfoRow icon={MapPin} label="CONFIDENCE" value={`${(incident.confidence * 100).toFixed(0)}%`} />
                    <InfoRow icon={Clock} label="REPORTED" value={new Date(incident.timestamp).toLocaleString()} />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Enhanced AI Analysis */}
                {incident.ai_enhanced && (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-black text-lg text-green-400 flex items-center">
                        <Flame className="h-5 w-5 mr-2" />
                        FIRE DETAILS
                      </h3>
                      <div className="space-y-2">
                        {incident.fire_type && (
                          <InfoRow icon={Flame} label="TYPE" value={formatEnhancedField(incident.fire_type)} />
                        )}
                        {incident.cause && (
                          <InfoRow icon={AlertTriangle} label="CAUSE" value={formatEnhancedField(incident.cause)} />
                        )}
                        {incident.affected_area && (
                          <InfoRow icon={MapPin} label="AREA" value={formatEnhancedField(incident.affected_area)} />
                        )}
                        {incident.date_mentioned && (
                          <InfoRow icon={Clock} label="DATE" value={formatEnhancedField(incident.date_mentioned)} />
                        )}
                      </div>
                    </div>

                    {(incident.casualties || incident.evacuation_info) && (
                      <>
                        <Separator className="bg-gray-700" />
                        <div className="space-y-3">
                          <h3 className="font-black text-lg text-orange-400 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            IMPACT & SAFETY
                          </h3>
                          <div className="space-y-2">
                            {incident.casualties && (
                              <InfoRow icon={Users} label="CASUALTIES" value={formatEnhancedField(incident.casualties)} />
                            )}
                            {incident.evacuation_info && (
                              <InfoRow icon={ShieldAlert} label="EVACUATION" value={formatEnhancedField(incident.evacuation_info)} />
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {(incident.emergency_services || incident.weather_conditions) && (
                      <>
                        <Separator className="bg-gray-700" />
                        <div className="space-y-3">
                          <h3 className="font-black text-lg text-blue-400 flex items-center">
                            <Siren className="h-5 w-5 mr-2" />
                            RESPONSE & CONDITIONS
                          </h3>
                          <div className="space-y-2">
                            {incident.emergency_services && (
                              <InfoRow icon={Siren} label="SERVICES" value={formatEnhancedField(incident.emergency_services)} />
                            )}
                            {incident.weather_conditions && (
                              <InfoRow icon={Wind} label="WEATHER" value={formatEnhancedField(incident.weather_conditions)} />
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {incident.damage_assessment && (
                      <>
                        <Separator className="bg-gray-700" />
                        <div className="space-y-3">
                          <h3 className="font-black text-lg text-yellow-400 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            DAMAGE ASSESSMENT
                          </h3>
                          <div className="p-3 bg-gray-800 bg-opacity-50 rounded-lg text-sm text-gray-300">
                            {formatEnhancedField(incident.damage_assessment)}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <Separator className="bg-gray-700" />

                {/* Location Information */}
                <div className="space-y-3">
                  <h3 className="font-black text-lg text-gray-300 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    LOCATION
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoRow icon={MapPin} label="LAT" value={incident.location.lat.toFixed(4)} />
                    <InfoRow icon={MapPin} label="LON" value={incident.location.lon.toFixed(4)} />
                    {incident.location.wilaya_code && (
                      <InfoRow icon={MapPin} label="CODE" value={incident.location.wilaya_code.toString()} />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-black text-lg text-gray-300">DESCRIPTION</h3>
                  <div className="p-3 bg-gray-800 bg-opacity-50 rounded-lg text-sm text-gray-400 max-h-32 overflow-y-auto">
                    {incident.description}
                  </div>
                </div>

                {/* Source */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Source: {incident.source}</span>
                    {incident.link && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(incident.link, '_blank')}
                        className="text-xs border-gray-600 text-gray-400 hover:text-white"
                      >
                        VIEW SOURCE
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};
