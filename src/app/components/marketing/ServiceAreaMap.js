'use client';

import { useEffect, useState } from 'react';

// Accurate Zuid-Limburg boundary polygon
const serviceAreaCoords = [
    [51.12, 5.68],  // North-west
    [51.12, 6.02],  // North
    [51.08, 6.12],  // North-east
    [50.98, 6.22],  // East (near Kerkrade)
    [50.88, 6.08],  // East (near Heerlen)
    [50.76, 6.02],  // South-east (near Vaals)
    [50.75, 5.92],  // South
    [50.78, 5.70],  // South-west (near Maastricht)
    [50.84, 5.64],  // West
    [50.92, 5.62],  // West
    [51.02, 5.64],  // North-west
    [51.12, 5.68],  // Close polygon
];

export default function ServiceAreaMap() {
    const [MapComponent, setMapComponent] = useState(null);

    useEffect(() => {
        // Dynamically import Leaflet components (client-side only)
        const loadMap = async () => {
            const { MapContainer, TileLayer, Polygon } = await import('react-leaflet');

            // Create the Map component
            const Map = () => (
                <MapContainer
                    center={[50.92, 5.88]}
                    zoom={10}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Service area polygon - prominent styling */}
                    <Polygon
                        positions={serviceAreaCoords}
                        pathOptions={{
                            color: '#8aab4c',
                            fillColor: '#8aab4c',
                            fillOpacity: 0.35,
                            weight: 4,
                            dashArray: null,
                        }}
                    />
                </MapContainer>
            );

            setMapComponent(() => Map);
        };

        loadMap();
    }, []);

    if (!MapComponent) {
        return (
            <div className="h-[400px] lg:h-[500px] bg-[#111827] rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#8aab4c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70 text-sm">Kaart laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[400px] lg:h-[500px] relative rounded-xl overflow-hidden shadow-lg">
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
                integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
                crossOrigin="anonymous"
            />
            <MapComponent />

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md z-[1000]">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded bg-[#8aab4c]/40 border-2 border-[#8aab4c]"></div>
                    <span className="text-[#111827] font-medium">Ons werkgebied</span>
                </div>
            </div>
        </div>
    );
}
