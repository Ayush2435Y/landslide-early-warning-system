import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Mail, 
  Phone, 
  Clock, 
  Globe, 
  Laptop, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Database,
  Building,
  KeyRound,
  FileText,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { AuthenticatedUser, UserLoginRecord, AdminAccount } from '../types';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

interface AdminUsersViewProps {
  currentUser: AuthenticatedUser | null;
  onLoginSuccess?: (user: AuthenticatedUser) => void;
  onOpenAuthModal: (mode?: 'user' | 'admin') => void;
  onShowToast: (message: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  currentUser,
  onLoginSuccess,
  onOpenAuthModal,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Sub-navigation tabs
  const [activeTab, setActiveTab] = useState<'logins' | 'admins'>('logins');

  // Inline Admin Login Form State (available if !isAdmin)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // User Logins State
  const [userLogins, setUserLogins] = useState<UserLoginRecord[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'idle' | 'logged_out'>('all');

  // Administrators State
  const [adminsList, setAdminsList] = useState<AdminAccount[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);

  // New Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDepartment, setNewAdminDepartment] = useState('Geological Survey of India (NER)');
  const [newAdminJurisdiction, setNewAdminJurisdiction] = useState('Assam & Meghalaya Division');
  const [newAdminRole, setNewAdminRole] = useState<'sector_admin' | 'super_admin'>('sector_admin');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Fetch live user login sessions
  const fetchUserLogins = async () => {
    setLoginsLoading(true);
    try {
      const res = await fetch('/api/auth/user-sessions');
      const data = await res.json();
      if (data && data.users) {
        setUserLogins(data.users);
      }
    } catch (err) {
      console.error('Failed to load user logins:', err);
    } finally {
      setLoginsLoading(false);
    }
  };

  // Fetch admin accounts
  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch('/api/auth/admins');
      const data = await res.json();
      if (data && data.admins) {
        setAdminsList(data.admins);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLogins();
    fetchAdmins();
  }, [currentUser]);

  // Handle Terminate User Session
  const handleTerminateSession = async (sessionId: string, userName: string) => {
    if (!isAdmin) {
      onShowToast('Action restricted: Only administrators can revoke user sessions.');
      return;
    }

    try {
      const res = await fetch(`/api/auth/user-sessions/${sessionId}/terminate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onShowToast(`Session for ${userName} terminated successfully.`);
        fetchUserLogins();
      } else {
        onShowToast(data.error || 'Failed to revoke session.');
      }
    } catch (err) {
      onShowToast('Network error while terminating session.');
    }
  };

  // Handle Create New Admin Form Submit
  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onShowToast('Action restricted: Only an authorized administrator can create a new admin.');
      return;
    }

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      onShowToast('Please fill out name, email, and password for the new admin.');
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await fetch('/api/auth/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          password: newAdminPassword.trim(),
          department: newAdminDepartment.trim(),
          jurisdiction: newAdminJurisdiction.trim(),
          role: newAdminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create administrator.');
      }

      onShowToast(`Administrator "${newAdminName}" created successfully!`);
      // Reset form
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setIsAddAdminOpen(false);
      fetchAdmins();
    } catch (err: any) {
      onShowToast(err.message || 'Error creating administrator account.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle Delete Administrator
  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to revoke and delete administrator access for "${adminName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/admins/${adminId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        onShowToast(`Administrator "${adminName}" has been removed.`);
        fetchAdmins();
      } else {
        onShowToast(data.error || 'Failed to remove administrator.');
      }
    } catch (err) {
      onShowToast('Network error removing administrator.');
    }
  };

  // Filtered User Logins
  const filteredLogins = userLogins.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // Handle inline Admin Credential Login (when !isAdmin)
  const handleInlineAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter administrator email address and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Administrator login failed.');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      onShowToast(`Administrator access granted: Welcome ${data.user.name}`);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const autofillRootAdmin = () => {
    setLoginEmail('admin@gsi.gov.in');
    setLoginPassword('Admin@Lithos2026!');
  };

  return (
    <div className="flex-1 bg-[#edf2f7] dark:bg-[#070c1d] overflow-y-auto p-4 md:p-8 min-h-screen pb-28">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Status Banner */}
        <div className="bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <BhumiRakshakLogo className="w-12 h-12 shrink-0 hidden sm:block drop-shadow-sm" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {isAdmin ? 'BHUMI RAKSHAK COMMAND PANEL' : 'BHUMI RAKSHAK CITIZEN PORTAL'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {isAdmin ? 'CLEARANCE: TOP SECRET / LEVEL 4' : 'CLEARANCE: STANDARD CITIZEN'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{isAdmin ? 'User Logins & Administrator Management' : 'Citizen Profile & Early Warning Access'}</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">भूमि रक्षक</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {isAdmin
                  ? 'Review all users who have authenticated via dual-channel OTP (phone & email), manage administrators, create new admins with credentials, and protect confidential geotechnical defense records.'
                  : 'Welcome to the Bhumi Rakshak Landslide Early Warning Portal. Standard accounts can report field slope observations and view public hazard maps. Sensitive defense borehole data and override controls are protected.'}
              </p>
            </div>
          </div>

          {/* Current Session Badge & Switch Button */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#091024] p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
              isAdmin ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isAdmin ? <Building className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.name || 'Guest Observer'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {currentUser?.email || 'Unauthenticated'}
              </p>
            </div>
            <button
              onClick={() => onOpenAuthModal(isAdmin ? 'user' : 'admin')}
              className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>

        {/* Dedicated In-Page Admin Login Form when !isAdmin */}
        {!isAdmin && (
          <div className="bg-white dark:bg-[#0d1630] border-2 border-blue-500/50 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Administrator Login Section (Credentials Required)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sign in with your administrative email and password to unlock command controls, audit user logins, create new admins, and view confidential defense data.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                HQ Protected
              </span>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleInlineAdminLogin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="admin@gsi.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={autofillRootAdmin}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Autofill Default Root Admin (admin@gsi.gov.in)</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize Administrator Access</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security / Confidentiality Advisory Banner for Non-Admins */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confidential Data Protection Protocol Active</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  You are logged in as a <strong>Citizen / Public User</strong>. Under GSI and Defense Directives, confidential border corridor sensors, deep core drill data, and administrative session controls are hidden and cannot be removed by non-administrative users.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('logins')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'logins'
                ? 'bg-[#00b894] text-white shadow-sm'
                : 'bg-white dark:bg-[#0d1630] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Logins Audit ({userLogins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0d1630] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Administrators & Add Admin ({adminsList.length})</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: USER LOGINS AUDIT TABLE (Who has logged in & What are users) */}
        {/* ==================================================================== */}
        {activeTab === 'logins' && (
          <div className="space-y-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white dark:bg-[#0d1630] p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total User Logins</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{userLogins.length}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">+100% Verified OTP</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1630] p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Sessions</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {userLogins.filter((u) => u.status === 'active').length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Live now</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1630] p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Citizen Observers</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {userLogins.filter((u) => u.role === 'citizen').length}
                  </span>
                  <span className="text-[10px] text-slate-400">Public Portal</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1630] p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Field & Admin Officers</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userLogins.filter((u) => u.role === 'admin' || u.role === 'field_officer').length}
                  </span>
                  <span className="text-[10px] text-blue-500 font-semibold">HQ Clearance</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#0d1630] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone number, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
                >
                  <option value="all">All Session Statuses</option>
                  <option value="active">Active Sessions Only</option>
                  <option value="idle">Idle Sessions</option>
                  <option value="logged_out">Logged Out</option>
                </select>

                <button
                  onClick={fetchUserLogins}
                  disabled={loginsLoading}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Refresh User Logins"
                >
                  <RefreshCw className={`w-4 h-4 ${loginsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Who Have Logged In & Registered Users
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing {filteredLogins.length} of {userLogins.length} logged sessions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-[#070c1d] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User Details & Role</th>
                      <th className="py-3 px-4">Phone Number & Email</th>
                      <th className="py-3 px-4">Login Time & Timestamp</th>
                      <th className="py-3 px-4">Location & IP Address</th>
                      <th className="py-3 px-4">Device / Client</th>
                      <th className="py-3 px-4">Session Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Admin Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {filteredLogins.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* User & Role */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {usr.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{usr.name}</span>
                                {usr.otpVerified && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded font-semibold">
                                    OTP Verified
                                  </span>
                                )}
                              </div>
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                                usr.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : usr.role === 'field_officer'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {usr.role === 'admin' ? 'Administrator' : usr.role === 'field_officer' ? 'Field Officer' : 'Citizen Observer'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone & Email */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-mono">
                              <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{usr.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="truncate max-w-[170px]">{usr.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Login Time */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 font-mono">
                            <div className="text-slate-900 dark:text-slate-200 font-semibold">
                              {usr.loginTimeFormatted}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(usr.loginTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>
                        </td>

                        {/* Location & IP */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-900 dark:text-slate-200">
                              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{usr.location}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              IP: {usr.ipAddress}
                            </div>
                          </div>
                        </td>

                        {/* Device */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                            <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{usr.deviceInfo}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {usr.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active Session
                            </span>
                          ) : usr.status === 'idle' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Idle
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              Logged Out
                            </span>
                          )}
                        </td>

                        {/* Admin Action */}
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            {usr.status === 'active' ? (
                              <button
                                onClick={() => handleTerminateSession(usr.id, usr.name)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900 dark:text-rose-300 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Revoke Session
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Terminated</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredLogins.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No user login records matched your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: ADMINISTRATORS LIST & ADD NEW ADMIN FORM */}
        {/* ==================================================================== */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Header with Add New Admin Trigger */}
            <div className="bg-white dark:bg-[#0d1630] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  System Administrators
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Existing administrators can provision and delegate access to new administrators by creating their email address and password.
                </p>
              </div>

              {isAdmin ? (
                <button
                  onClick={() => setIsAddAdminOpen(!isAddAdminOpen)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddAdminOpen ? 'Close Form' : 'Add New Admin'}</span>
                </button>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                  Must be an Administrator to create new admin credentials.
                </div>
              )}
            </div>

            {/* ADD NEW ADMIN EXPANDABLE FORM */}
            {isAddAdminOpen && isAdmin && (
              <div className="bg-white dark:bg-[#0d1630] border-2 border-blue-500/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Create New Administrator Account
                    </h3>
                  </div>
                  <span className="text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold">
                    Super-Admin Authorization
                  </span>
                </div>

                <form onSubmit={handleCreateNewAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Admin Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Admin Full Name & Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sunita Barman"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Admin Email Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Admin Email Address (Used for Login)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. s.barman@gsi.gov.in"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Admin Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Password (Secret Authentication Key)
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          placeholder="Min 8 characters (letters, numbers, symbols)"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          className="w-full px-3 pr-10 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewAdminPassword(`Admin@NER${Math.floor(1000 + Math.random() * 9000)}!`)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                      >
                        Generate secure password
                      </button>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Department / Organization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Geological Survey of India - Assam Circle"
                        value={newAdminDepartment}
                        onChange={(e) => setNewAdminDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Jurisdiction */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Monitoring Jurisdiction
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kamrup & Goalpara Hills Corridor"
                        value={newAdminJurisdiction}
                        onChange={(e) => setNewAdminJurisdiction(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Role Level */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Administrative Authority Level
                      </label>
                      <select
                        value={newAdminRole}
                        onChange={(e: any) => setNewAdminRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-semibold"
                      >
                        <option value="sector_admin">Sector Administrator (Regional Geotech Oversight)</option>
                        <option value="super_admin">Super Administrator (Full GSI HQ Command & User Deletion)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddAdminOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {creatingAdmin ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisioning Admin Account...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save & Authorize Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Administrators Table */}
            <div className="bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Current Authorized Administrators
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {adminsList.length} Administrator Accounts Provisioned
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-[#070c1d] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Administrator Name</th>
                      <th className="py-3 px-4">Login Email</th>
                      <th className="py-3 px-4">Authority Role</th>
                      <th className="py-3 px-4">Department & Jurisdiction</th>
                      <th className="py-3 px-4">Account Created</th>
                      <th className="py-3 px-4">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {adminsList.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{adm.name}</span>
                                {adm.isRootAdmin && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                    Root Super-Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">ID: {adm.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{adm.email}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adm.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {adm.role === 'super_admin' ? 'Super Administrator' : 'Sector Administrator'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {adm.department}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {adm.jurisdiction}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(adm.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Authorized
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            {adm.isRootAdmin ? (
                              <span className="text-[10px] text-slate-400 italic">Protected</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Revoke Administrator Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
