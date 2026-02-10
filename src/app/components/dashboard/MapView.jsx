'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

// Dynamic import to avoid SSR issues with Leaflet
let MapContainer;
let TileLayer;
let Marker;
let Popup;
let Polyline;

export default function MapView({ leads, routePath = [], routeStats = null }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([rl, L]) => {
      MapContainer = rl.MapContainer;
      TileLayer = rl.TileLayer;
      Marker = rl.Marker;
      Popup = rl.Popup;
      Polyline = rl.Polyline;

      // Fix Leaflet default marker icon
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setLoaded(true);
    });
  }, []);

  const geoLeads = useMemo(
    () => (leads || []).filter((lead) => Number.isFinite(Number(lead.lat)) && Number.isFinite(Number(lead.lng))),
    [leads]
  );

  const path = useMemo(() => {
    if (Array.isArray(routePath) && routePath.length > 1) {
      return routePath.map(([lat, lng]) => [Number(lat), Number(lng)]);
    }

    return geoLeads.map((lead) => [Number(lead.lat), Number(lead.lng)]);
  }, [geoLeads, routePath]);

  if (!loaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Kaart laden...</CardContent>
      </Card>
    );
  }

  if (geoLeads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Geen leads met locatiegegevens
        </CardContent>
      </Card>
    );
  }

  const center = path[0] || [50.8853, 5.9721];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Kaart</CardTitle>
        {routeStats && (
          <p className="text-xs text-muted-foreground">
            {routeStats.totalDistanceKm} km • ~{routeStats.totalDurationMin} min rijden
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: '420px' }}>
          <MapContainer
            center={center}
            zoom={11}
            style={{ height: '100%', width: '100%', borderRadius: '0 0 8px 8px' }}
          >
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 4 }} />}
            {geoLeads.map((lead, i) => (
              <Marker key={lead.id} position={[Number(lead.lat), Number(lead.lng)]}>
                <Popup>
                  <strong>
                    {i + 1}. {lead.name}
                  </strong>
                  <br />
                  {lead.plaatsnaam}
                  <br />
                  {lead.inspection_time && `${lead.inspection_time}`}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
