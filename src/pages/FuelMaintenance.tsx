import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Wrench, 
  Plus, 
  Bus, 
  AlertTriangle, 
  Check, 
  X
} from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNumber: string;
  mileage: number;
}

interface FuelLog {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  date: string;
  fuelAmount: number;
  cost: number;
  odometerReading: number;
}

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE';
  description: string;
  cost: number;
  loggedDate: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

const FuelMaintenance: React.FC = () => {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  // Toggle fuel vs maintenance tab
  const [activeTab, setActiveTab] = useState<'fuel' | 'maintenance'>('fuel');

  // Logs Lists
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Search/Filters
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');

  // Modals & Form states
  const [showFuelModal, setShowFuelModal] = useState<boolean>(false);
  const [showMaintModal, setShowMaintModal] = useState<boolean>(false);

  // Fuel Form inputs
  const [vehicleId, setVehicleId] = useState<string>('');
  const [fuelDate, setFuelDate] = useState<string>('');
  const [fuelAmount, setFuelAmount] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [odometerReading, setOdometerReading] = useState<number>(0);

  // Maintenance Form inputs
  const [maintVehicleId, setMaintVehicleId] = useState<string>('');
  const [maintType, setMaintType] = useState<'ROUTINE' | 'CORRECTIVE'>('ROUTINE');
  const [maintDesc, setMaintDesc] = useState<string>('');
  const [maintCost, setMaintCost] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch functions
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [fuelRes, maintRes, vehiclesRes] = await Promise.all([
        apiClient.get('/fuel-logs', { params: { vehicleId: selectedVehicleFilter || undefined } }),
        apiClient.get('/maintenance-logs', { params: { vehicleId: selectedVehicleFilter || undefined } }),
        apiClient.get('/vehicles'),
      ]);

      setFuelLogs(fuelRes.data);
      setMaintenanceLogs(maintRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync fuel and maintenance logs database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedVehicleFilter]);

  // Handle Fuel Form Submission (including boundary checks!)
  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Check Odometer boundary check
    const selectedBus = vehicles.find(v => v.id === vehicleId);
    if (selectedBus && odometerReading < selectedBus.mileage) {
      setErrorMsg(
        `Odometer Boundary Error: Odometer reading (${odometerReading} km) cannot be less than the current bus mileage (${selectedBus.mileage} km).`
      );
      return;
    }

    try {
      await apiClient.post('/fuel-logs', {
        vehicleId,
        date: new Date(fuelDate).toISOString(),
        fuelAmount: Number(fuelAmount),
        cost: Number(fuelCost),
        odometerReading: Number(odometerReading),
      });

      setSuccessMsg('Fuel fill purchase successfully logged!');
      setShowFuelModal(false);
      // Reset inputs
      setVehicleId('');
      setFuelDate('');
      setFuelAmount(0);
      setFuelCost(0);
      setOdometerReading(0);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit fuel log.');
    }
  };

  // Handle Maintenance Form Submission
  const handleAddMaintLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/maintenance-logs', {
        vehicleId: maintVehicleId,
        maintenanceType: maintType,
        description: maintDesc,
        cost: Number(maintCost),
        scheduledDate: new Date(scheduledDate).toISOString(),
      });

      setSuccessMsg('Maintenance service logged successfully!');
      setShowMaintModal(false);
      setMaintVehicleId('');
      setMaintDesc('');
      setMaintCost(0);
      setScheduledDate('');
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit maintenance log.');
    }
  };

  // Toggle Maintenance completed status
  const handleToggleComplete = async (id: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') return;
    if (!window.confirm('Mark this maintenance activity as COMPLETED?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.put(`/maintenance-logs/${id}`, {
        status: 'COMPLETED',
        completedDate: new Date().toISOString(),
      });
      setSuccessMsg('Maintenance activity marked completed. Vehicle returned to fleet!');
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to complete maintenance.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fuel & Servicing Logs</h1>
          <p className="text-sm text-slate-400">Track fuel consumption efficiency & fleet servicing schedules</p>
        </div>
        {canModify && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFuelModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer transition"
            >
              <Plus size={16} />
              <span>Log Fuel</span>
            </button>
            <button
              onClick={() => setShowMaintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer transition"
            >
              <Plus size={16} />
              <span>Log Service</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center space-x-3">
          <AlertTriangle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl text-teal-400 text-sm flex items-center space-x-3">
          <Check size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Menu & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Toggle tabs */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'fuel'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame size={14} />
            <span>Fuel Consumption logs</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench size={14} />
            <span>Maintenance servicing</span>
          </button>
        </div>

        {/* Vehicle filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Filter Bus:</span>
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Fleet Buses</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registrationNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB CONTENT: FUEL LOGS */}
      {activeTab === 'fuel' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Bus plate</th>
                  <th className="py-4 px-6">Date logged</th>
                  <th className="py-4 px-6">Odometer Reading</th>
                  <th className="py-4 px-6">Fuel Liters</th>
                  <th className="py-4 px-6">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Syncing Fuel Database...</td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No fuel logs logged</td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/30 transition text-sm">
                      <td className="py-4 px-6 text-slate-200 font-semibold font-mono">
                        <div className="flex items-center space-x-2">
                          <Bus size={14} className="text-slate-500" />
                          <span>{log.vehicle.registrationNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {log.odometerReading.toLocaleString()} km
                      </td>
                      <td className="py-4 px-6 text-teal-400 font-bold">
                        {log.fuelAmount} L
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        LKR {log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB CONTENT: MAINTENANCE LOGS */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Bus plate</th>
                  <th className="py-4 px-6">Service Type</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Servicing Dates</th>
                  <th className="py-4 px-6">Total Cost</th>
                  <th className="py-4 px-6">Status</th>
                  {canModify && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">Syncing Servicing Database...</td>
                  </tr>
                ) : maintenanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">No maintenance log entries logged</td>
                  </tr>
                ) : (
                  maintenanceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/30 transition text-sm">
                      <td className="py-4 px-6 text-slate-200 font-semibold font-mono">
                        <div className="flex items-center space-x-2">
                          <Bus size={14} className="text-slate-500" />
                          <span>{log.vehicle.registrationNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          log.maintenanceType === 'CORRECTIVE' ? 'bg-red-500/15 text-red-400 border border-red-500/10' : 'bg-blue-500/15 text-blue-400 border border-blue-500/10'
                        }`}>
                          {log.maintenanceType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 space-y-0.5">
                        <p>Sched: {new Date(log.scheduledDate).toLocaleDateString()}</p>
                        {log.completedDate && (
                          <p className="text-emerald-400">Done: {new Date(log.completedDate).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        LKR {log.cost.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          log.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          log.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/10 animate-pulse'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-4 px-6 text-right">
                          {log.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleToggleComplete(log.id, log.status)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FUEL LOG MODAL */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Log Fuel Purchase</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFuelLog} className="p-6 space-y-4">
              {/* Select Bus */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Bus</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Choose vehicle plate...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} (Mileage: {v.mileage} km)</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchase Date</label>
                <input
                  type="date"
                  required
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Liters */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fuel Amount (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={fuelAmount || ''}
                    onChange={(e) => setFuelAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                {/* Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cost (LKR)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={fuelCost || ''}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Odometer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Odometer Reading (km)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={odometerReading || ''}
                  onChange={(e) => setOdometerReading(Number(e.target.value))}
                  placeholder="Must be larger than current mileage"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Save Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE LOG MODAL */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Schedule Fleet Servicing</h3>
              <button onClick={() => setShowMaintModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMaintLog} className="p-6 space-y-4">
              {/* Select Bus */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Bus</label>
                <select
                  required
                  value={maintVehicleId}
                  onChange={(e) => setMaintVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose vehicle plate...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Servicing Category</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="maintType"
                      checked={maintType === 'ROUTINE'}
                      onChange={() => setMaintType('ROUTINE')}
                      className="accent-indigo-500"
                    />
                    <span>Routine Maintenance</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="maintType"
                      checked={maintType === 'CORRECTIVE'}
                      onChange={() => setMaintType('CORRECTIVE')}
                      className="accent-indigo-500"
                    />
                    <span>Corrective Repair</span>
                  </label>
                </div>
              </div>

              {/* Cost & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimated Cost</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={maintCost || ''}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Description</label>
                <textarea
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Engine tuneup, filter updates, or gearbox repair..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 h-20"
                ></textarea>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Save Service Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelMaintenance;
