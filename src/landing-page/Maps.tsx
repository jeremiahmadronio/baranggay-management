import { useState} from 'react';
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';


const ugongBoundaryLine = [
    { lat: 14.696788204218795, lng: 121.00312090841649 },
    { lat: 14.68654412070046, lng: 121.00634199547777 },
    { lat: 14.686458458860855, lng: 121.00643454404435 },
    { lat: 14.68263062955287, lng: 121.01123033966294 },
    { lat: 14.684747840256168, lng: 121.01380525584203 },
    { lat: 14.688317991224816, lng: 121.01359067810643 },
    { lat: 14.689874724844572, lng: 121.01298986044681 },
    { lat: 14.691803618405306, lng: 121.01611172765487 },
    { lat: 14.692161660709521, lng: 121.0180375536895 },
    { lat: 14.692187229749885, lng: 121.01820872431377 },
    { lat: 14.691273961369838, lng: 121.01924942139097 },
    { lat: 14.691273961369838, lng: 121.02134154438122 },
    { lat: 14.690568251371179, lng: 121.0214059173963 },
    { lat: 14.691097534086083, lng: 121.02381990549164 },
    { lat: 14.693609014974507, lng: 121.02446363564249 },
    { lat: 14.69801960377367, lng: 121.02029011852076 },
    { lat: 14.702378215817673, lng: 121.01726458681901 },
    { lat: 14.70372729242346, lng: 121.01786540162603 },
    { lat: 14.70704806070807, lng: 121.01880953918058 },
    { lat: 14.707006551416283, lng: 121.01720021380346 },
    { lat: 14.708251826776099, lng: 121.01642773760763 },
    { lat: 14.708998988558083, lng: 121.01692126405662 },
    { lat: 14.7097461477823, lng: 121.01477549688715 },
    { lat: 14.709331059640173, lng: 121.01460383551358 },
    { lat: 14.709476340579728, lng: 121.01224349162716 },
    { lat: 14.708044281382772, lng: 121.01136372708768 },
    { lat: 14.710887636102434, lng: 121.0096041980087 },
    { lat: 14.710825373257105, lng: 121.00913212923142 },
    { lat: 14.707292638327178, lng: 121.0093529020889 },
    { lat: 14.707251129081891, lng: 121.00883791796825 },
    { lat: 14.706296414261788, lng: 121.00881646029654 },
    { lat: 14.706047357535063, lng: 121.00995371689635 },
    { lat: 14.705001764129884, lng: 121.01176079314003 },
    { lat: 14.70181778851066, lng: 121.00826487976848 },
    { lat: 14.700090030371015, lng: 121.00778004506734 },
    { lat: 14.699991300921596, lng: 121.00627450573212 },
    { lat: 14.698757179038257, lng: 121.00609588242116 },
    { lat: 14.6971607692476, lng: 121.00699307932628 },
    { lat: 14.696661770602642, lng: 121.00335159168694 },
];

// Official 3S Center Ugong / Barangay Hall Location
const hallLocation = { lat: 14.694104613804965, lng: 121.00912047946382 };

const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 80px)', 
    minHeight: '500px',
};

const mapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy',
    styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
};

const InfoOverlay = () => (
    <div className="absolute top-24 left-8 z-20 bg-white rounded-xl shadow-lg p-6 max-w-sm border border-blue-200 flex flex-col gap-3" style={{backdropFilter:'blur(6px)'}}>
        <h3 className="font-bold text-blue-900 text-xl mb-2">Barangay Ugong Map Guide</h3>
        <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-0.5 bg-red-600 border-t-2 border-dashed border-red-600" />
            <span className="text-blue-900">Red Dashed: Boundary ng Ugong</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span className="text-blue-900">Marker: 3S Center / Brgy. Hall</span>
        </div>
        <div className="mt-2 text-xs text-blue-900/70 italic">
            💡 Tip: Click "Satellite View" for aerial imagery.
        </div>
    </div>
);

export const Maps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
    const [zoom, setZoom] = useState(15); 


    const [scriptLoaded, setScriptLoaded] = useState(false);
    return (
        <section id="maps" className="relative w-full overflow-hidden bg-slate-100">
            <InfoOverlay />

            <button
                className="absolute top-24 right-8 z-20 bg-white text-blue-900 px-5 py-2 rounded-full shadow-md border border-blue-200 flex items-center gap-2 font-semibold text-sm hover:bg-blue-50 transition-all"
                style={{ minWidth: 140 }}
                onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                aria-label={mapType === 'roadmap' ? 'Switch to Satellite View' : 'Switch to Map View'}
            >
                {mapType === 'roadmap' ? (
                    <>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                        <span>Satellite</span>
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M7 7h10v10H7z"/></svg>
                        <span>Map</span>
                    </>
                )}
            </button>

            <div className="absolute bottom-10 right-6 z-20 flex flex-col gap-3">
                <button
                    className="bg-white text-blue-950 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-slate-50 transition-colors border border-slate-200"
                    onClick={() => setZoom((z) => Math.min(z + 1, 20))}
                >+</button>
                <button
                    className="bg-white text-blue-950 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-slate-50 transition-colors border border-slate-200"
                    onClick={() => setZoom((z) => Math.max(z - 1, 10))}
                >-</button>
            </div>

            <LoadScript googleMapsApiKey={apiKey} onLoad={() => setScriptLoaded(true)} onError={() => setScriptLoaded(false)}>
                {scriptLoaded && (
                    <GoogleMap
                        key={`${mapType}-${zoom}`}
                        mapContainerStyle={mapContainerStyle}
                        center={hallLocation}
                        zoom={zoom}
                        mapTypeId={mapType}
                        options={{ ...mapOptions, mapTypeId: mapType }}
                    >
                        <Polyline
                            path={ugongBoundaryLine}
                            options={{
                                strokeColor: '#FF0000',
                                strokeOpacity: 0,
                                strokeWeight: 2,
                                icons: [
                                    {
                                        icon: {
                                            path: 'M 0,-1 0,1',
                                            strokeOpacity: 1,
                                            scale: 4,
                                            strokeWeight: 3
                                        },
                                        offset: '0',
                                        repeat: '20px'
                                    },
                                ],
                            }}
                        />

                        <Marker
                            position={hallLocation}
                            icon={{
                                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            }}
                            label={{
                                text: 'Barangay Hall',
                                color: '#1E2A5E',
                                fontWeight: 'bold',
                                fontSize: '12px',
                            }}
                        />
                    </GoogleMap>
                )}
            </LoadScript>
        </section>
    );
};

export default Maps;