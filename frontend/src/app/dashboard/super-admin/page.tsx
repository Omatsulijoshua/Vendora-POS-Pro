"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  // Mock data for Phase 1 verification
  const tenants = [
    { id: "1", name: "Apex Supermarket", subdomain: "apex-store", owner: "John Doe", email: "john.doe@example.com", status: "Active", created: "2026-06-08" },
    { id: "2", name: "Classic Boutique", subdomain: "classic-boutique", owner: "Sarah Jenkins", email: "sarah@boutique.com", status: "Active", created: "2026-06-07" },
    { id: "3", name: "City Pharmacy", subdomain: "city-pharmacy", owner: "Mike Miller", email: "mike@citypharmacy.com", status: "Suspended", created: "2026-06-05" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              V
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Vendora POS Pro
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Super Admin
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 sm:p-8">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Platform Administration
              </h2>
              <p className="text-slate-400 mt-1 sm:mt-2">
                Manage global business tenants, monitor system metrics, and control system policies.
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20">
                Create Tenant
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Tenants", value: "3", change: "+1 this week", color: "from-blue-500 to-indigo-500" },
            { label: "Active Subscriptions", value: "2", change: "66% of total", color: "from-indigo-500 to-purple-500" },
            { label: "Total Branches", value: "8", change: "Across all tenants", color: "from-purple-500 to-pink-500" },
            { label: "Platform Health", value: "99.98%", change: "All services online", color: "from-emerald-500 to-teal-500" },
          ].map((stat, i) => (
            <div key={i} className="border border-slate-800 bg-slate-905/30 rounded-xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Live
                </span>
              </div>
              <p className="text-3xl font-bold mt-4 text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Tenants List & System Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tenants List Card */}
          <div className="lg:col-span-2 border border-slate-800 bg-slate-900/20 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Registered Businesses</h3>
              <span className="text-xs font-medium text-slate-500 hover:underline cursor-pointer">
                View all tenants
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="pb-3 pr-4">Business Name</th>
                    <th className="pb-3 px-4">Subdomain</th>
                    <th className="pb-3 px-4">Owner</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 pr-4 font-semibold text-slate-200">{t.name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-indigo-400">{t.subdomain}.vendorapos.com</td>
                      <td className="py-4 px-4">
                        <div>
                          <p>{t.owner}</p>
                          <p className="text-xs text-slate-500">{t.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === "Active" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right text-slate-500">{t.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs / Activities */}
          <div className="border border-slate-800 bg-slate-900/20 rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-lg text-slate-100">System Logs</h3>
            <div className="space-y-4">
              {[
                { type: "CREATE", desc: "Registered business Apex Supermarket", time: "10m ago" },
                { type: "LOGIN", desc: "SuperAdmin logged in from IP 127.0.0.1", time: "42m ago" },
                { type: "MIGRATE", desc: "Database migration InitialCreate applied", time: "2h ago" },
                { type: "STATUS", desc: "SuperAdmin service auto-healed", time: "5h ago" },
              ].map((log, i) => (
                <div key={i} className="flex items-start space-x-3 text-sm">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.type === "CREATE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    log.type === "LOGIN" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    log.type === "MIGRATE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {log.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-300 text-xs font-medium leading-tight">{log.desc}</p>
                    <span className="text-[10px] text-slate-500">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
