import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { 
  Bus, 
  Users, 
  Compass, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardData {
  overview: {
    totalRoutes: number;
    totalVehicles: number;
    availableVehicles: number;
    maintenanceVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    driversScheduledToday: number;
    vehiclesScheduledToday: number;
  };
  todayTrips: {
    total: number;
    breakdown: {
      SCHEDULED: number;
      ON_TIME: number;
      DELAYED: number;
      COMPLETED: number;
      CANCELLED: number;
    };
  };
  utilization: {
    vehicleUtilizationRate: number;
    driverUtilizationRate: number;
    fleetCapacityUtilization: number;
    totalTravelHoursToday: number;
  };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard/summary');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Could not retrieve dashboard statistics. Ensure the backend is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-500/20 text-red-400 rounded-2xl flex items-center space-x-3">
        <AlertTriangle size={24} />
        <span>{error || 'Error loading dashboard summary.'}</span>
      </div>
    );
  }

  const { overview, todayTrips, utilization } = data;

  // Prepare chart data for today's trip status breakdown
  const chartData = [
    { name: 'Completed', value: todayTrips.breakdown.COMPLETED, color: '#10b981' }, // Emerald-500
    { name: 'On-Time', value: todayTrips.breakdown.ON_TIME, color: '#06b6d4' },      // Cyan-500
    { name: 'Delayed', value: todayTrips.breakdown.DELAYED, color: '#f59e0b' },      // Amber-500
    { name: 'Scheduled', value: todayTrips.breakdown.SCHEDULED, color: '#6366f1' },  // Indigo-500
    { name: 'Cancelled', value: todayTrips.breakdown.CANCELLED, color: '#ef4444' },  // Red-500
  ].filter(item => item.value > 0); // Only display states with active trips

  // Fallback if there are no trips today
  const hasTripsToday = todayTrips.total > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Depot Overview</h1>
        <p className="text-sm text-slate-400">Real-time status controls & operational metrics</p>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Routes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Routes</span>
            <h3 className="text-3xl font-extrabold text-slate-100">{overview.totalRoutes}</h3>
          </div>
          <div className="p-3.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/10">
            <Compass size={24} />
          </div>
        </div>

        {/* Fleet capacity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Buses (Fleet)</span>
            <h3 className="text-3xl font-extrabold text-slate-100">{overview.totalVehicles}</h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="text-emerald-400">{overview.availableVehicles} Active</span>
              <span>•</span>
              <span className="text-amber-500">{overview.maintenanceVehicles} Service</span>
            </div>
          </div>
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/10">
            <Bus size={24} />
          </div>
        </div>

        {/* Active Drivers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Drivers</span>
            <h3 className="text-3xl font-extrabold text-slate-100">{overview.totalDrivers}</h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="text-emerald-400">{overview.activeDrivers} Ready</span>
              <span>•</span>
              <span>{overview.totalDrivers - overview.activeDrivers} Leave/Inactive</span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/10">
            <Users size={24} />
          </div>
        </div>

        {/* Trips Scheduled Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trips Today</span>
            <h3 className="text-3xl font-extrabold text-slate-100">{todayTrips.total}</h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="text-amber-500">{todayTrips.breakdown.DELAYED} Delayed</span>
              <span>•</span>
              <span className="text-emerald-400">{todayTrips.breakdown.COMPLETED} Done</span>
            </div>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/10">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Grid: Charts & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Utilization Rates */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Operational Utilization</h3>
            <p className="text-xs text-slate-400 mb-6">Today's resource deployment efficiency</p>
          </div>

          <div className="space-y-5">
            {/* Vehicle Utilization Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Vehicle Utilization Rate</span>
                <span className="text-teal-400 font-bold">{utilization.vehicleUtilizationRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${utilization.vehicleUtilizationRate}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500">
                {overview.vehiclesScheduledToday} of {overview.totalVehicles} buses scheduled today
              </p>
            </div>

            {/* Driver Utilization Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Driver Utilization Rate</span>
                <span className="text-indigo-400 font-bold">{utilization.driverUtilizationRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${utilization.driverUtilizationRate}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500">
                {overview.driversScheduledToday} of {overview.totalDrivers} drivers active today
              </p>
            </div>

            {/* Fleet Capacity Utilization */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Fleet Capacity Utilization</span>
                <span className="text-amber-400 font-bold">{utilization.fleetCapacityUtilization}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${utilization.fleetCapacityUtilization}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500">
                {utilization.totalTravelHoursToday} cumulative active travel hours out of {overview.totalVehicles * 24} hours available
              </p>
            </div>
          </div>
        </div>

        {/* Today's Trips Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Today's Timetable Status</h3>
            <p className="text-xs text-slate-400 mb-4">Trip execution breakdown for the current day</p>
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-center justify-around">
            {hasTripsToday ? (
              <>
                {/* Recharts Pie Chart representation */}
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-100">{todayTrips.total}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Trips</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full md:w-64 space-y-2 mt-4 md:mt-0">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/20 border border-slate-800/40">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
                <Clock size={36} className="text-slate-600" />
                <span>No trips scheduled for today</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Status Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Running status widget */}
        <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-start space-x-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">On-Time Operations</h4>
            <p className="text-xs text-slate-400 mt-1">
              Active routes show stable departure timelines without critical queue backups.
            </p>
          </div>
        </div>

        {/* Delayed Status alerts */}
        <div className="p-5 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-start space-x-4">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Logged Delays</h4>
            <p className="text-xs text-slate-400 mt-1">
              There are {todayTrips.breakdown.DELAYED} delayed departures on expressive lines due to peak highway traffic conditions.
            </p>
          </div>
        </div>

        {/* Maintenance checklist */}
        <div className="p-5 bg-blue-950/20 border border-blue-500/20 rounded-2xl flex items-start space-x-4">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Servicing Alert</h4>
            <p className="text-xs text-slate-400 mt-1">
              {overview.maintenanceVehicles} buses are undergoing corrective or routine maintenance at the workshop today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
