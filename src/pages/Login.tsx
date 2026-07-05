import React, { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Bus } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await register(email, password, name, role);
        setSuccessMsg('Account registered successfully! Please log in.');
        setIsLogin(true);
        // Clear registration fields
        setName('');
        setRole('OPERATOR');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'An error occurred. Please check your credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden px-4">
      {/* Background Decorative Neon Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-0 h-0 sm:w-96 sm:h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-0 h-0 sm:w-96 sm:h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="mb-8 flex items-center space-x-3 z-10">
        <div className="p-3 bg-teal-500/15 border border-teal-500/30 rounded-2xl text-teal-400">
          <Bus size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SRMSS</h1>
          <p className="text-xs text-slate-400">Smart Route Management & Scheduling</p>
        </div>
      </div>

      {/* Card container */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 relative">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          {isLogin ? 'Welcome Back' : 'Create Depot Account'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isLogin ? 'Sign in to access your dashboard' : 'Register a new operator profile'}
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl text-teal-400 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Role</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Shield size={18} />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  >
                    <option value="OPERATOR">Operator (Depot Clerk)</option>
                    <option value="SUPERVISOR">Supervisor (Logistics Officer)</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@srmss.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-slate-50 font-semibold text-sm rounded-xl transition shadow-lg hover:shadow-teal-500/10 cursor-pointer"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        {/* Form Toggle Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? (
            <span>
              Need a new account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-teal-400 hover:text-teal-300 font-semibold focus:outline-none cursor-pointer"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-teal-400 hover:text-teal-300 font-semibold focus:outline-none cursor-pointer"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
