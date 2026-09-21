import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Building, 
  Info,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Clock
} from 'lucide-react';
import { AuthenticatedUser } from '../types';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

/**
 * Mock OTP Verification Service Interface & Implementation
 * Generates a 6-digit code for user login, validates it, and constructs
 * an authenticated user session with updated 'loginTime' and 'isAuthenticated' state.
 */
export interface MockOtpSession {
  code: string;
  name: string;
  phone: string;
  email: string;
  generatedAt: number;
  expiresAt: number;
  attemptsRemaining: number;
  isVerified: boolean;
}

export interface MockOtpValidationResult {
  success: boolean;
  message: string;
  userSession?: AuthenticatedUser;
  attemptsRemaining?: number;
}

export class MockOtpVerificationService {
  private activeSession: MockOtpSession | null = null;
  private readonly CODE_LENGTH = 6;
  private readonly VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generates a random 6-digit numeric OTP code
   */
  public generate6DigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates and dispatches a new mock OTP session
   */
  public createSession(name: string, phone: string, email: string, presetCode?: string): MockOtpSession {
    const code = presetCode && presetCode.length === 6 ? presetCode : this.generate6DigitCode();
    const now = Date.now();
    this.activeSession = {
      code,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      generatedAt: now,
      expiresAt: now + this.VALIDITY_MS,
      attemptsRemaining: this.MAX_ATTEMPTS,
      isVerified: false,
    };
    return this.activeSession;
  }

  /**
   * Returns current active mock OTP session
   */
  public getSession(): MockOtpSession | null {
    return this.activeSession;
  }

  /**
   * Resends / regenerates a new 6-digit code for the current session
   */
  public resendCode(): MockOtpSession | null {
    if (!this.activeSession) return null;
    return this.createSession(
      this.activeSession.name,
      this.activeSession.phone,
      this.activeSession.email
    );
  }

  /**
   * Validates the entered 6-digit code and creates the authenticated user session
   * with updated 'loginTime' and 'isAuthenticated: true'
   */
  public validate(
    inputCode: string,
    fallbackInfo?: { name: string; phone: string; email: string }
  ): MockOtpValidationResult {
    if (!this.activeSession) {
      return {
        success: false,
        message: 'No active OTP verification session found. Please request a new code.',
      };
    }

    const cleanInput = inputCode.trim().replace(/\D/g, '');

    if (!cleanInput || cleanInput.length !== this.CODE_LENGTH) {
      return {
        success: false,
        message: `Please enter a complete 6-digit code (currently ${cleanInput.length} digit${cleanInput.length === 1 ? '' : 's'}).`,
        attemptsRemaining: this.activeSession.attemptsRemaining,
      };
    }

    const now = Date.now();
    if (now > this.activeSession.expiresAt) {
      return {
        success: false,
        message: 'The 6-digit verification code has expired. Please request a fresh OTP.',
        attemptsRemaining: 0,
      };
    }

    if (this.activeSession.attemptsRemaining <= 0) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a fresh OTP code.',
        attemptsRemaining: 0,
      };
    }

    // Compare code
    if (cleanInput !== this.activeSession.code) {
      this.activeSession.attemptsRemaining -= 1;
      return {
        success: false,
        message: `Invalid 6-digit verification code. ${this.activeSession.attemptsRemaining} attempt${this.activeSession.attemptsRemaining === 1 ? '' : 's'} remaining.`,
        attemptsRemaining: this.activeSession.attemptsRemaining,
      };
    }

    // Success! Update session state
    this.activeSession.isVerified = true;
    const nowIso = new Date().toISOString();

    const userSession: AuthenticatedUser = {
      id: `user-otp-${Date.now()}`,
      name: this.activeSession.name || fallbackInfo?.name || 'Citizen User',
      email: this.activeSession.email || fallbackInfo?.email || 'citizen@lithos.ner.gov.in',
      phone: this.activeSession.phone || fallbackInfo?.phone,
      role: 'citizen',
      department: 'NER Public Landslide Safety Network',
      token: `sess_otp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTime: nowIso,
      isAuthenticated: true,
      isConfidentialCleared: false,
    };

    return {
      success: true,
      message: '6-digit OTP verified successfully! User session authenticated.',
      userSession,
      attemptsRemaining: this.activeSession.attemptsRemaining,
    };
  }

  /**
   * Resets active session
   */
  public clear(): void {
    this.activeSession = null;
  }
}

// Export singleton instance of Mock OTP Verification Service
export const mockOtpService = new MockOtpVerificationService();

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthenticatedUser) => void;
  initialMode?: 'user' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'user',
}) => {
  const [authMode, setAuthMode] = useState<'user' | 'admin'>(initialMode);

  // Sync mode when modal opens or initialMode prop changes
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  // User OTP Login State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'details' | 'verify'>('details');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Resend cooldown timer & expiration countdown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(600); // 10 minutes
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // OTP expiration countdown effect
  useEffect(() => {
    if (otpStep !== 'verify' || timeRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          setErrorMessage('Your 6-digit verification code has expired. Please click Resend Code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpStep, timeRemainingSeconds]);

  if (!isOpen) return null;

  // Handle Step 1: Send OTP to User's Phone & Email via Mock OTP Verification Service
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
      // 1. Initialize Mock OTP Service Session and generate 6-digit code
      const session = mockOtpService.createSession(name, phone, email);
      const sixDigitCode = session.code;

      // 2. Synchronize with backend API route if available
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            debugOtp: sixDigitCode, // Align server with mock service
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // If server provided a debugOtp, ensure mock service is aligned
          if (data.debugOtp && data.debugOtp !== sixDigitCode) {
            mockOtpService.createSession(name, phone, email, data.debugOtp);
            setGeneratedOtp(data.debugOtp);
          } else {
            setGeneratedOtp(sixDigitCode);
          }
        } else {
          setGeneratedOtp(sixDigitCode);
        }
      } catch {
        // Mock service is client-resilient
        setGeneratedOtp(sixDigitCode);
      }

      setEnteredOtp('');
      setAttemptsLeft(3);
      setResendCooldown(45); // 45s cooldown
      setTimeRemainingSeconds(600); // 10 minutes
      setOtpStep('verify');
      setSuccessMessage('6-digit verification code generated and dispatched to your mobile phone & email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Mock OTP verification service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP Code
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const session = mockOtpService.resendCode();
    if (session) {
      setGeneratedOtp(session.code);
      setEnteredOtp('');
      setAttemptsLeft(session.attemptsRemaining);
      setResendCooldown(45);
      setTimeRemainingSeconds(600);
      setSuccessMessage('New 6-digit OTP generated and dispatched!');

      // Notify server in background
      fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: session.name,
          phone: session.phone,
          email: session.email,
          debugOtp: session.code,
        }),
      }).catch(() => {});
    }
  };

  // Handle Copy OTP
  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Handle Step 2: Validate OTP Code and Update User Session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!enteredOtp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Validate using Mock OTP Verification Service
      const validation = mockOtpService.validate(enteredOtp, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      });

      if (!validation.success || !validation.userSession) {
        setAttemptsLeft(validation.attemptsRemaining ?? 0);
        throw new Error(validation.message);
      }

      const verifiedSession = validation.userSession;

      // 2. Synchronize verified session with backend API for audit logs
      try {
        await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            otp: enteredOtp.trim(),
            name: name.trim(),
          }),
        });
      } catch {
        // Standalone mock verification succeeds even if offline
      }

      // 3. Update 'loginTime' and 'isAuthenticated' state for user session
      const finalUserSession: AuthenticatedUser = {
        ...verifiedSession,
        loginTime: new Date().toISOString(),
        isAuthenticated: true,
      };

      onLoginSuccess(finalUserSession);
      mockOtpService.clear();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admin Login (Separate Email & Password)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Administrator authentication failed.');
      }

      // Successful admin login with isAuthenticated & loginTime
      const adminSession: AuthenticatedUser = {
        ...data.user,
        loginTime: data.user.loginTime || new Date().toISOString(),
        isAuthenticated: true,
      };

      onLoginSuccess(adminSession);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick autofill for demo test accounts
  const autofillDemoUser = () => {
    setName('Ayush Paul');
    setPhone('+91 98765 43210');
    setEmail('paulayush907@gmail.com');
  };

  const autofillDemoAdmin = () => {
    setAdminEmail('admin@gsi.gov.in');
    setAdminPassword('Admin@Lithos2026!');
  };

  // Format countdown minutes:seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0a1128] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BhumiRakshakLogo className="w-9 h-9" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Bhumi Rakshak Access Portal</span>
                <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-500/30">
                  भूमि रक्षक
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">North-Eastern Landslide Warning Command</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Citizen OTP vs Admin Credentials */}
        <div className="p-3 bg-slate-100 dark:bg-[#080e22] border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode('user');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'user'
                ? 'bg-white dark:bg-[#131f42] text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Citizen / User (OTP Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'admin'
                ? 'bg-white dark:bg-[#131f42] text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Administrator (Password)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Info Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: CITIZEN / FIELD USER OTP LOGIN */}
          {authMode === 'user' && (
            <div>
              {otpStep === 'details' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Enter your name, mobile phone number, and email address. The Mock OTP verification service will generate a 6-digit code to authorize your citizen session.
                  </div>

                  {/* Name input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Ayush Paul"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Mock Telecom SMS channel will be targeted.
                    </span>
                  </div>

                  {/* Email input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="e.g. paulayush907@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Mock NIC Email dispatch gateway target.
                    </span>
                  </div>

                  {/* Notice */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mock OTP Service Active:</strong> When requested, a secure 6-digit code will be generated, displayed in the verification window, and ready for validation.
                    </span>
                  </div>

                  {/* Quick autofill helper */}
                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={autofillDemoUser}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Autofill Demo Citizen Info</span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating 6-Digit Mock OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate & Send 6-Digit OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* OTP Verification Substep with Mock OTP Verification Service UI */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Mock OTP Delivery Simulation Box */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 space-y-3 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Mock OTP Service Generated Code
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                          {formatTime(timeRemainingSeconds)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Dispatched to <strong>{phone}</strong> and <strong>{email}</strong>.
                    </p>

                    {generatedOtp && (
                      <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Generated 6-Digit OTP:</span>
                          <span className="font-mono font-bold text-base tracking-widest text-emerald-800 dark:text-emerald-200 bg-white dark:bg-[#070c1d] px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-inner">
                            {generatedOtp}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyOtp(generatedOtp)}
                            className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copy code to clipboard"
                          >
                            {copiedOtp ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-semibold text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEnteredOtp(generatedOtp)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                          >
                            Auto-fill OTP
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Attempts remaining: <strong className="text-slate-700 dark:text-slate-200">{attemptsLeft}</strong></span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend 6-Digit Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* OTP Input Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 584920"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-center font-mono text-lg tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 font-bold"
                        required
                        autoFocus
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block text-center">
                      Validates code, sets <code className="text-emerald-600 dark:text-emerald-400 font-mono">loginTime</code>, and authorizes user session with <code className="text-emerald-600 dark:text-emerald-400 font-mono">isAuthenticated: true</code>.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep('details')}
                      className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || enteredOtp.length !== 6}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validating 6-Digit OTP...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validate OTP & Authenticate Session</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: SEPARATE ADMINISTRATOR EMAIL & PASSWORD LOGIN */}
          {authMode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Authorized credentials are required to unlock command controls, inspect user login logs, create new administrators, and access confidential geotechnical telemetry.
              </div>

              {/* Admin Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="admin@gsi.gov.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Default Admin Quick Login Helper */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="font-semibold block">Default Root Admin Credentials:</span>
                    <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300">
                      admin@gsi.gov.in / Admin@Lithos2026!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={autofillDemoAdmin}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer shrink-0"
                >
                  Autofill
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating Administrator...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Admin Login</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#070c1d] border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 dark:text-slate-400">
          Geological Survey of India (NER) &bull; National Disaster Management Authority &bull; Strict Role-Based Access Enforced
        </div>
      </div>
    </div>
  );
};
