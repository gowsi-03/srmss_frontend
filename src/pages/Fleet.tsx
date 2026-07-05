import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  Users2, 
  Bus, 
  Plus, 
  Search, 
  X, 
  Trash2,
  Phone,
  Edit3
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseValidity: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  workingHours: number;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  make: string;
  seatingCapacity: number;
  mileage: number;
  serviceType: 'NORMAL' | 'SEMI_LUXURY' | 'LUXURY';
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

const Fleet: React.FC = () => {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');

  // Database lists
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Modals
  const [showDriverModal, setShowDriverModal] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);

  // Edit Modals
  const [showEditDriverModal, setShowEditDriverModal] = useState<boolean>(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState<boolean>(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form inputs (shared between Create and Edit)
  const [driverName, setDriverName] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [licenseValidity, setLicenseValidity] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [driverStatus, setDriverStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'>('ACTIVE');

  const [regNumber, setRegNumber] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [seatingCapacity, setSeatingCapacity] = useState<number>(54);
  const [mileage, setMileage] = useState<number>(0);
  const [serviceType, setServiceType] = useState<'NORMAL' | 'SEMI_LUXURY' | 'LUXURY'>('NORMAL');
  const [vehicleStatus, setVehicleStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'>('ACTIVE');

  // Notification Alerts
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        apiClient.get('/drivers', { params: { search: searchQuery || undefined } }),
        apiClient.get('/vehicles'),
      ]);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync registry database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [searchQuery]);

  // Submit Driver Form (Add)
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/drivers', {
        name: driverName,
        licenseNumber,
        licenseValidity: new Date(licenseValidity).toISOString(),
        phoneNumber,
        status: driverStatus,
      });

      setSuccessMsg('Driver profile successfully registered!');
      setShowDriverModal(false);
      // Reset form
      setDriverName('');
      setLicenseNumber('');
      setLicenseValidity('');
      setPhoneNumber('');
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to register driver.');
    }
  };

  // Open Edit Driver modal
  const openEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverName(driver.name);
    setLicenseNumber(driver.licenseNumber);
    setLicenseValidity(driver.licenseValidity.slice(0, 10)); // Extract YYYY-MM-DD
    setPhoneNumber(driver.phoneNumber);
    setDriverStatus(driver.status);
    setShowEditDriverModal(true);
  };

  // Submit Edit Driver form
  const handleEditDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.put(`/drivers/${selectedDriver.id}`, {
        name: driverName,
        licenseNumber,
        licenseValidity: new Date(licenseValidity).toISOString(),
        phoneNumber,
        status: driverStatus,
      });

      setSuccessMsg('Driver profile updated successfully!');
      setShowEditDriverModal(false);
      setSelectedDriver(null);
      // Reset form fields
      setDriverName('');
      setLicenseNumber('');
      setLicenseValidity('');
      setPhoneNumber('');
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update driver details.');
    }
  };

  // Submit Vehicle Form (Add)
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/vehicles', {
        registrationNumber: regNumber,
        model,
        make,
        seatingCapacity: Number(seatingCapacity),
        mileage: Number(mileage),
        serviceType,
        status: vehicleStatus,
      });

      setSuccessMsg('Vehicle registered successfully into fleet registry!');
      setShowVehicleModal(false);
      // Reset form
      setRegNumber('');
      setModel('');
      setMake('');
      setSeatingCapacity(54);
      setMileage(0);
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to register vehicle.');
    }
  };

  // Open Edit Vehicle modal
  const openEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRegNumber(vehicle.registrationNumber);
    setModel(vehicle.model);
    setMake(vehicle.make);
    setSeatingCapacity(vehicle.seatingCapacity);
    setMileage(vehicle.mileage);
    setServiceType(vehicle.serviceType);
    setVehicleStatus(vehicle.status);
    setShowEditVehicleModal(true);
  };

  // Submit Edit Vehicle form
  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.put(`/vehicles/${selectedVehicle.id}`, {
        registrationNumber: regNumber,
        model,
        make,
        seatingCapacity: Number(seatingCapacity),
        mileage: Number(mileage),
        serviceType,
        status: vehicleStatus,
      });

      setSuccessMsg('Vehicle specifications updated successfully!');
      setShowEditVehicleModal(false);
      setSelectedVehicle(null);
      // Reset form fields
      setRegNumber('');
      setModel('');
      setMake('');
      setSeatingCapacity(54);
      setMileage(0);
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update vehicle details.');
    }
  };

  // Delete Driver (ADMIN ONLY)
  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm('Delete this driver profile permanently?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.delete(`/drivers/${id}`);
      setSuccessMsg('Driver profile successfully removed.');
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to delete driver profile.');
    }
  };

  // Delete Vehicle (ADMIN ONLY)
  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Remove this vehicle permanently from the registry?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.delete(`/vehicles/${id}`);
      setSuccessMsg('Vehicle removed successfully.');
      fetchRegistry();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to remove vehicle.');
    }
  };

  // Filter vehicles on client side based on query
  const filteredVehicles = vehicles.filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Depot Fleet Registry</h1>
          <p className="text-sm text-slate-400">Manage vehicle allocations, drivers licenses, & status records</p>
        </div>
        {canModify && (
          <div>
            {activeTab === 'drivers' ? (
              <button
                onClick={() => {
                  // Clear fields before open
                  setDriverName('');
                  setLicenseNumber('');
                  setLicenseValidity('');
                  setPhoneNumber('');
                  setDriverStatus('ACTIVE');
                  setShowDriverModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition"
              >
                <Plus size={18} />
                <span>Add Driver</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  // Clear fields before open
                  setRegNumber('');
                  setModel('');
                  setMake('');
                  setSeatingCapacity(54);
                  setMileage(0);
                  setServiceType('NORMAL');
                  setVehicleStatus('ACTIVE');
                  setShowVehicleModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition"
              >
                <Plus size={18} />
                <span>Add Vehicle</span>
              </button>
            )}
          </div>
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

      {/* Toggles & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Toggle tabs */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab('drivers'); setSearchQuery(''); }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users2 size={14} />
            <span>Driver Database</span>
          </button>
          <button
            onClick={() => { setActiveTab('vehicles'); setSearchQuery(''); }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bus size={14} />
            <span>Vehicle Database</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'drivers' ? 'Search by name or license...' : 'Search by plate or model...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* DRIVERS TAB PANEL */}
      {activeTab === 'drivers' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Driver Name</th>
                  <th className="py-4 px-6">License Number</th>
                  <th className="py-4 px-6">Validity</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Logged Hours</th>
                  <th className="py-4 px-6">Status</th>
                  {canModify && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">Syncing Drivers Database...</td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-500 text-sm">No drivers registered</td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-850/30 transition text-sm">
                      <td className="py-4 px-6 text-slate-200 font-semibold">{driver.name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono">{driver.licenseNumber}</td>
                      <td className="py-4 px-6 text-slate-300">
                        {new Date(driver.licenseValidity).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{driver.phoneNumber}</td>
                      <td className="py-4 px-6 text-teal-400 font-bold">{driver.workingHours} hrs</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          driver.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          driver.status === 'ON_LEAVE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' :
                          'bg-red-500/10 text-red-400 border-red-500/10'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditDriver(driver)}
                              className="p-1 hover:bg-slate-800 text-slate-405 hover:text-slate-200 rounded transition cursor-pointer"
                              title="Edit profile"
                            >
                              <Edit3 size={16} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteDriver(driver.id)}
                                className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                                title="Delete profile"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
      ) : (
        /* VEHICLES TAB PANEL */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Registration plate</th>
                  <th className="py-4 px-6">Bus Model</th>
                  <th className="py-4 px-6">Maker</th>
                  <th className="py-4 px-6">Capacity</th>
                  <th className="py-4 px-6">Total Mileage</th>
                  <th className="py-4 px-6">Service Type</th>
                  <th className="py-4 px-6">Status</th>
                  {canModify && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={canModify ? 8 : 7} className="py-12 text-center text-slate-500 text-sm">Syncing Fleet Database...</td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={canModify ? 8 : 7} className="py-12 text-center text-slate-500 text-sm">No vehicles registered</td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-850/30 transition text-sm">
                      <td className="py-4 px-6 text-slate-200 font-semibold font-mono">{vehicle.registrationNumber}</td>
                      <td className="py-4 px-6 text-slate-300">{vehicle.model}</td>
                      <td className="py-4 px-6 text-slate-450">{vehicle.make}</td>
                      <td className="py-4 px-6 text-slate-300">{vehicle.seatingCapacity} seats</td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{vehicle.mileage.toLocaleString()} km</td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          vehicle.serviceType === 'LUXURY' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/10' :
                          vehicle.serviceType === 'SEMI_LUXURY' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {vehicle.serviceType}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          vehicle.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          vehicle.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10 animate-pulse' :
                          'bg-red-500/10 text-red-400 border-red-500/10'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditVehicle(vehicle)}
                              className="p-1 hover:bg-slate-800 text-slate-405 hover:text-slate-200 rounded transition cursor-pointer"
                              title="Edit bus"
                            >
                              <Edit3 size={16} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                                title="Remove bus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
      )}

      {/* CREATE DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Register Driver Profile</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Name</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="E.g., Sam Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="B1000001"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Validity</label>
                  <input
                    type="date"
                    required
                    value={licenseValidity}
                    onChange={(e) => setLicenseValidity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+94771234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Status</label>
                <select
                  value={driverStatus}
                  onChange={(e) => setDriverStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="ACTIVE">Active (Duty Ready)</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Add Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {showEditDriverModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Adjust Driver Profile</h3>
              <button onClick={() => setShowEditDriverModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Name</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Validity</label>
                  <input
                    type="date"
                    required
                    value={licenseValidity}
                    onChange={(e) => setLicenseValidity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Status</label>
                <select
                  value={driverStatus}
                  onChange={(e) => setDriverStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="ACTIVE">Active (Duty Ready)</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditDriverModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Add Vehicle to Registry</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registration Number</label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="WP-ND-1001"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bus Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Leyland Bus"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Make / Brand</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Ashok Leyland"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Seating Capacity</label>
                  <input
                    type="number"
                    required
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Initial Mileage (km)</label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SEMI_LUXURY">Semi Luxury</option>
                    <option value="LUXURY">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bus Status</label>
                  <select
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">Active (Available)</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Register Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {showEditVehicleModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Adjust Vehicle Specifications</h3>
              <button onClick={() => setShowEditVehicleModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registration Number</label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bus Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Make / Brand</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Seating Capacity</label>
                  <input
                    type="number"
                    required
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Mileage (km)</label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SEMI_LUXURY">Semi Luxury</option>
                    <option value="LUXURY">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bus Status</label>
                  <select
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">Active (Available)</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditVehicleModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
