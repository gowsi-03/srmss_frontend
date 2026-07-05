import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  AlertCircle, 
  Check, 
  X, 
  Trash2, 
  Edit3,
  Clock, 
  MapPin, 
  User as UserIcon, 
  Bus 
} from 'lucide-react';

interface Route {
  id: string;
  routeNumber: string;
  name: string;
  startPoint: string;
  endPoint: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  status: string;
}

interface Trip {
  id: string;
  routeId: string;
  route: Route;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driver: Driver;
  departureTime: string;
  arrivalTime: string;
  status: 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  delayMinutes: number;
  notes?: string;
}

const Schedules: React.FC = () => {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  // State lists
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Search & Filter State
  const [routeFilter, setRouteFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');

  // Modals & Forms State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Form inputs
  const [routeId, setRouteId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [tripStatus, setTripStatus] = useState<string>('SCHEDULED');
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [actualDepartureTime, setActualDepartureTime] = useState<string>('');
  const [actualArrivalTime, setActualArrivalTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Error/Success Alerts
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Load lists
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, routesRes, driversRes, vehiclesRes] = await Promise.all([
        apiClient.get('/schedules', {
          params: {
            routeId: routeFilter || undefined,
            status: statusFilter || undefined,
            startDate: startDateFilter ? new Date(startDateFilter).toISOString() : undefined,
          }
        }),
        apiClient.get('/routes'),
        apiClient.get('/drivers?status=ACTIVE'),
        apiClient.get('/vehicles?status=ACTIVE'),
      ]);

      setTrips(tripsRes.data);
      setRoutes(routesRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync scheduler tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [routeFilter, statusFilter, startDateFilter]);

  // Create Trip handler
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/schedules', {
        routeId,
        driverId,
        vehicleId,
        departureTime: new Date(departureTime).toISOString(),
        arrivalTime: new Date(arrivalTime).toISOString(),
        notes,
      });

      setSuccessMsg('Trip scheduled successfully!');
      setShowCreateModal(false);
      // Reset form
      setRouteId('');
      setDriverId('');
      setVehicleId('');
      setDepartureTime('');
      setArrivalTime('');
      setNotes('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 
        'Scheduling failed. Check for duplicate timeline conflicts.'
      );
    }
  };

  // Open edit modal
  const openEdit = (trip: Trip) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedTrip(trip);
    setTripStatus(trip.status);
    setDelayMinutes(trip.delayMinutes);
    setNotes(trip.notes || '');
    setActualDepartureTime(trip.actualDepartureTime ? trip.actualDepartureTime.slice(0, 16) : '');
    setActualArrivalTime(trip.actualArrivalTime ? trip.actualArrivalTime.slice(0, 16) : '');
    setShowEditModal(true);
  };

  // Save updates (adjust departure / log delays)
  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.put(`/schedules/${selectedTrip.id}`, {
        status: tripStatus,
        delayMinutes: Number(delayMinutes),
        notes,
        actualDepartureTime: actualDepartureTime ? new Date(actualDepartureTime).toISOString() : undefined,
        actualArrivalTime: actualArrivalTime ? new Date(actualArrivalTime).toISOString() : undefined,
      });

      setSuccessMsg('Timetable adjustments updated successfully!');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to modify schedule.');
    }
  };

  // Remove Trip
  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this scheduled trip?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.delete(`/schedules/${id}`);
      setSuccessMsg('Trip cancelled and removed from timetable.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to remove schedule.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Depot Timetables</h1>
          <p className="text-sm text-slate-400">Schedule departures, adjust delays & manage overlaps</p>
        </div>
        {canModify && (
          <button
            onClick={() => {
              setErrorMsg('');
              setSuccessMsg('');
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition"
          >
            <Plus size={18} />
            <span>Book Trip</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && !showCreateModal && !showEditModal && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center space-x-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl text-teal-400 text-sm flex items-center space-x-3">
          <Check size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Timetable Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Route Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Route</label>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Routes</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ON_TIME">On-Time</option>
            <option value="DELAYED">Delayed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Clear filters */}
        <div className="flex items-end">
          {(routeFilter || statusFilter || startDateFilter) && (
            <button
              onClick={() => { setRouteFilter(''); setStatusFilter(''); setStartDateFilter(''); }}
              className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Timetable Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Route Details</th>
                <th className="py-4 px-6">Assigned Bus</th>
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">Timings</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Delays / Notes</th>
                {canModify && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">
                    Syncing Timetable Database...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">
                    No active trips found matching filters.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-850/30 transition text-sm">
                    {/* Route */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-teal-500/10 text-teal-400 border border-teal-500/15">
                          {trip.route.routeNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">{trip.route.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                            <MapPin size={10} className="mr-1" />
                            {trip.route.startPoint} → {trip.route.endPoint}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Bus size={14} className="text-slate-500" />
                        <span className="font-medium font-mono">{trip.vehicle.registrationNumber}</span>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <UserIcon size={14} className="text-slate-500" />
                        <span>{trip.driver.name}</span>
                      </div>
                    </td>

                    {/* Timings */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5 text-xs">
                        <p className="text-slate-400 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                          Dep: {new Date(trip.departureTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        <p className="text-slate-400 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                          Arr: {new Date(trip.arrivalTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        trip.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                        trip.status === 'ON_TIME' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/10' :
                        trip.status === 'DELAYED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10 animate-pulse' :
                        trip.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/10'
                      }`}>
                        {trip.status}
                      </span>
                    </td>

                    {/* Delays / Notes */}
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {trip.delayMinutes > 0 && (
                        <p className="text-amber-500 font-semibold mb-1 flex items-center">
                          <Clock size={12} className="mr-1" />
                          Delayed +{trip.delayMinutes} mins
                        </p>
                      )}
                      <p className="truncate max-w-xs italic">{trip.notes || 'No log notes'}</p>
                    </td>

                    {/* Action buttons */}
                    {canModify && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEdit(trip)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition"
                            title="Adjust schedule"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition"
                            title="Remove schedule"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Schedule New Depot Trip</h3>
              <button onClick={() => { setErrorMsg(''); setShowCreateModal(false); }} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center space-x-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {/* Select Route */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transit Route</label>
                <select
                  required
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Route Line...</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.routeNumber} - {r.name} ({r.startPoint} to {r.endPoint})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Select Driver */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver</label>
                  <select
                    required
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select Driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Vehicle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bus (Vehicle)</label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select Bus...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Departure Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                  />
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Arrival Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Log Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Morning express route commuter shift"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 h-20"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(''); setShowCreateModal(false); }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Adjust Timetable / Log Actuals</h3>
              <button onClick={() => { setErrorMsg(''); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTrip} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center space-x-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {/* Trip details summary */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                <p><span className="text-slate-500">Route:</span> <span className="font-semibold text-slate-200">{selectedTrip.route.routeNumber} - {selectedTrip.route.name}</span></p>
                <p><span className="text-slate-500">Driver:</span> <span className="text-slate-300">{selectedTrip.driver.name}</span></p>
                <p><span className="text-slate-500">Bus:</span> <span className="font-mono text-slate-300">{selectedTrip.vehicle.registrationNumber}</span></p>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trip Status</label>
                <select
                  value={tripStatus}
                  onChange={(e) => setTripStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ON_TIME">On-Time</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Delay Minutes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delay Time (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Actual Departure Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actual Departure</label>
                  <input
                    type="datetime-local"
                    value={actualDepartureTime}
                    onChange={(e) => setActualDepartureTime(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                  />
                </div>

                {/* Actual Arrival Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actual Arrival</label>
                  <input
                    type="datetime-local"
                    value={actualArrivalTime}
                    onChange={(e) => setActualArrivalTime(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Adjustment Logs</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record delay rationale or operational updates"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 h-20"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(''); setShowEditModal(false); }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Update Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
