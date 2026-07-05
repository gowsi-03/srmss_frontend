import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  ShieldCheck, 
  Map, 
  CalendarDays, 
  Flame, 
  ArrowRight,
  Clipboard,
  Check
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const credentials = [
    {
      role: 'System Administrator',
      email: 'admin@srmss.com',
      pass: 'admin123',
      desc: 'Full system privileges: full database deletion capabilities, route creations, and sustainability reports audits.',
      color: 'border-red-500/20 text-red-400 bg-red-500/5'
    },
    {
      role: 'Logistics Supervisor',
      email: 'supervisor@srmss.com',
      pass: 'super123',
      desc: 'Depot manager: create/edit driver profiles, vehicles, schedule route maps, fuel fills, and servicing records.',
      color: 'border-teal-500/20 text-teal-400 bg-teal-500/5'
    },
    {
      role: 'Depot Operator',
      email: 'operator@srmss.com',
      pass: 'oper123',
      desc: 'Operational desk clerk: read-only access to timetables, vehicles, routes, and active delay charts.',
      color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-teal-500/20">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
              <Bus size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">SRMSS</span>
          </div>
          <button 
            onClick={handleStart}
            className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Access Portal'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-grow flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold tracking-wider uppercase rounded-full">
            Depot Management & Scheduling Suite
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Digitalizing Transit Operations <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              With Precision Logistics
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            The Smart Route Management and Scheduling System (SRMSS) coordinates fleet assets, prevents schedule conflicts, visualizes route stop sequences, logs odometer-bound fuel usage, and analyzes sustainability output.
          </p>
          <div className="pt-2">
            <button 
              onClick={handleStart}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/20 hover:shadow-teal-900/30 transition cursor-pointer group"
            >
              <span>{isAuthenticated ? 'Enter Dashboard' : 'Access Operations Portal'}</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">
          <div className="p-6 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl transition space-y-4">
            <span className="inline-block p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <CalendarDays size={20} />
            </span>
            <h3 className="font-bold text-white text-sm">Timetable Scheduling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan daily trips and automatically block overlaps. The system detects conflicts when a driver or vehicle is assigned to conflicting timeframes.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl transition space-y-4">
            <span className="inline-block p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Map size={20} />
            </span>
            <h3 className="font-bold text-white text-sm">Route Maps Overlay</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sequence intermediate stations sequentially. Renders route paths as interactive polylines on map view markers for operational dispatchers.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl transition space-y-4">
            <span className="inline-block p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <ShieldCheck size={20} />
            </span>
            <h3 className="font-bold text-white text-sm">Fleet Registry CRUD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Searchable database registry for active drivers and buses. Restricts authorization access according to system roles.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl transition space-y-4">
            <span className="inline-block p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Flame size={20} />
            </span>
            <h3 className="font-bold text-white text-sm">Eco-Sustainability Hub</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculate fuel efficiency (L/km) and carbon footprints (CO2 emissions in kg) and download secure, authenticated PDF reports.
            </p>
          </div>
        </section>

        {/* Demo Credentials Guide */}
        <section className="mt-20 border border-slate-900 bg-slate-900/20 p-8 rounded-3xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Interactive Tour & Credentials Guide</h2>
            <p className="text-xs text-slate-400">
              Select one of the pre-configured system roles below to log in and test specific features. Click the copy buttons to copy the credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {credentials.map((cred, idx) => (
              <div 
                key={idx} 
                className={`p-6 border rounded-2xl flex flex-col justify-between space-y-4 transition hover:-translate-y-0.5 duration-200 ${cred.color}`}
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">{cred.role}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{cred.desc}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  {/* Email row */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Email:</span>
                    <span className="text-[10px] font-mono text-slate-300 font-semibold">{cred.email}</span>
                    <button 
                      onClick={() => copyToClipboard(cred.email, `${cred.role}-email`)}
                      className="p-1 hover:bg-slate-800 rounded transition cursor-pointer text-slate-500 hover:text-slate-300"
                    >
                      {copiedText === `${cred.role}-email` ? <Check size={12} className="text-teal-400" /> : <Clipboard size={12} />}
                    </button>
                  </div>

                  {/* Password row */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Password:</span>
                    <span className="text-[10px] font-mono text-slate-300 font-semibold">{cred.pass}</span>
                    <button 
                      onClick={() => copyToClipboard(cred.pass, `${cred.role}-pass`)}
                      className="p-1 hover:bg-slate-800 rounded transition cursor-pointer text-slate-500 hover:text-slate-300"
                    >
                      {copiedText === `${cred.role}-pass` ? <Check size={12} className="text-teal-400" /> : <Clipboard size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[10px] text-slate-500 bg-slate-950">
        <p>© 2026 Smart Route Management and Scheduling System (SRMSS). All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
