"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ManagerDashboard() {
  const { user, token, logout } = useAuth();
  const [branchName, setBranchName] = useState("Loading branch...");
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "stock">("overview");

  // Modals visibility
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentLogs, setAdjustmentLogs] = useState<any[]>([]);

  // Adjust stock form
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjMinLevel, setAdjMinLevel] = useState(0);
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  const fetchBranchInfo = async () => {
    if (!token || !user?.branchId) {
      setBranchName("Unassigned Branch");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5149/api/branches/${user.branchId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBranchName(data.name);
      } else {
        setBranchName("Unknown Branch");
      }
    } catch (err) {
      console.error("Failed to fetch branch info", err);
      setBranchName("Error loading branch");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("http://localhost:5149/api/products", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranchInfo();
      fetchProducts();
    }
  }, [token, user?.branchId]);

  // Adjust Stock Submit
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError("");
    setAdjSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5149/api/products/${selectedProduct.id}/adjust-stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          branchId: user?.branchId,
          quantity: adjQuantity,
          minStockLevel: adjMinLevel,
          reason: adjReason.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to adjust stock.");
      }

      setAdjReason("");
      setShowAdjustStockModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setAdjError(err.message);
    } finally {
      setAdjSubmitting(false);
    }
  };

  const fetchAdjustmentLogs = async (productId: string) => {
    try {
      const res = await fetch(`http://localhost:5149/api/products/${productId}/adjustment-logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdjustmentLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Derived stats
  const lowStockItems = products.filter(p => p.underStockAlert);
  const totalStockCount = products.reduce((acc, p) => acc + p.totalStock, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/30">
              V
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Vendora POS Pro
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
              Manager Panel
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">Branch: {branchName}</p>
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

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 sm:p-8">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
                {branchName} Control Panel
              </h2>
              <p className="text-slate-400 mt-1 sm:mt-2">
                Monitor stock levels, review alerts, and adjust quantities at your branch.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("stock")}
              className="px-4 py-2.5 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Adjust Branch Stock
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-900 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "overview" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Overview & Alerts
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "stock" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Branch Stock Control
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Branch Daily Sales", value: "$1,840.00", desc: "Mock value" },
                { label: "Total Transactions", value: "42", desc: "Mock count" },
                { label: "Low Stock Alerts", value: `${lowStockItems.length} Items`, desc: "Requires reorder" },
                { label: "Branch Total Inventory", value: `${totalStockCount} units`, desc: "Total stock pieces" },
              ].map((stat, i) => (
                <div key={i} className="border border-slate-900 bg-slate-900/20 rounded-xl p-5">
                  <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                  <p className="text-3xl font-bold mt-3 text-slate-100">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inventory warning card */}
              <div className="lg:col-span-2 border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg text-slate-100">Low Stock Inventory Alerts</h3>
                
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">All stock levels are currently healthy.</p>
                ) : (
                  <div className="divide-y divide-slate-900">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-200 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-505 font-mono">{item.sku}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-slate-300">Stock: <span className="font-bold text-red-400">{item.totalStock}</span></p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                            Low Stock
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cashier shift tracker */}
              <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg text-slate-100">Live Register Shift Tracker</h3>
                <div className="space-y-4">
                  {[
                    { name: "Kyle Reese", register: "Register #1", status: "Active", drawer: "$450.00" },
                    { name: "John Connor", register: "Register #2", status: "Active", drawer: "$225.50" },
                  ].map((c, i) => (
                    <div key={i} className="p-3 rounded bg-slate-950/40 border border-slate-900 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">{c.name}</p>
                        <p className="text-[10px] text-slate-550">{c.register}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-300">{c.drawer}</p>
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <h3 className="font-bold text-lg text-slate-100">Stock Control catalog</h3>
            
            {loadingProducts ? (
              <div className="text-sm text-slate-500">Loading branch catalog...</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-slate-500">No products registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">SKU / Barcode</th>
                      <th className="pb-3 px-4">Product Name</th>
                      <th className="pb-3 px-4">Price</th>
                      <th className="pb-3 px-4 text-center">My Stock Level</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/5">
                        <td className="py-3 pr-4">
                          <p className="font-mono text-emerald-400 font-semibold">{p.sku}</p>
                          <p className="text-[10px] text-slate-505">{p.barcode || "No Barcode"}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{p.name}</td>
                        <td className="py-3 px-4">${p.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            p.underStockAlert ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {p.totalStock}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjQuantity(p.totalStock);
                              // We don't have min level on products list DTO unless it unrolled, but we can set defaults.
                              setAdjMinLevel(10);
                              setShowAdjustStockModal(true);
                            }}
                            className="px-2 py-1 bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-900/20 text-emerald-400 font-bold rounded"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              fetchAdjustmentLogs(p.id);
                              setShowLogModal(true);
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 font-bold rounded"
                          >
                            Logs
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
      </main>

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Adjust Stock Level</h3>
            <p className="text-xs text-slate-500 mb-4">Product: <span className="text-emerald-400 font-bold">{selectedProduct?.name}</span></p>
            {adjError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{adjError}</div>}
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Quantity</label>
                  <input
                    type="number"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Alert Level</label>
                  <input
                    type="number"
                    value={adjMinLevel}
                    onChange={(e) => setAdjMinLevel(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adjustment Reason</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Intake delivery, waste/damage correction..."
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowAdjustStockModal(false); setSelectedProduct(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={adjSubmitting} className="flex-1 py-2.5 bg-emerald-650 text-white text-xs font-bold rounded-lg">Confirm Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Logs Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-2xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Stock Adjustment Audit Trail</h3>
                <p className="text-xs text-slate-500">Product: <span className="text-emerald-400 font-bold">{selectedProduct?.name}</span></p>
              </div>
              <button
                onClick={() => { setShowLogModal(false); setSelectedProduct(null); setAdjustmentLogs([]); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-100"
              >
                Close
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3 p-1">
              {adjustmentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No stock adjustments logged for this product.</p>
              ) : (
                adjustmentLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">Changed by: {log.adjustedByUserName}</span>
                      <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Prev Qty: <span className="text-slate-300">{log.previousQuantity}</span></div>
                      <div>New Qty: <span className="text-emerald-400 font-bold">{log.newQuantity}</span></div>
                    </div>
                    <div className="text-[11px] text-slate-450 border-t border-slate-850/50 pt-1">
                      Reason: <span className="text-slate-300 italic">{log.reason}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
