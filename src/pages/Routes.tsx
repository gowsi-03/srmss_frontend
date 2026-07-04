import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Map as MapIcon, 
  Compass, 
  ListOrdered, 
  X, 
  Trash2, 
  Route as RouteIcon
} from 'lucide-react';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons not showing in React build environments
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RouteStop {
  id?: string;
  stopName: string;
  sequence: number;
  latitude?: number;
  longitude?: number;
  distanceFromStart?: number;
}

interface Route {
  id: string;
  routeNumber: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  duration: number;
  stops: RouteStop[];
  _count?: {
    stops: number;
    trips: number;
  };
}

const Routes: React.FC = () => {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [routeNumber, setRouteNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Nested stops list inside create form
  const [formStops, setFormStops] = useState<RouteStop[]>([]);
  const [stopNameInput, setStopNameInput] = useState<string>('');
  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');
  const [distFromStartInput, setDistFromStartInput] = useState<string>('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/routes');
      setRoutes(response.data);
      if (response.data.length > 0 && !selectedRoute) {
        // Fetch detailed stops for first route
        handleSelectRoute(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync routes registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSelectRoute = async (id: string) => {
    try {
      const response = await apiClient.get(`/routes/${id}`);
      setSelectedRoute(response.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load route stop sequence.');
    }
  };

  // Add stop to current form list
  const addStopToFormList = () => {
    if (!stopNameInput) return;
    const nextSeq = formStops.length + 1;
    const newStop: RouteStop = {
      stopName: stopNameInput,
      sequence: nextSeq,
      latitude: latInput ? Number(latInput) : undefined,
      longitude: lngInput ? Number(lngInput) : undefined,
      distanceFromStart: distFromStartInput ? Number(distFromStartInput) : undefined,
    };
    setFormStops([...formStops, newStop]);
    // Reset stop input fields
    setStopNameInput('');
    setLatInput('');
    setLngInput('');
    setDistFromStartInput('');
  };

  // Remove stop from form list
  const removeStopFromFormList = (index: number) => {
    const updated = formStops.filter((_, i) => i !== index).map((stop, idx) => ({
      ...stop,
      sequence: idx + 1 // Re-calculate sequence numbers
    }));
    setFormStops(updated);
  };

  // Submit new route
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/routes', {
        routeNumber,
        name,
        startPoint,
        endPoint,
        distance: Number(distance),
        duration: Number(duration),
        stops: formStops,
      });

      setSuccessMsg('Route created successfully with defined stop sequence!');
      setShowCreateModal(false);
      // Reset forms
      setRouteNumber('');
      setName('');
      setStartPoint('');
      setEndPoint('');
      setDistance(0);
      setDuration(0);
      setFormStops([]);
      fetchRoutes();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to create route.');
    }
  };

  // Delete Route
  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this route? This will delete all associated schedules!')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.delete(`/routes/${id}`);
      setSuccessMsg('Route successfully removed.');
      setSelectedRoute(null);
      fetchRoutes();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to remove route.');
    }
  };

  // Extract polyline path coordinates for Leaflet
  const getPolylinePath = (): [number, number][] => {
    if (!selectedRoute || !selectedRoute.stops) return [];
    return selectedRoute.stops
      .filter(s => s.latitude !== undefined && s.longitude !== undefined)
      .map(s => [s.latitude!, s.longitude!]);
  };

  const polylinePath = getPolylinePath();
  const mapCenter: [number, number] = polylinePath.length > 0 ? polylinePath[0] : [6.9271, 79.8612]; // default Colombo coords

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Route & Map Planner</h1>
          <p className="text-sm text-slate-400">Manage transit stops, sequence stations and map layouts</p>
        </div>
        {canModify && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition"
          >
            <Plus size={18} />
            <span>Create Route</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl text-teal-400 text-sm">
          {successMsg}
        </div>
      )}

      {/* Split grid: Route list vs map display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Routes List & Stop Sequence */}
        <div className="lg:col-span-1 space-y-6">
          {/* Route Registry Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center">
              <RouteIcon size={16} className="text-teal-400 mr-2" />
              Active Route Registry
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-500 py-4 text-center">Syncing routes...</p>
              ) : routes.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No routes logged</p>
              ) : (
                routes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => handleSelectRoute(route.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      selectedRoute?.id === route.id
                        ? 'bg-teal-500/10 border-teal-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-extrabold bg-teal-500/15 text-teal-400 border border-teal-500/10">
                        Route {route.routeNumber}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {route._count?.stops || 0} Stations
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200">{route.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center">
                      {route.distance} km • ~{route.duration} mins
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stop Sequence Detail list */}
          {selectedRoute && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center">
                  <ListOrdered size={16} className="text-indigo-400 mr-2" />
                  Stops Timeline
                </h3>
                {canModify && (
                  <button
                    onClick={() => handleDeleteRoute(selectedRoute.id)}
                    className="text-slate-500 hover:text-red-400 transition p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Delete route"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Steps timeline display */}
              <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-4 before:w-0.5 before:bg-slate-800 pl-2 max-h-[300px] overflow-y-auto">
                {selectedRoute.stops && selectedRoute.stops.length > 0 ? (
                  selectedRoute.stops.map((stop, index) => (
                    <div key={stop.id || index} className="flex items-start space-x-3.5 relative">
                      {/* Indicator point */}
                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        index === 0 ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' :
                        index === selectedRoute.stops.length - 1 ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' :
                        'bg-slate-950 border-slate-800 text-slate-300'
                      }`}>
                        {stop.sequence}
                      </span>
                      <div className="pt-1.5">
                        <h4 className="text-xs font-semibold text-slate-200">{stop.stopName}</h4>
                        {stop.distanceFromStart !== undefined && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {stop.distanceFromStart} km from start point
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 pl-4 py-2 italic">No stations logged for this route line.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Leaflet Map Viewer */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[500px]">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center">
              <MapIcon size={16} className="text-indigo-400 mr-2" />
              Depot Route Stops Overlay
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedRoute ? `Viewing mapping route trace for line: ${selectedRoute.name}` : 'Select a route to display map coordinates'}
            </p>
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl relative overflow-hidden h-[400px]">
            {polylinePath.length > 0 ? (
              <MapContainer 
                center={mapCenter} 
                zoom={11} 
                className="w-full h-full"
                key={selectedRoute?.id} // Forces re-render on route selection
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {selectedRoute?.stops
                  .filter(s => s.latitude !== undefined && s.longitude !== undefined)
                  .map((stop, idx) => (
                    <Marker key={stop.id || idx} position={[stop.latitude!, stop.longitude!]}>
                      <Popup>
                        <div className="text-xs text-slate-900 font-semibold p-1">
                          <p className="text-teal-600 font-bold">Seq {stop.sequence}: {stop.stopName}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{stop.distanceFromStart} km from origin</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                <Polyline positions={polylinePath} color="#0d9488" weight={3} opacity={0.8} />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm space-y-2.5 p-6 text-center">
                <Compass size={40} className="text-slate-700 animate-spin-slow" />
                <span>No geo-coordinates found for this route. Add coordinates to display stops sequence.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE ROUTE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-zoomIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Construct Route Stop Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Route Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Route Number</label>
                  <input
                    type="text"
                    required
                    value={routeNumber}
                    onChange={(e) => setRouteNumber(e.target.value)}
                    placeholder="E.g., 138"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Route Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Colombo - Maharagama"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Terminus</label>
                  <input
                    type="text"
                    required
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    placeholder="Pettah"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Terminus</label>
                  <input
                    type="text"
                    required
                    value={endPoint}
                    onChange={(e) => setEndPoint(e.target.value)}
                    placeholder="Maharagama"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimated Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Stop Sequencer Form Section */}
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center">
                  <ListOrdered size={14} className="text-indigo-400 mr-2" />
                  Define Stations Stop Sequence
                </h4>

                {/* Adding stop row inputs */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Stop Name (e.g. Nugegoda)"
                      value={stopNameInput}
                      onChange={(e) => setStopNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude (e.g. 6.874)"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude (e.g. 79.89)"
                      value={lngInput}
                      onChange={(e) => setLngInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Distance"
                      value={distFromStartInput}
                      onChange={(e) => setDistFromStartInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={addStopToFormList}
                      className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Form stops list display */}
                <div className="mt-3 space-y-1.5 max-h-[150px] overflow-y-auto">
                  {formStops.map((stop, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/20 px-4 py-2 border border-slate-850 rounded-xl text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-teal-400">#{stop.sequence}</span>
                        <span className="font-medium text-slate-200">{stop.stopName}</span>
                        {stop.latitude && (
                          <span className="text-[10px] text-slate-500">({stop.latitude}, {stop.longitude})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {stop.distanceFromStart !== undefined && (
                          <span className="text-[10px] text-slate-400">{stop.distanceFromStart} km</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStopFromFormList(idx)}
                          className="text-slate-500 hover:text-red-400 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Publish Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;
