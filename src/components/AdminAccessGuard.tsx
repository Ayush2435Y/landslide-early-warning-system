import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthenticatedUser } from '../types';

interface AdminAccessGuardProps {
  featureName: string;
  featureDescription?: string;
  onAuthenticateSuccess: (user: AuthenticatedUser) => void;
  onReturnToCitizenDashboard: () => void;
  onShowToast: (message: string) => void;
}

export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({
  featureName,
  featureDescription,
  onAuthenticateSuccess,
  onReturnToCitizenDashboard,
  onShowToast,
}) => {
  const [email, setEmail] = useState('admin@gsi.gov.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator credentials.');
      }

      onAuthenticateSuccess(data.user);
      onShowToast(`Administrator access authorized for ${data.user.name}. ${featureName} unlocked.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofillSuperAdmin = () => {
    setEmail('admin@gsi.gov.in');
    setPassword('admin123');
  };

  const autofillSectorAdmin = () => {
    setEmail('sector.admin@gsi.gov.in');
    setPassword('admin123');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[600px] bg-[#edf2f7] animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border-2 border-rose-300 rounded-3xl shadow-xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 text-white border-b border-rose-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                  Access Restricted
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  GSI SEC-POL-403
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Administrator Authentication Required
              </h2>
            </div>
          </div>
          <p className="text-xs text-rose-200/90 mt-3 leading-relaxed">
            The feature <strong className="text-white bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-700/50">{featureName}</strong> is strictly restricted from the <strong>Civilian User Role</strong>. Civilian accounts are authorized to access the designated <strong>Citizen Dashboard</strong> only.
          </p>
          {featureDescription && (
            <p className="text-[11px] text-slate-300 mt-1 italic">
              {featureDescription}
            </p>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Access Denied</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Civilian Role Access Boundary</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              To inspect raw geotechnical sensor streams, modify GIS coordinate configurations, review system kernel logs, or access administrative user accounts, you must authenticate with GSI Officer credentials.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator Official Email
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gsi.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Administrator Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Quick Demo Autofill */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500">Quick Demo Credentials:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={autofillSuperAdmin}
                  className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Dr. Sharma (Super Admin)</span>
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={autofillSectorAdmin}
                  className="text-[11px] font-semibold text-slate-600 hover:underline cursor-pointer"
                >
                  <span>Sector Admin</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onReturnToCitizenDashboard}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Citizen Dashboard</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Admin...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authenticate & Unlock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
