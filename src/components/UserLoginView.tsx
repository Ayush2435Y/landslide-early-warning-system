import React, { useState } from 'react';
import { 
  Smartphone, 
  Mail, 
  User, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  MapPin, 
  Radio, 
  LogOut, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { AuthenticatedUser } from '../types';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

interface UserLoginViewProps {
  currentUser: AuthenticatedUser | null;
  onLoginSuccess: (user: AuthenticatedUser) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: string) => void;
  onShowToast: (message: string) => void;
}

export const UserLoginView: React.FC<UserLoginViewProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onNavigateToTab,
  onShowToast,
}) => {
  // Input fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // OTP Verification state
  const [otpStep, setOtpStep] = useState<'details' | 'verify'>('details');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCitizenLoggedIn = currentUser && (currentUser.role === 'citizen' || currentUser.role === 'field_officer');

  // Handle Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch OTP.');
      }

      setGeneratedOtp(data.debugOtp);
      setOtpMessage(data.message);
      setOtpStep('verify');
      setSuccessMessage('6-Digit OTP successfully sent to both your phone and email inbox!');
      onShowToast('OTP sent to phone & email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with OTP gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!enteredOtp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code received on your phone and email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          otp: enteredOtp.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP verification code.');
      }

      onLoginSuccess(data.user);
      setSuccessMessage(`Welcome, ${data.user.name}! Citizen authentication verified.`);
      onShowToast(`Authenticated as ${data.user.name}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo autofill
  const autofillDemo = () => {
    setName('Ayush Paul');
    setPhone('+91 98765 43210');
    setEmail('paulayush907@gmail.com');
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BhumiRakshakLogo className="w-9 h-9" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Bhumi Rakshak</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Citizen Portal (भूमि रक्षक)
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Sign in via mobile phone and email dual-channel OTP verification to access public early warning bulletins and submit field reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('admin_portal')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Go to Admin Login Section</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Login / Verification Form or Current Session Card */}
        <div className="lg:col-span-7 space-y-6">
          {isCitizenLoggedIn ? (
            /* Logged In Citizen Card */
            <div className="bg-white border-2 border-emerald-500/50 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentUser?.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        OTP Verified
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">{currentUser?.email}</p>
                    {currentUser?.phone && (
                      <p className="text-xs text-emerald-700 font-mono font-medium">{currentUser.phone}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Account Type:</span>
                  <span className="font-bold text-slate-800">Citizen / General Public</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Data Access Scope:</span>
                  <span className="font-bold text-emerald-700">Normal Public Data Only</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Session Token:</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate block">{currentUser?.token || 'Active'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Login Verified:</span>
                  <span className="font-mono text-[10px] text-slate-800">
                    {currentUser?.loginTime ? new Date(currentUser.loginTime).toLocaleTimeString() : 'Active Now'}
                  </span>
                </div>
              </div>

              {/* Citizen Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateToTab('dashboard')}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>View Early Warnings</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('reports')}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Submit Field Incident</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {otpStep === 'details' ? 'Step 1: Enter Citizen Contact Details' : 'Step 2: Enter Verification Code'}
                </h2>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Dual-Channel OTP
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {otpStep === 'details' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Ayush Paul"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Phone Number (for SMS OTP)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (for Email OTP)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="paulayush907@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={autofillDemo}
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Autofill Sample Citizen Details</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP to Phone & Email...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP to Mobile & Email</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify Code */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        OTP Dispatched Successfully
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                        10m Expiry
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Dispatched to phone <strong>{phone}</strong> and email <strong>{email}</strong>.
                    </p>
                    {generatedOtp && (
                      <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">Transmitted Code:</span>
                          <span className="font-mono font-bold text-sm tracking-widest text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                            {generatedOtp}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnteredOtp(generatedOtp)}
                          className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 547232"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono text-base tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 font-bold"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep('details')}
                      className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Complete Login</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Confidentiality Policy & Public Access Scope */}
        <div className="lg:col-span-5 space-y-4">
          {/* Strict Confidentiality Policy Card */}
          <div className="bg-white border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Confidential Data Protection Policy
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In strict accordance with the <strong>Geological Survey of India (GSI) Confidential Infrastructure Protocol</strong>, regular users and citizens:
            </p>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>Cannot see confidential data:</strong> Sensitive Indo-China defense corridor road sensors, deep dam shear logs, and classified drill cores are masked.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>Cannot remove data:</strong> Deletion endpoints reject standard user requests with <code>403 Forbidden</code>. Removal is restricted exclusively to authorized administrators.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Can view normal data:</strong> Landslide hazard indices, public early warning bulletins, regional weather radar maps, and community problem reports.</span>
              </li>
            </ul>
          </div>

          {/* Citizen Features Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Accessible Citizen Features
            </h3>
            <div className="space-y-2 text-xs">
              <div 
                onClick={() => onNavigateToTab('dashboard')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Regional Early Warnings</span>
                    <span className="text-[11px] text-slate-500">View real-time alerts & landslide bulletins</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div 
                onClick={() => onNavigateToTab('reports')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Report Ground Cracks & Slides</span>
                    <span className="text-[11px] text-slate-500">Submit photos and field problem reports</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
