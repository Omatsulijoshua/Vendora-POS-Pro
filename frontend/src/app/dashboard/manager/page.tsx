"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ManagerDashboard() {
  const { user, token, logout } = useAuth();
  const [branchName, setBranchName] = useState("Loading branch...");
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "stock" | "transfers" | "sales" | "promo">("overview");

  // Phase 7 Stock Transfers
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [showAddTransferModal, setShowAddTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState("");
  const [transferTargetBranchId, setTransferTargetBranchId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Phase 8 Sales
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);

  // Phase 9 Promotion States
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Form states for creating Discount
  const [promoName, setPromoName] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoType, setPromoType] = useState("Percentage");
  const [promoValue, setPromoValue] = useState("");
  const [promoTarget, setPromoTarget] = useState("Cart");
  const [promoProductId, setPromoProductId] = useState("");
  const [promoMinCart, setPromoMinCart] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);

  // Form states for creating Coupon
  const [couponCodeForm, setCouponCodeForm] = useState("");
  const [couponTypeForm, setCouponTypeForm] = useState("Percentage");
  const [couponValueForm, setCouponValueForm] = useState("");
  const [couponMinCartForm, setCouponMinCartForm] = useState("");
  const [couponLimitForm, setCouponLimitForm] = useState("");
  const [couponStartForm, setCouponStartForm] = useState("");
  const [couponEndForm, setCouponEndForm] = useState("");
  const [couponErrorForm, setCouponErrorForm] = useState("");
  const [couponSubmittingForm, setCouponSubmittingForm] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);

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

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch("http://localhost:5149/api/branches", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoadingTransfers(true);
      const res = await fetch("http://localhost:5149/api/stocktransfers", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransfers(false);
    }
  };

  // Fetch sales history
  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const res = await fetch("http://localhost:5149/api/sales", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranchInfo();
      fetchProducts();
      fetchBranches();
      fetchTransfers();
      fetchSales();
      fetchDiscounts();
      fetchCoupons();
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

  // Submit Stock Transfer
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    setTransferSubmitting(true);
    try {
      const res = await fetch("http://localhost:5149/api/stocktransfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: transferProductId,
          sourceBranchId: user?.branchId,
          targetBranchId: transferTargetBranchId,
          quantity: transferQuantity,
          notes: transferNotes.trim() || null
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to initiate transfer.");
      }
      setShowAddTransferModal(false);
      setTransferProductId("");
      setTransferTargetBranchId("");
      setTransferQuantity(1);
      setTransferNotes("");
      fetchTransfers();
      fetchProducts();
    } catch (err: any) {
      setTransferError(err.message);
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleApproveTransfer = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5149/api/stocktransfers/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes: "Approved by Manager" })
      });
      if (res.ok) {
        fetchTransfers();
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to approve transfer.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectTransfer = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      const res = await fetch(`http://localhost:5149/api/stocktransfers/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: reason || "Rejected by Manager" })
      });
      if (res.ok) {
        fetchTransfers();
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reject transfer.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelTransfer = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this transfer?")) return;
    try {
      const res = await fetch(`http://localhost:5149/api/stocktransfers/${id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes: "Cancelled by Manager" })
      });
      if (res.ok) {
        fetchTransfers();
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to cancel transfer.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const res = await fetch("http://localhost:5149/api/discounts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await fetch("http://localhost:5149/api/coupons", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Submit Discount
  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSubmitting(true);
    try {
      const payload = {
        name: promoName.trim(),
        description: promoDesc.trim() || null,
        type: promoType,
        value: parseFloat(promoValue),
        target: promoTarget,
        productId: promoTarget === "Product" ? (promoProductId || null) : null,
        minCartAmount: promoTarget === "Cart" ? (parseFloat(promoMinCart) || null) : null,
        startDate: new Date(promoStart).toISOString(),
        endDate: new Date(promoEnd).toISOString(),
        isActive: true
      };

      const res = await fetch("http://localhost:5149/api/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create discount.");
      }

      setPromoName("");
      setPromoDesc("");
      setPromoValue("");
      setPromoProductId("");
      setPromoMinCart("");
      setPromoStart("");
      setPromoEnd("");
      setShowAddPromoModal(false);
      fetchDiscounts();
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setPromoSubmitting(false);
    }
  };

  // Submit Coupon
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponErrorForm("");
    setCouponSubmittingForm(true);
    try {
      const payload = {
        code: couponCodeForm.trim().toUpperCase(),
        type: couponTypeForm,
        value: parseFloat(couponValueForm),
        minCartAmount: couponMinCartForm ? parseFloat(couponMinCartForm) : null,
        usageLimit: couponLimitForm ? parseInt(couponLimitForm) : null,
        startDate: new Date(couponStartForm).toISOString(),
        endDate: new Date(couponEndForm).toISOString(),
        isActive: true
      };

      const res = await fetch("http://localhost:5149/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create coupon.");
      }

      setCouponCodeForm("");
      setCouponValueForm("");
      setCouponMinCartForm("");
      setCouponLimitForm("");
      setCouponStartForm("");
      setCouponEndForm("");
      setShowAddCouponModal(false);
      fetchCoupons();
    } catch (err: any) {
      setCouponErrorForm(err.message);
    } finally {
      setCouponSubmittingForm(false);
    }
  };

  // Delete Discount
  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;
    try {
      const res = await fetch(`http://localhost:5149/api/discounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`http://localhost:5149/api/coupons/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Discount Active
  const handleToggleDiscountActive = async (discount: any) => {
    try {
      const payload = {
        name: discount.name,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        target: discount.target,
        productId: discount.productId,
        minCartAmount: discount.minCartAmount,
        startDate: discount.startDate,
        endDate: discount.endDate,
        isActive: !discount.isActive
      };
      const res = await fetch(`http://localhost:5149/api/discounts/${discount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Coupon Active
  const handleToggleCouponActive = async (coupon: any) => {
    try {
      const payload = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minCartAmount: coupon.minCartAmount,
        usageLimit: coupon.usageLimit,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        isActive: !coupon.isActive
      };
      const res = await fetch(`http://localhost:5149/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchCoupons();
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
          <button
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "transfers" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Stock Transfers
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "sales" ? "border-emerald-500 text-emerald-455" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Sales History
          </button>
          <button
            onClick={() => setActiveTab("promo")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "promo" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Discounts & Coupons
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Branch Daily Sales", value: `$${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, desc: "Total branch checkout value" },
                { label: "Total Transactions", value: sales.length.toString(), desc: "Completed receipts" },
                { label: "Low Stock Alerts", value: `${lowStockItems.length} Items`, desc: "Requires reorder" },
                { label: "Branch Total Inventory", value: `${totalStockCount} units`, desc: "Total stock pieces" },
              ].map((stat, i) => (
                <div key={i} className="border border-slate-900 bg-slate-900/20 rounded-xl p-5">
                  <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                  <p className="text-3xl font-bold mt-3 text-slate-100">{stat.value}</p>
                  <p className="text-xs text-slate-505 mt-1">{stat.desc}</p>
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

        {activeTab === "transfers" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Branch Stock Transfers</h3>
              <button
                onClick={() => {
                  if (products.length > 0) setTransferProductId(products[0].id);
                  const otherBranches = branches.filter(br => br.id !== user?.branchId);
                  if (otherBranches.length > 0) setTransferTargetBranchId(otherBranches[0].id);
                  setTransferQuantity(1);
                  setTransferNotes("");
                  setTransferError("");
                  setShowAddTransferModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg transition-colors animate-all active:scale-[0.98]"
              >
                + Initiate Transfer
              </button>
            </div>

            {loadingTransfers ? (
              <div className="text-sm text-slate-505 animate-pulse">Loading transfer history...</div>
            ) : transfers.length === 0 ? (
              <div className="text-sm text-slate-500 py-6">No stock transfers logged for this branch. Click "+ Initiate Transfer" to begin moving stock.</div>
            ) : (
              <div className="overflow-x-auto animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 px-4">From Branch</th>
                      <th className="pb-3 px-4">To Branch</th>
                      <th className="pb-3 px-4 text-center">Quantity</th>
                      <th className="pb-3 px-4 text-center">Status</th>
                      <th className="pb-3 px-4">Initiated By</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-350">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-slate-200">{t.productName}</td>
                        <td className="py-3 px-4 text-slate-450">{t.sourceBranchName}</td>
                        <td className="py-3 px-4 text-slate-450">{t.targetBranchName}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">{t.quantity}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t.status === "Approved" ? "bg-emerald-500/10 text-emerald-455 border-emerald-500/20" :
                            t.status === "Rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            t.status === "Cancelled" ? "bg-slate-800 text-slate-400 border-slate-700" :
                            "bg-yellow-500/10 text-yellow-450 border-yellow-500/20 animate-pulse"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{t.initiatedByUserName}</td>
                        <td className="py-3 px-4 text-slate-505">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          {t.status === "Pending" && (
                            <>
                              {t.targetBranchId === user?.branchId && (
                                <>
                                  <button
                                    onClick={() => handleApproveTransfer(t.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors active:scale-95"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectTransfer(t.id)}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded transition-colors active:scale-95"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {t.sourceBranchId === user?.branchId && (
                                <button
                                  onClick={() => handleCancelTransfer(t.id)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded transition-colors active:scale-95"
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "sales" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Branch Sales History</h3>
              <button
                onClick={fetchSales}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-lg transition-colors border border-slate-800"
              >
                Refresh Logs
              </button>
            </div>

            {loadingSales ? (
              <div className="text-sm text-slate-500 py-6 animate-pulse">Loading sales history...</div>
            ) : sales.length === 0 ? (
              <div className="text-sm text-slate-500 py-6 text-center">No sales transactions logged at this branch.</div>
            ) : (
              <div className="overflow-x-auto animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">Receipt ID</th>
                      <th className="pb-3 px-4">Cashier</th>
                      <th className="pb-3 px-4">Payment Method</th>
                      <th className="pb-3 px-4">Items Count</th>
                      <th className="pb-3 px-4">Date & Time</th>
                      <th className="pb-3 px-4 text-right">Total Amount</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-350">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="py-3 pr-4 font-mono font-semibold text-slate-200">{sale.id.substring(0, 8).toUpperCase()}</td>
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
                        <td className="py-3 px-4 text-slate-400">{sale.items.length} items</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-200">${sale.total.toFixed(2)}</td>
                        <td className="py-3 pl-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowReceiptDetailModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors active:scale-95 shadow-sm shadow-emerald-600/10"
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

        {activeTab === "promo" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Promotions & Coupons</h3>
                <p className="text-xs text-slate-500">Manage business discount rules and promo coupons</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    const startStr = now.toISOString().slice(0, 16);
                    const endStr = new Date(now.setDate(now.getDate() + 30)).toISOString().slice(0, 16);
                    setPromoStart(startStr);
                    setPromoEnd(endStr);
                    setPromoName("");
                    setPromoDesc("");
                    setPromoValue("");
                    setPromoMinCart("");
                    setPromoProductId(products[0]?.id || "");
                    setPromoError("");
                    setShowAddPromoModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-650/20"
                >
                  + Add Discount Rule
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const startStr = now.toISOString().slice(0, 16);
                    const endStr = new Date(now.setDate(now.getDate() + 30)).toISOString().slice(0, 16);
                    setCouponStartForm(startStr);
                    setCouponEndForm(endStr);
                    setCouponCodeForm("");
                    setCouponValueForm("");
                    setCouponMinCartForm("");
                    setCouponLimitForm("");
                    setCouponErrorForm("");
                    setShowAddCouponModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-650 hover:bg-purple-750 text-white font-semibold text-xs transition-colors shadow-md shadow-purple-600/20"
                >
                  + Create Coupon Code
                </button>
              </div>
            </div>

            {/* Coupons Section */}
            <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Coupon Codes</h4>
              {loadingCoupons ? (
                <div className="text-xs text-slate-555">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="text-xs text-slate-555">No coupons created yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                        <th className="pb-3 pr-4">Code</th>
                        <th className="pb-3 px-4">Discount</th>
                        <th className="pb-3 px-4">Min Spend</th>
                        <th className="pb-3 px-4">Usage Limit</th>
                        <th className="pb-3 px-4">Validity</th>
                        <th className="pb-3 px-4 text-center">Status</th>
                        <th className="pb-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-350">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/5">
                          <td className="py-3 pr-4 font-mono font-bold text-indigo-400">{c.code}</td>
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {c.type === "Percentage" ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4">
                            {c.minCartAmount ? `$${c.minCartAmount.toFixed(2)}` : "None"}
                          </td>
                          <td className="py-3 px-4">
                            {c.usageCount} / {c.usageLimit !== null ? c.usageLimit : "∞"}
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleCouponActive(c)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.isActive
                                  ? "bg-emerald-500/10 text-emerald-455 border border-emerald-500/25"
                                  : "bg-red-500/10 text-red-450 border border-red-500/25"
                              }`}
                            >
                              {c.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3 pl-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="text-red-400 hover:text-red-300 font-semibold text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Discount Rules Section */}
            <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Discount Rules</h4>
              {loadingDiscounts ? (
                <div className="text-xs text-slate-555">Loading discounts...</div>
              ) : discounts.length === 0 ? (
                <div className="text-xs text-slate-555">No discount rules configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 px-4">Target</th>
                        <th className="pb-3 px-4">Discount</th>
                        <th className="pb-3 px-4">Min spend / Product</th>
                        <th className="pb-3 px-4">Validity</th>
                        <th className="pb-3 px-4 text-center">Status</th>
                        <th className="pb-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-350">
                      {discounts.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-900/5">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-slate-200">{d.name}</p>
                            {d.description && <p className="text-[10px] text-slate-500">{d.description}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                              {d.target}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {d.type === "Percentage" ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4">
                            {d.target === "Cart" ? (
                              d.minCartAmount ? `Min Spend: $${d.minCartAmount.toFixed(2)}` : "No Min Spend"
                            ) : (
                              products.find(p => p.id === d.productId)?.name || d.productId || "Product"
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            {new Date(d.startDate).toLocaleDateString()} - {new Date(d.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleDiscountActive(d)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.isActive
                                  ? "bg-emerald-500/10 text-emerald-455 border border-emerald-500/25"
                                  : "bg-red-500/10 text-red-450 border border-red-500/25"
                              }`}
                            >
                              {d.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3 pl-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteDiscount(d.id)}
                              className="text-red-400 hover:text-red-300 font-semibold text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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

      {/* Initiate Stock Transfer Modal */}
      {showAddTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Initiate Branch Stock Transfer</h3>
            {transferError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-450 rounded-lg text-xs">{transferError}</div>}
            <form onSubmit={handleInitiateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Product</label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Available: {p.totalStock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Source Branch (Your Branch)</label>
                  <input
                    type="text"
                    value={branchName}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-850 rounded-lg text-slate-400 text-sm focus:outline-none cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Destination Branch</label>
                  <select
                    value={transferTargetBranchId}
                    onChange={(e) => setTransferTargetBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none font-semibold text-emerald-450"
                  >
                    {branches.filter(br => br.id !== user?.branchId).map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity to Transfer</label>
                <input
                  type="number"
                  min="1"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transfer Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Coca-cola branch restock"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddTransferModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={transferSubmitting} className="flex-1 py-2.5 bg-emerald-650 text-white text-xs font-bold rounded-lg">{transferSubmitting ? "Initiating..." : "Confirm Transfer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Detail Modal */}
      {showReceiptDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl flex flex-col font-mono text-xs">
            {/* Store details */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-sm font-bold tracking-wider">VENDORA POS PRO</h3>
              <p className="text-[10px] text-slate-500">{selectedSale.branchName}</p>
              <p className="text-[9px] text-slate-455">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
              <p className="text-[9px] text-slate-455">Receipt ID: {selectedSale.id.substring(0, 8).toUpperCase()}</p>
            </div>

            {/* Cashier information */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[9px] text-slate-500">
              <span>Cashier: {selectedSale.cashierName}</span>
            </div>

            {/* Sales Items */}
            <div className="flex-1 py-4 space-y-3 max-h-60 overflow-y-auto">
              {selectedSale.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start text-[10px]">
                  <div className="space-y-0.5">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-[9px] text-slate-500">{item.sku}</p>
                    <p className="text-[9px] text-slate-500">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold">${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-red-655 font-bold">
                  <span>Discount</span>
                  <span>-${selectedSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax</span>
                <span>${selectedSale.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-double border-slate-400 pt-2 text-slate-900">
                <span>TOTAL</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-[9px] text-slate-650">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold tracking-wide">{selectedSale.paymentMethod}</span>
              </div>
              {selectedSale.paymentMethod === "Mixed" && selectedSale.paymentDetails && (
                (() => {
                  try {
                    const parsed = JSON.parse(selectedSale.paymentDetails);
                    return (
                      <div className="pl-2 border-l border-slate-200 space-y-0.5 mt-1 font-bold">
                        {parsed.cash > 0 && <div className="flex justify-between"><span>• Cash:</span><span>${parsed.cash.toFixed(2)}</span></div>}
                        {parsed.transfer > 0 && <div className="flex justify-between"><span>• Transfer:</span><span>${parsed.transfer.toFixed(2)}</span></div>}
                        {parsed.pos > 0 && <div className="flex justify-between"><span>• Card POS:</span><span>${parsed.pos.toFixed(2)}</span></div>}
                      </div>
                    );
                  } catch (e) { return null; }
                })()
              )}
            </div>

            {/* Footer message */}
            <div className="text-center pt-6 mt-4 border-t border-dashed border-slate-300 text-[9px] text-slate-400 space-y-0.5">
              <p className="font-bold text-slate-650">Thank you for your patronage!</p>
              <p>Please keep this receipt as proof of purchase.</p>
            </div>

            <button
              onClick={() => {
                setShowReceiptDetailModal(false);
                setSelectedSale(null);
              }}
              className="mt-6 py-2.5 w-full bg-slate-905 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Create Discount Modal */}
      {showAddPromoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Create Discount Rule</h3>
            {promoError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{promoError}</div>}
            <form onSubmit={handleAddDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-1.5">Rule Name</label>
                <input
                  type="text"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="Summer Promo"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  placeholder="Apply discount during checkout"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-305 mb-1.5">Discount Target</label>
                  <select
                    value={promoTarget}
                    onChange={(e) => setPromoTarget(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Cart">Cart (Entire Order)</option>
                    <option value="Product">Product Specific</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-305 mb-1.5">Discount Type</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FixedAmount">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-305 mb-1.5">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoValue}
                    onChange={(e) => setPromoValue(e.target.value)}
                    placeholder="10"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                {promoTarget === "Cart" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-305 mb-1.5">Min Cart Spend ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={promoMinCart}
                      onChange={(e) => setPromoMinCart(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-305 mb-1.5">Apply to Product</label>
                    <select
                      value={promoProductId}
                      onChange={(e) => setPromoProductId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">Start Date</label>
                  <input
                    type="datetime-local"
                    value={promoStart}
                    onChange={(e) => setPromoStart(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">End Date</label>
                  <input
                    type="datetime-local"
                    value={promoEnd}
                    onChange={(e) => setPromoEnd(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddPromoModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={promoSubmitting} className="flex-1 py-2.5 bg-emerald-650 text-white text-xs font-bold rounded-lg">{promoSubmitting ? "Creating..." : "Create Discount"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showAddCouponModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Create Coupon Code</h3>
            {couponErrorForm && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{couponErrorForm}</div>}
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-1.5">Coupon Code (Unique)</label>
                <input
                  type="text"
                  value={couponCodeForm}
                  onChange={(e) => setCouponCodeForm(e.target.value.toUpperCase())}
                  placeholder="SAVE30"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-305 mb-1.5">Coupon Discount Type</label>
                  <select
                    value={couponTypeForm}
                    onChange={(e) => setCouponTypeForm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FixedAmount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponValueForm}
                    onChange={(e) => setCouponValueForm(e.target.value)}
                    placeholder="15"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">Min Order Spend ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponMinCartForm}
                    onChange={(e) => setCouponMinCartForm(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={couponLimitForm}
                    onChange={(e) => setCouponLimitForm(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">Start Date</label>
                  <input
                    type="datetime-local"
                    value={couponStartForm}
                    onChange={(e) => setCouponStartForm(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-355 mb-1.5">End Date</label>
                  <input
                    type="datetime-local"
                    value={couponEndForm}
                    onChange={(e) => setCouponEndForm(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddCouponModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={couponSubmittingForm} className="flex-1 py-2.5 bg-purple-650 text-white text-xs font-bold rounded-lg">{couponSubmittingForm ? "Creating..." : "Create Coupon"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
