import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../context/DataContext';
import { Card, StatusBadge } from '../components/ui/Common';
import L from 'leaflet';
import { Battery, Thermometer, Gauge, AlertTriangle, MapPin } from 'lucide-react';

// Fix for default Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const FleetMap = () => {
  const { machines, sites } = useData();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  // Mock Coordinates for Demo (In real app, join with Telemetry table)
  const getMockPosition = (baseLat: number, baseLng: number, index: number) => {
      return [baseLat + (index * 0.005), baseLng + (index * 0.005)];
  };

  const centerPos: [number, number] = [17.45, 78.32]; // Hyderabad default

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col md:flex-row gap-4">
      <Card className="flex-1 overflow-hidden p-0 relative border-0 shadow-lg z-0">
        <MapContainer center={centerPos} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Sites Geofences */}
            {sites.map(site => (
                site.geo_center_lat && (
                    <Circle 
                        key={site.id}
                        center={[site.geo_center_lat, site.geo_center_lng!]}
                        radius={site.geo_radius_meters || 500}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    >
                        <Popup>
                            <strong>{site.name}</strong><br/>
                            Status: {site.status}
                        </Popup>
                    </Circle>
                )
            ))}

            {/* Machines */}
            {machines.map((machine, idx) => {
                // Fallback coordinates if no telemetry
                const pos = getMockPosition(17.45, 78.32, idx); 
                return (
                    <Marker key={machine.id} position={pos as [number, number]} eventHandlers={{
                        click: () => setSelectedMachine(machine.id),
                    }}>
                        <Popup>
                            <div className="font-bold">{machine.code}</div>
                            <div>{machine.type}</div>
                            <StatusBadge status={machine.status} />
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
        
        {/* Overlay Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-[400] text-xs">
            <h4 className="font-bold mb-2">Live Status</h4>
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Working</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Idle</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Breakdown</div>
        </div>
      </Card>

      {/* Detail Sidebar */}
      {selectedMachine && (
         <Card className="w-full md:w-80 p-4 animate-in slide-in-from-right">
             {(() => {
                 const m = machines.find(mac => mac.id === selectedMachine);
                 if (!m) return null;
                 return (
                     <div className="space-y-4">
                         <div className="flex justify-between items-start">
                             <div>
                                 <h2 className="text-xl font-bold">{m.code}</h2>
                                 <p className="text-sm text-slate-500">{m.make} {m.model}</p>
                             </div>
                             <StatusBadge status={m.status} />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3 py-2">
                             <div className="bg-slate-50 p-2 rounded border">
                                <div className="text-xs text-slate-500 flex items-center gap-1"><Gauge size={12}/> Speed</div>
                                <div className="font-bold text-lg">0 km/h</div>
                             </div>
                             <div className="bg-slate-50 p-2 rounded border">
                                <div className="text-xs text-slate-500 flex items-center gap-1"><Battery size={12}/> Fuel</div>
                                <div className="font-bold text-lg">45%</div>
                             </div>
                             <div className="bg-slate-50 p-2 rounded border">
                                <div className="text-xs text-slate-500 flex items-center gap-1"><Thermometer size={12}/> Engine</div>
                                <div className="font-bold text-lg">85°C</div>
                             </div>
                             <div className="bg-slate-50 p-2 rounded border">
                                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> Geofence</div>
                                <div className="font-bold text-lg text-green-600">Inside</div>
                             </div>
                         </div>

                         {/* Fuel Integrity Mock */}
                         <div className="border-t pt-4">
                             <h4 className="font-bold text-sm mb-2">Fuel Integrity Check</h4>
                             <div className="flex items-center gap-2 text-xs bg-green-50 text-green-800 p-2 rounded border border-green-200">
                                 <AlertTriangle size={14} /> No anomalies detected in last 24h.
                             </div>
                         </div>
                         
                         <button onClick={() => setSelectedMachine(null)} className="text-xs text-slate-400 underline w-full text-center mt-4">Close Details</button>
                     </div>
                 );
             })()}
         </Card>
      )}
    </div>
  );
};
