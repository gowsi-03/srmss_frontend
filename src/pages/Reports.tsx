import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface RoutePerformance {
  routeNumber: string;
  name: string;
  total: number;
  completed: number;
  delayed: number;
  avgDelayMinutes: number;
  completionRate: number;
}

interface VehicleEfficiency {
  registrationNumber: string;
  totalLiters: number;
  totalCost: number;
  kmDriven: number;
  litersPerKm: number;
}

interface PerformanceData {
  totalTrips: number;
  completedTrips: number;
  delayedTrips: number;
  cancelledTrips: number;
  completionRate: number;
  delayRate: number;
  avgDelayMinutes: number;
  routePerformance: RoutePerformance[];
}

interface SustainabilityData {
  totalFuelLiters: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalCalculatedKm: number;
  avgFuelPricePerLiter: number;
  co2EmissionsKg: number;
  vehicleEfficiencies: VehicleEfficiency[];
}

const Reports: React.FC = () => {
  // Setup default 30-day range
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  const [sustData, setSustData] = useState<SustainabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchReports = async () => {
    if (!startDate || !endDate) return;

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot be after end date.');
      setPerfData(null);
      setSustData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const [perfRes, sustRes] = await Promise.all([
        apiClient.get('/reports/performance', {
          params: { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() }
        }),
        apiClient.get('/reports/sustainability', {
          params: { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() }
        }),
      ]);

      setPerfData(perfRes.data);
      setSustData(sustRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to aggregate analytics database. Check backend status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleDownloadPdf = () => {
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }
    const startIso = new Date(startDate).toISOString();
    const endIso = new Date(endDate).toISOString();
    
    const url = `http://localhost:3000/api/reports/pdf?startDate=${startIso}&endDate=${endIso}`;
    
    triggerSecurePdfDownload(url);
  };

  const triggerSecurePdfDownload = async (url: string) => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `srmss-depot-report-${startDate}-to-${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to generate and download report PDF.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Hub</h1>
          <p className="text-sm text-slate-400">Generate sustainability metrics, fuel efficiencies & delay rates</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition"
        >
          <Download size={18} />
          <span>Export PDF</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Date Selectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Timeframe Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Timeframe End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer"
          />
        </div>
        <div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Update Query
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      {perfData && sustData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Completion Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trip Completion</span>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-extrabold text-slate-100">{perfData.completionRate}%</h3>
            </div>
            <p className="text-[10px] text-slate-500">{perfData.completedTrips} of {perfData.totalTrips} scheduled trips completed</p>
          </div>

          {/* Average Delay */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Delay Duration</span>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-extrabold text-slate-100">{perfData.avgDelayMinutes} mins</h3>
            </div>
            <p className="text-[10px] text-slate-500">{perfData.delayedTrips} delayed log cases flagged</p>
          </div>

          {/* Carbon Footprint */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Carbon Footprint</span>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-extrabold text-emerald-400">
                {(sustData.co2EmissionsKg / 1000).toFixed(2)} Tons
              </h3>
            </div>
            <p className="text-[10px] text-slate-500">Estimated $CO_2$ for {sustData.totalFuelLiters.toLocaleString()} L diesel</p>
          </div>

          {/* Depot Expense */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Depot Costs (Expense)</span>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-extrabold text-slate-100">
                LKR {((sustData.totalFuelCost + sustData.totalMaintenanceCost) / 1000).toFixed(1)}k
              </h3>
            </div>
            <p className="text-[10px] text-slate-500">Fuel: {sustData.totalFuelCost.toLocaleString()} | Service: {sustData.totalMaintenanceCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Grid: Route performance list vs Fuel Economy chart */}
      {perfData && sustData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Route Performance table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Route Performance detail</h3>
              <p className="text-xs text-slate-400 mt-1">Average delay intervals and completion rates per line</p>
            </div>

            <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {perfData.routePerformance.map((rp, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs">
                  <div>
                    <span className="font-mono font-bold text-teal-400 bg-teal-400/5 px-2 py-0.5 rounded border border-teal-400/10 mr-2">
                      {rp.routeNumber}
                    </span>
                    <span className="font-semibold text-slate-200">{rp.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-slate-500 text-[10px]">Completion</p>
                      <p className="font-bold text-slate-350">{rp.completionRate}%</p>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-4">
                      <p className="text-slate-500 text-[10px]">Avg Delay</p>
                      <p className="font-bold text-amber-500">{rp.avgDelayMinutes} mins</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fuel Efficiency Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Fuel Economy by Vehicle</h3>
              <p className="text-xs text-slate-400 mt-1">Liters consumed per kilometer ($L/km$) - lower is more efficient</p>
            </div>

            <div className="h-48 mt-4">
              {sustData.vehicleEfficiencies.filter(v => v.kmDriven > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sustData.vehicleEfficiencies.filter(v => v.kmDriven > 0)}>
                    <XAxis dataKey="registrationNumber" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'L/km', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc', fontSize: 11 }} />
                    <Bar dataKey="litersPerKm" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                  Not enough odometer progression logs to calculate economy. Add odometer updates inside fuel logs.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
