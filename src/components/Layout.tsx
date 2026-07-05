import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map, 
  Flame, 
  Users2, 
  FileText, 
  LogOut, 
  Bus, 
  User as UserIcon
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { to: '/schedules', name: 'Timetables', icon: <CalendarDays size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { to: '/routes', name: 'Route Stops', icon: <Map size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { to: '/logs', name: 'Fuel & Service', icon: <Flame size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { to: '/fleet', name: 'Depot Fleet', icon: <Users2 size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'] },
    { to: '/reports', name: 'Reports Hub', icon: <FileText size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center space-x-3">
            <span className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
              <Bus size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">SRMSS</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              // Hide links if user does not have permission
              if (user && !item.roles.includes(user.role)) return null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 mb-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-full">
              <UserIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name}</h4>
              <span className="inline-block text-[10px] font-bold text-teal-400 bg-teal-400/5 px-2 py-0.5 rounded border border-teal-400/10">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Depot Management System</span>
          </div>

          {/* User Status banner */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Active Service Status</p>
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">Synchronized</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet Views */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
