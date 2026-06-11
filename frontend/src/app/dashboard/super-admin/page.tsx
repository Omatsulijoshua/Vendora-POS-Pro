"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface SuperAdminStats {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  activeSubscriptions: number;
  totalSaaSRevenue: number;
  monthlySaaSRevenue: number;
  totalBranches: number;
  totalUsers: number;
  businessGrowthTrend: { date: string; businessesCreated: number }[];
}

interface SuperAdminBusiness {
  id: string;
  name: string;
  subdomain: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  isActive: boolean;
  branchesCount: number;
  usersCount: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionPrice: number;
  subscriptionExpiresAt: string | null;
  totalSalesRevenue: number;
}

interface SuperAdminAuditLog {
  id: string;
  action: string;
  details: string;
  userEmail: string;
  ipAddress: string;
  createdAt: string;
  businessId: string | null;
  businessName: string;
}

export default function SuperAdminDashboard() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [businesses, setBusinesses] = useState<SuperAdminBusiness[]>([]);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>([]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"businesses" | "auditLogs" | "sale-records">("businesses");
  const [sidebarTab, setSidebarTab] = useState<"home" | "billing">("home");
  
  // Sales records states
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);

  // Filter dropdown states
  const [filterBusinessId, setFilterBusinessId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [filterCashierId, setFilterCashierId] = useState("");

  const [filterBranches, setFilterBranches] = useState<any[]>([]);
  const [filterCashiers, setFilterCashiers] = useState<any[]>([]);

  // Modals & form state
  const [selectedBusiness, setSelectedBusiness] = useState<SuperAdminBusiness | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subTier, setSubTier] = useState("Pro");
  const [subStatus, setSubStatus] = useState("Active");
  const [subPrice, setSubPrice] = useState(299.0);
  const [subExpires, setSubExpires] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const baseUrl = "http://localhost:5149";

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, [token]);

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    }
  }, [token]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  }, [token]);

  const fetchFilterBranches = async (businessId: string) => {
    if (!businessId) {
      setFilterBranches([]);
      setFilterBranchId("");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/branches?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFilterBranches(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilterCashiers = async (businessId: string, branchId: string) => {
    if (!businessId) {
      setFilterCashiers([]);
      setFilterCashierId("");
      return;
    }
    try {
      const url = `${baseUrl}/api/superadmin/cashiers?businessId=${businessId}${branchId ? `&branchId=${branchId}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFilterCashiers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = useCallback(async (bId?: string, brId?: string, cId?: string) => {
    setLoadingSales(true);
    try {
      const params = new URLSearchParams();
      if (bId) params.append("businessId", bId);
      if (brId) params.append("branchId", brId);
      if (cId) params.append("cashierId", cId);

      const res = await fetch(`${baseUrl}/api/sales?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error("Failed to fetch sales", err);
    } finally {
      setLoadingSales(false);
    }
  }, [token]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchBusinesses(), fetchAuditLogs()]);
    setLoading(false);
  }, [fetchStats, fetchBusinesses, fetchAuditLogs]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token, loadAllData]);

  // Flash messages helper
  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const flashError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  // Suspend Business
  const handleSuspend = async (id: string) => {
    if (!window.confirm("Are you sure you want to SUSPEND this business? Users will be blocked from logging in.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/businesses/${id}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        flashSuccess("Business suspended successfully.");
        await Promise.all([fetchStats(), fetchBusinesses(), fetchAuditLogs()]);
      } else {
        const data = await res.json();
        flashError(data.message || "Failed to suspend business.");
      }
    } catch (err) {
      flashError("Network error suspending business.");
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Business
  const handleActivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to ACTIVATE this business?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/businesses/${id}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        flashSuccess("Business activated successfully.");
        await Promise.all([fetchStats(), fetchBusinesses(), fetchAuditLogs()]);
      } else {
        const data = await res.json();
        flashError(data.message || "Failed to activate business.");
      }
    } catch (err) {
      flashError("Network error activating business.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Subscription Modal
  const openSubscriptionModal = (b: SuperAdminBusiness) => {
    setSelectedBusiness(b);
    setSubTier(b.subscriptionTier);
    setSubStatus(b.subscriptionStatus);
    setSubPrice(b.subscriptionPrice);
    
    if (b.subscriptionExpiresAt) {
      // Format to yyyy-MM-dd for HTML input
      setSubExpires(b.subscriptionExpiresAt.split("T")[0]);
    } else {
      setSubExpires("");
    }
    
    setShowSubscriptionModal(true);
  };

  // Save Subscription details
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/superadmin/businesses/${selectedBusiness.id}/subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscriptionTier: subTier,
          subscriptionStatus: subStatus,
          subscriptionPrice: subPrice,
          subscriptionExpiresAt: subExpires ? new Date(subExpires).toISOString() : null,
        }),
      });

      if (res.ok) {
        flashSuccess("Subscription details updated.");
        setShowSubscriptionModal(false);
        await Promise.all([fetchStats(), fetchBusinesses(), fetchAuditLogs()]);
      } else {
        const data = await res.json();
        flashError(data.message || "Failed to update subscription.");
      }
    } catch (err) {
      flashError("Network error updating subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  // Search filter
  const filteredBusinesses = businesses.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      b.subdomain.toLowerCase().includes(query) ||
      b.ownerName.toLowerCase().includes(query) ||
      b.ownerEmail.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          <p className="text-muted-foreground font-semibold text-sm animate-pulse">Loading Platform Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={32} />
            <span className="font-bold text-lg flex flex-wrap items-center gap-x-1">
              <span className="text-foreground font-black">Vendora</span>
              <span className="text-[#10B981] font-medium ml-1">Inventory Management System</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Platform Admin
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <ThemeToggle />
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              🔑 Change Password
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Left Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-2 bg-card/30 border border-slate-900 rounded-2xl p-4">
            <h4 className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Navigation
            </h4>
            <nav className="space-y-1">
              <button
                onClick={() => setSidebarTab("home")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  sidebarTab === "home"
                    ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-extrabold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>

              <button
                onClick={() => setSidebarTab("billing")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  sidebarTab === "billing"
                    ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-extrabold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Payment & Subscription</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 space-y-8 min-w-0">
          
          {/* Flash Messages */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fadeIn">
              ✓ {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fadeIn">
              ⚠ {errorMessage}
            </div>
          )}

          {sidebarTab === "home" ? (
            <>
              {/* Welcome Hero */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/10 p-6 sm:p-8">
                <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[90px]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                      Platform Control Centre
                    </h2>
                    <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
                      Suspend or activate tenants, monitor subscription plans, track global billing metrics, and review audit logs.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={loadAllData}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98]"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-reveal">
                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Businesses</span>
                  <p className="text-4xl font-extrabold mt-3 text-slate-100">{stats?.totalBusinesses ?? 0}</p>
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                    <span>Active: {stats?.activeBusinesses ?? 0}</span>
                    <span>Suspended: {stats?.suspendedBusinesses ?? 0}</span>
                  </div>
                </div>

                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
                  <p className="text-4xl font-extrabold mt-3 text-slate-100">{stats?.activeSubscriptions ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {stats?.totalBusinesses ? Math.round(((stats.activeSubscriptions) / stats.totalBusinesses) * 100) : 0}% tier coverage
                  </p>
                </div>

                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual SaaS Revenue</span>
                  <p className="text-4xl font-extrabold mt-3 text-indigo-400">₦{stats?.totalSaaSRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Est. Monthly: ₦{stats?.monthlySaaSRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </p>
                </div>

                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System-Wide Usage</span>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-200">{stats?.totalBranches ?? 0}</p>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Branches</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-200">{stats?.totalUsers ?? 0}</p>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Staff Users</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Across all tenant environments</p>
                </div>
              </div>

              {/* Tab Selection */}
              <div className="flex border-b border-slate-900">
                <button
                  onClick={() => setActiveTab("businesses")}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "businesses"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Business Tenants ({filteredBusinesses.length})
                </button>
                <button
                  onClick={() => setActiveTab("auditLogs")}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "auditLogs"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  System Audit Trail ({auditLogs.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("sale-records");
                    fetchSales(filterBusinessId, filterBranchId, filterCashierId);
                  }}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "sale-records"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sale Records
                </button>
              </div>

              {/* Tab Panels */}
              {activeTab === "businesses" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Business Control Panel Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:max-w-md relative">
                      <input
                        type="text"
                        placeholder="Search by business, subdomain, or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Businesses Table */}
                  <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-4">
                    <div className="overflow-x-auto border border-slate-900 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/30 text-slate-400 font-semibold">
                            <th className="py-4 px-6">Business Name</th>
                            <th className="py-4 px-6">Domain URL</th>
                            <th className="py-4 px-6">Registered Owner</th>
                            <th className="py-4 px-6 text-center">Branches</th>
                            <th className="py-4 px-6 text-center">Staff Users</th>
                            <th className="py-4 px-6 text-center">Subscription Tier</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-350 bg-slate-950/5">
                          {filteredBusinesses.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-200">{b.name}</td>
                              <td className="py-4 px-6 text-slate-400 font-mono">{b.subdomain}.vendorapos.com</td>
                              <td className="py-4 px-6">
                                <p className="font-semibold text-slate-300">{b.ownerName}</p>
                                <p className="text-[10px] text-slate-550">{b.ownerEmail}</p>
                              </td>
                              <td className="py-4 px-6 text-center font-bold text-slate-300">{b.branchesCount}</td>
                              <td className="py-4 px-6 text-center font-bold text-slate-300">{b.usersCount}</td>
                              <td className="py-4 px-6 text-center">
                                <div>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {b.subscriptionTier}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                    b.subscriptionStatus === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                    b.subscriptionStatus === "Trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    b.subscriptionStatus === "PastDue" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                  }`}>
                                    {b.subscriptionStatus}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => openSubscriptionModal(b)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 hover:bg-slate-800 transition-colors"
                                  >
                                    Edit Plan
                                  </button>
                                  {b.isActive ? (
                                    <button
                                      onClick={() => handleSuspend(b.id)}
                                      disabled={actionLoading}
                                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivate(b.id)}
                                      disabled={actionLoading}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                                    >
                                      Activate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {stats && stats.businessGrowthTrend && (
                    <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-4">
                      <h3 className="font-extrabold text-slate-200 text-base">New Tenant Sign-ups (Last 7 Days)</h3>
                      <div className="h-40 flex items-end justify-between pt-6 border-b border-slate-900 px-4">
                        {stats.businessGrowthTrend.map((t, idx) => {
                          const maxCount = Math.max(...stats.businessGrowthTrend.map((d) => d.businessesCreated), 1);
                          const pct = Math.max((t.businessesCreated / maxCount) * 100, 8);
                          return (
                            <div key={idx} className="h-full flex flex-col justify-end items-center flex-1 group relative px-2">
                              <div className="absolute top-[-28px] scale-0 group-hover:scale-100 transition-all bg-slate-900 border border-slate-800 text-[10px] text-slate-200 font-bold px-2 py-0.5 rounded shadow z-10">
                                {t.businessesCreated} new
                              </div>
                              <div className="w-full h-28 flex items-end justify-center relative">
                                <div 
                                  style={{ height: `${pct}%` }} 
                                  className="w-8 sm:w-12 rounded-t-lg bg-indigo-500/30 group-hover:bg-indigo-500 border-t border-x border-indigo-500/40 transition-all cursor-pointer shadow-lg shadow-indigo-500/5"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium mt-2 block whitespace-nowrap">
                                {new Date(t.date).toLocaleDateString(undefined, { weekday: "short" })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "auditLogs" && (
                <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-100">Recent Platform Activities</h3>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Showing last {auditLogs.length} events
                    </span>
                  </div>

                  <div className="relative border-l border-slate-900 pl-6 ml-3 space-y-6">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative group">
                        <span className={`absolute left-[-31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                          log.action === "BusinessSuspended" ? "bg-red-500 border-slate-950" :
                          log.action === "BusinessActivated" ? "bg-emerald-500 border-slate-950" :
                          log.action === "SubscriptionUpdated" ? "bg-indigo-500 border-slate-950" :
                          "bg-slate-700 border-slate-950"
                        }`} />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                log.action === "BusinessSuspended" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                log.action === "BusinessActivated" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                log.action === "SubscriptionUpdated" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                                "bg-slate-800 text-slate-400"
                              }`}>
                                {log.action}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">IP: {log.ipAddress}</span>
                            </div>
                            <p className="text-slate-200 text-sm font-semibold leading-tight">{log.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-slate-500 text-sm py-4 pl-2">No audit logs have been recorded yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "sale-records" && (
                <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">Sale Records Query</h3>
                      <p className="text-xs text-slate-500">Query and filter sales transactions across all businesses in real time</p>
                    </div>
                    <button
                      onClick={() => fetchSales(filterBusinessId, filterBranchId, filterCashierId)}
                      className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                    >
                      Refresh Records
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business Tenant</label>
                      <select
                        value={filterBusinessId}
                        onChange={(e) => {
                          const bId = e.target.value;
                          setFilterBusinessId(bId);
                          setFilterBranchId("");
                          setFilterCashierId("");
                          fetchFilterBranches(bId);
                          fetchFilterCashiers(bId, "");
                          fetchSales(bId, "", "");
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">All Businesses</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Branch Location</label>
                      <select
                        value={filterBranchId}
                        onChange={(e) => {
                          const brId = e.target.value;
                          setFilterBranchId(brId);
                          setFilterCashierId("");
                          fetchFilterCashiers(filterBusinessId, brId);
                          fetchSales(filterBusinessId, brId, "");
                        }}
                        disabled={!filterBusinessId}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">All Branches</option>
                        {filterBranches.map((br) => (
                          <option key={br.id} value={br.id}>{br.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cashier / Staff</label>
                      <select
                        value={filterCashierId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          setFilterCashierId(cId);
                          fetchSales(filterBusinessId, filterBranchId, cId);
                        }}
                        disabled={!filterBusinessId}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">All Staff</option>
                        {filterCashiers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loadingSales ? (
                    <div className="text-sm text-slate-500 py-6 animate-pulse text-center">Loading sale records...</div>
                  ) : sales.length === 0 ? (
                    <div className="text-sm text-slate-550 py-8 text-center bg-slate-950/20 border border-slate-900 rounded-xl">No sale records match the selected filters.</div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-900 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-900 bg-slate-950/30 text-slate-400 font-semibold">
                            <th className="py-3 px-4">Receipt ID</th>
                            <th className="py-3 px-4">Branch</th>
                            <th className="py-3 px-4">Cashier</th>
                            <th className="py-3 px-4">Payment Method</th>
                            <th className="py-3 px-4">Items Count</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-350 bg-slate-950/5">
                          {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-3 px-4 font-mono font-semibold text-slate-200">{sale.id.substring(0, 8).toUpperCase()}</td>
                              <td className="py-3 px-4 text-slate-400">{sale.branchName || "Global/Shared"}</td>
                              <td className="py-3 px-4 text-slate-400">{sale.cashierName}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  sale.paymentMethod === "Mixed" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                  sale.paymentMethod === "Cash" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  sale.paymentMethod === "Transfer" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                }`}>
                                  {sale.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400">{sale.items?.length ?? 0} items</td>
                              <td className="py-3 px-4 text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-bold text-slate-200">₦{sale.total.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedSale(sale);
                                    setShowReceiptDetailModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded transition-colors active:scale-95 cursor-pointer shadow-sm shadow-indigo-650/15"
                                >
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/10 p-6 sm:p-8">
                <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[90px]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                      SaaS Subscription Management
                    </h2>
                    <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
                      Monitor tenant plans, adjust pricing tiers, manage subscription status, and track monthly recurring revenue.
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 scroll-reveal">
                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
                  <p className="text-4xl font-extrabold mt-3 text-slate-100">{stats?.activeSubscriptions ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-2">Active paying business tenants</p>
                </div>

                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Monthly SaaS Revenue</span>
                  <p className="text-4xl font-extrabold mt-3 text-indigo-400">₦{stats?.monthlySaaSRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
                  <p className="text-xs text-slate-500 mt-2">Based on current monthly packages</p>
                </div>

                <div className="border border-slate-900 bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annualized SaaS Revenue</span>
                  <p className="text-4xl font-extrabold mt-3 text-emerald-400">₦{stats?.totalSaaSRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
                  <p className="text-xs text-slate-500 mt-2">Projected run-rate</p>
                </div>
              </div>

              {/* Subscriptions Registry Table */}
              <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-200 text-base">Subscription Plans & Billing Registry</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">Edit billing plans and suspend/activate tenant subscription access</p>
                  </div>
                  <div className="w-full sm:max-w-xs relative">
                    <input
                      type="text"
                      placeholder="Filter subscription registry..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-900 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/30 text-slate-400 font-semibold">
                        <th className="py-4 px-6">Business Name</th>
                        <th className="py-4 px-6 text-center">Subscription Tier</th>
                        <th className="py-4 px-6 text-center">Plan Status</th>
                        <th className="py-4 px-6 text-right">Plan Cost (₦/Year)</th>
                        <th className="py-4 px-6 text-center">Expires At</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-350 bg-slate-950/5">
                      {filteredBusinesses.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-200">
                            <div>
                              <p>{b.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.subdomain}.vendorapos.com</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {b.subscriptionTier}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              b.subscriptionStatus === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              b.subscriptionStatus === "Trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              b.subscriptionStatus === "PastDue" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {b.subscriptionStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-200">
                            ₦{b.subscriptionPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
                          </td>
                          <td className="py-4 px-6 text-center text-slate-400">
                            {b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).toLocaleDateString() : "Never"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openSubscriptionModal(b)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 hover:bg-slate-800 transition-colors"
                              >
                                Edit Plan
                              </button>
                              {b.isActive ? (
                                <button
                                  onClick={() => handleSuspend(b.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(b.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredBusinesses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No tenant subscriptions found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Thermal Receipt Detail Modal */}
      {showReceiptDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl flex flex-col font-mono text-xs">
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-sm font-bold tracking-wider">VENDORA INVENTORY SYSTEM</h3>
              <p className="text-[10px] text-slate-550">{selectedSale.branchName}</p>
              <p className="text-[9px] text-slate-455">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
              <p className="text-[9px] text-slate-455">Receipt ID: {selectedSale.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="py-2 border-b border-dashed border-slate-300 text-[9px] text-slate-500">
              <span>Cashier: {selectedSale.cashierName}</span>
            </div>
            <div className="flex-1 py-4 space-y-3 max-h-60 overflow-y-auto">
              {selectedSale.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start text-[10px]">
                  <div className="space-y-0.5">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-[9px] text-slate-500">
                      {item.quantity} x ₦{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold">₦{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span>TOTAL</span>
                <span>₦{selectedSale.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowReceiptDetailModal(false);
                setSelectedSale(null);
              }}
              className="mt-4 py-2.5 w-full bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Subscription Edit Modal */}
      {showSubscriptionModal && selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md border border-slate-800 bg-slate-905/95 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-900 pb-3 mb-4">
              Manage Subscription Plan
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Updating subscription parameters for <strong className="text-slate-200">{selectedBusiness.name}</strong> ({selectedBusiness.subdomain}.vendorapos.com)
            </p>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subscription Tier</label>
                <select
                  value={subTier}
                  onChange={(e) => setSubTier(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard">Standard (Standard Branching)</option>
                  <option value="Pro">Pro (Multi-Branch, High Volumes)</option>
                  <option value="Enterprise">Enterprise (Full SaaS Integrations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billing / Subscription Status</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active (Subscribed)</option>
                  <option value="Trialing">Trialing (Free Access)</option>
                  <option value="PastDue">Past Due (Payment Failed)</option>
                  <option value="Suspended">Suspended (Plan Expired)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Yearly Plan Cost (₦ NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={subPrice}
                  onChange={(e) => setSubPrice(parseFloat(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Plan Expiration Date</label>
                <input
                  type="date"
                  value={subExpires}
                  onChange={(e) => setSubExpires(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-md shadow-indigo-600/20"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        token={token}
      />
    </div>
  );
}
