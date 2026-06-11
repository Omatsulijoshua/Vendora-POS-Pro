"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Printer } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export default function CashierDashboard() {
  const { user, token, logout } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [branchName, setBranchName] = useState("Loading branch...");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [receiptSetting, setReceiptSetting] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Search & Barcode scanning states
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [scanError, setScanError] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Promotion & Coupon states
  const [manualDiscountStr, setManualDiscountStr] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

  // Tab & Statistics states
  const [activeTab, setActiveTab] = useState<"register" | "performance">("register");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Offline and Responsive layout states
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSales, setOfflineSales] = useState<any[]>([]);
  const [syncingSales, setSyncingSales] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");
  const [mobileActiveTab, setMobileActiveTab] = useState<"catalog" | "cart">("catalog");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      const stored = localStorage.getItem("vendora_offline_sales");
      if (stored) {
        try {
          setOfflineSales(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse offline sales", e);
        }
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleSyncSales = async () => {
    if (offlineSales.length === 0 || syncingSales) return;
    setSyncingSales(true);
    setSyncStatusMsg("Synchronizing offline sales...");
    
    let successCount = 0;
    const remainingSales = [...offlineSales];
    const failedSales: any[] = [];

    for (const sale of remainingSales) {
      const payload = {
        paymentMethod: sale.paymentMethod,
        paymentDetails: sale.paymentDetails,
        discountAmount: sale.discountAmount,
        taxAmount: sale.taxAmount,
        items: sale.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: 0
        }))
      };

      try {
        const res = await fetch("http://localhost:5149/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        } else {
          failedSales.push(sale);
        }
      } catch (err) {
        console.error("Failed to sync offline sale", sale.id, err);
        failedSales.push(sale);
      }
    }

    setOfflineSales(failedSales);
    if (failedSales.length > 0) {
      localStorage.setItem("vendora_offline_sales", JSON.stringify(failedSales));
      setSyncStatusMsg(`Synced ${successCount} sale(s). ${failedSales.length} failed to sync.`);
    } else {
      localStorage.removeItem("vendora_offline_sales");
      setSyncStatusMsg(`All offline sales (${successCount}) synced successfully!`);
    }
    
    setSyncingSales(false);
    fetchProducts();
    setTimeout(() => setSyncStatusMsg(""), 5050);
  };

  const fetchCashierStats = async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const res = await fetch("http://localhost:5149/api/sales/cashier-stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSalesHistory = async () => {
    if (!token) return;
    try {
      setLoadingHistory(true);
      const res = await fetch("http://localhost:5149/api/sales", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch sales history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === "performance") {
      fetchCashierStats();
      fetchSalesHistory();
    }
  }, [token, activeTab]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const manualDiscount = parseFloat(manualDiscountStr) || 0;
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "Percentage") {
      couponDiscount = subtotal * (appliedCoupon.value / 100);
    } else {
      couponDiscount = appliedCoupon.value;
    }
  }

  const discountAmount = Math.min(manualDiscount + couponDiscount, subtotal);
  const tax = Math.max(0, subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await fetch(`http://localhost:5149/api/coupons/validate/${couponCode.trim()}?cartTotal=${subtotal}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to validate coupon.");
      }
      const result = await res.json();
      if (result.isValid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          type: result.type,
          value: Number(result.value)
        });
        setCouponSuccess(result.message || "Coupon applied!");
      } else {
        setAppliedCoupon(null);
        setCouponError(result.message || "Invalid coupon.");
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Error validating coupon.");
    } finally {
      setValidatingCoupon(false);
    }
  };

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
        setBranchAddress(data.address || "");
        setBranchPhone(data.phone || "");
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
        localStorage.setItem("vendora_cached_products", JSON.stringify(data));
      } else {
        const cached = localStorage.getItem("vendora_cached_products");
        if (cached) {
          setProducts(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.error(err);
      const cached = localStorage.getItem("vendora_cached_products");
      if (cached) {
        setProducts(JSON.parse(cached));
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchReceiptSetting = async () => {
    if (!token) return;
    try {
      const url = user?.branchId 
        ? `http://localhost:5149/api/receipts?branchId=${user.branchId}`
        : `http://localhost:5149/api/receipts`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptSetting(data);
      }
    } catch (err) {
      console.error("Failed to fetch receipt settings", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranchInfo();
      fetchProducts();
      fetchReceiptSetting();
    }
  }, [token, user?.branchId]);

  useEffect(() => {
    if (appliedCoupon) {
      const checkMinCart = async () => {
        try {
          const res = await fetch(`http://localhost:5149/api/coupons/validate/${appliedCoupon.code}?cartTotal=${subtotal}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const result = await res.json();
            if (!result.isValid) {
              setAppliedCoupon(null);
              setCouponError(`Coupon removed: ${result.message}`);
              setCouponSuccess("");
            }
          }
        } catch (err) {
          console.error("Error revalidating coupon", err);
        }
      };
      checkMinCart();
    }
  }, [subtotal, token]);

  const addToCart = (product: any) => {
    if (product.totalStock <= 0) {
      alert("This item is currently out of stock!");
      return;
    }
    setShowSuccess(false);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.totalStock) {
          alert(`Cannot add more. Only ${product.totalStock} units available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer" | "POS" | "Mixed">("Cash");
  const [cashAmount, setCashAmount] = useState<number | string>(0);
  const [transferAmount, setTransferAmount] = useState<number | string>(0);
  const [posAmount, setPosAmount] = useState<number | string>(0);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const clearCart = () => {
    setCart([]);
    setShowSuccess(false);
    setCompletedSale(null);
    setManualDiscountStr("0");
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
    setAppliedCoupon(null);
  };

  const handleCheckoutInit = () => {
    if (cart.length === 0) return;
    
    // Check cashier limits on checkout initiation
    if (user?.role === "Cashier" && (discountAmount > 50 || (subtotal > 0 && discountAmount / subtotal > 0.15))) {
      alert("Checkout blocked: Discount exceeds cashier limit (max 15% of subtotal or ₦50,000.00).");
      return;
    }

    setPaymentMethod("Cash");
    setCashAmount(total);
    setTransferAmount(0);
    setPosAmount(0);
    setCheckoutError("");
    setShowCheckoutModal(true);
  };

  const handleCheckoutConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    setCheckoutSubmitting(true);

    if (paymentMethod === "Mixed") {
      const sum = Number(cashAmount) + Number(transferAmount) + Number(posAmount);
      if (Math.abs(sum - total) > 0.01) {
        setCheckoutError(`Mixed payment amounts (${sum.toFixed(2)}) must sum up to exactly the total amount (₦${total.toFixed(2)}).`);
        setCheckoutSubmitting(false);
        return;
      }
    }

    const payload = {
      paymentMethod,
      paymentDetails: paymentMethod === "Mixed" ? JSON.stringify({ cash: Number(cashAmount), transfer: Number(transferAmount), pos: Number(posAmount) }) : null,
      discountAmount,
      taxAmount: tax,
      couponCode: appliedCoupon?.code || null,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        discountAmount: 0
      }))
    };

    try {
      const res = await fetch("http://localhost:5149/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to complete checkout.");
      }

      const sale = await res.json();
      setCompletedSale(sale);
      setCart([]);
      setManualDiscountStr("0");
      setCouponCode("");
      setCouponError("");
      setCouponSuccess("");
      setAppliedCoupon(null);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
      fetchProducts();
    } catch (err: any) {
      console.error("Online checkout failed", err);
      const isNetworkError = !navigator.onLine || err.message?.includes("Failed to fetch") || err.name === "TypeError";
      
      if (isNetworkError) {
        const confirmOffline = window.confirm(
          "Network connection error detected. Would you like to process this sale offline? The transaction will be saved locally and syncs automatically once online."
        );
        if (confirmOffline) {
          const offlineSaleId = `offline_${Date.now()}`;
          const offlineSale = {
            id: offlineSaleId,
            isOffline: true,
            branchName: branchName,
            cashierName: `${user?.firstName} ${user?.lastName}`,
            createdAt: new Date().toISOString(),
            subtotal,
            discountAmount,
            taxAmount: tax,
            total,
            paymentMethod,
            paymentDetails: payload.paymentDetails,
            items: cart.map(item => ({
              id: `offline_item_${item.id}_${Date.now()}`,
              productId: item.id,
              productName: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.price * item.quantity
            }))
          };

          const updatedProducts = products.map(p => {
            const cartItem = cart.find(item => item.id === p.id);
            if (cartItem) {
              return {
                ...p,
                totalStock: Math.max(0, p.totalStock - cartItem.quantity)
              };
            }
            return p;
          });
          setProducts(updatedProducts);
          localStorage.setItem("vendora_cached_products", JSON.stringify(updatedProducts));

          const newQueue = [...offlineSales, offlineSale];
          setOfflineSales(newQueue);
          localStorage.setItem("vendora_offline_sales", JSON.stringify(newQueue));

          setCompletedSale(offlineSale);
          setCart([]);
          setManualDiscountStr("0");
          setCouponCode("");
          setCouponError("");
          setCouponSuccess("");
          setAppliedCoupon(null);
          setShowCheckoutModal(false);
          setShowReceiptModal(true);
          setCheckoutSubmitting(false);
          return;
        }
      }
      setCheckoutError(err.message || "An error occurred during checkout.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Barcode scanning simulator
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError("");
    const barcode = barcodeQuery.trim();
    if (!barcode) return;

    try {
      const res = await fetch(`http://localhost:5149/api/products/barcode/${barcode}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Product not found with this barcode.");
      }
      
      const product = await res.json();
      addToCart(product);
      setBarcodeQuery("");
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      setScanError(err.message || "Scanning failed.");
      setTimeout(() => setScanError(""), 3000);
    }
  };

  // Filter products by search text
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculations moved to top of component

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden font-sans print:hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md h-16 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={32} />
            <span className="font-bold text-lg flex items-center">
              <span className="text-foreground font-black">Vendora</span>
              <span className="text-[#10B981] font-medium ml-1">POS Pro</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              POS Terminal
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-950/45 px-2.5 py-1 rounded-full border border-slate-800 text-[10px]">
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              <span className="font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {offlineSales.length > 0 && (
              <button
                onClick={handleSyncSales}
                disabled={syncingSales}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all font-bold text-[10px] cursor-pointer"
              >
                <span>Sync Pending ({offlineSales.length})</span>
                {syncingSales && <span className="animate-spin text-[8px]">⌛</span>}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-355">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">Branch: {branchName}</p>
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="bg-indigo-650 text-white text-xs font-bold text-center py-2 px-4 shadow-md backdrop-blur-sm shrink-0 transition-all animate-in slide-in-from-top-1 duration-200">
          {syncStatusMsg}
        </div>
      )}

      {/* Sub-Header Navigation */}
      <div className="bg-slate-900/40 border-b border-slate-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6">
          <button
            onClick={() => setActiveTab("register")}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "register"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            New Sale (Register)
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "performance"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            History & Performance
          </button>
        </div>
      </div>

      {/* Mobile tabs switcher (Register tab only) */}
      {activeTab === "register" && (
        <div className="lg:hidden flex border-b border-slate-900 bg-slate-950/40 p-2 gap-2 shrink-0">
          <button
            onClick={() => setMobileActiveTab("catalog")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${
              mobileActiveTab === "catalog"
                ? "bg-indigo-650/20 text-indigo-400 border-indigo-500/50"
                : "bg-transparent border-transparent text-slate-400"
            }`}
          >
            Browse Catalog
          </button>
          <button
            onClick={() => setMobileActiveTab("cart")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
              mobileActiveTab === "cart"
                ? "bg-indigo-650/20 text-indigo-400 border-indigo-500/50"
                : "bg-transparent border-transparent text-slate-400"
            }`}
          >
            Receipt Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
        </div>
      )}

      {/* Main Grid: Conditional Render */}
      {activeTab === "register" ? (
        <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 relative">
          {/* Left Hand Side: Receipt / Register (40% width) */}
          <div className={`${mobileActiveTab === "cart" ? "flex" : "hidden"} lg:flex w-full lg:w-[400px] border border-slate-800 bg-slate-900/20 rounded-2xl flex-col overflow-hidden shrink-0`}>
            <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-200">Current Receipt</h3>
              <button
                onClick={clearCart}
                className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Cart List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {showSuccess && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-450 rounded-lg text-sm text-center">
                  🎉 Sale Complete! Receipt printed successfully.
                </div>
              )}
              
              {cart.length === 0 && !showSuccess ? (
                <div className="h-full flex flex-col justify-center items-center text-slate-500 space-y-2">
                  <span className="text-3xl">🛒</span>
                  <p className="text-sm">Receipt is empty.</p>
                  <p className="text-xs text-slate-600">Scan barcode or select products on the right</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-950/55 rounded-lg border border-slate-900">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-slate-200">{item.name}</p>
                      <p className="text-[10px] text-slate-550 font-mono">{item.sku}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x ₦{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-sm text-slate-350">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-600 hover:text-red-400 text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Calculations */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/50 space-y-3 shrink-0">
              {/* Promotions & Discounts */}
              <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Discounts & Coupons</span>
                </div>
                
                {/* Manual Discount */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400 w-20">Manual (₦):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualDiscountStr}
                    onChange={(e) => setManualDiscountStr(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-505"
                  />
                </div>

                {/* Coupon Code */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 w-20">Coupon:</span>
                    <div className="flex flex-1 gap-1">
                      <input
                        type="text"
                        placeholder="CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-505 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-[10px] font-bold rounded text-white"
                      >
                        {validatingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  </div>

                  {couponError && (
                    <p className="text-[10px] text-red-400 font-semibold pl-20">{couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="text-[10px] text-emerald-450 font-semibold pl-20">{couponSuccess}</p>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-[10px] text-indigo-400 bg-indigo-950/20 px-2 py-1 rounded border border-indigo-900/30">
                      <span>Active: <strong>{appliedCoupon.code}</strong> ({appliedCoupon.type === "Percentage" ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponSuccess("");
                          setCouponCode("");
                        }}
                        className="text-red-400 font-bold hover:text-red-350"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Cashier limit warning */}
                {user?.role === "Cashier" && (discountAmount > 50 || (subtotal > 0 && discountAmount / subtotal > 0.15)) && (
                  <div className="p-2 bg-red-950/40 border border-red-900/50 rounded text-[10px] text-red-400 font-bold">
                    ⚠️ Limit Exceeded: Cashiers cannot apply discounts &gt; 15% (${(subtotal * 0.15).toFixed(2)}) or ₦50,000.00.
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>₦{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Discount</span>
                  <span>-₦{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-400">
                <span>Tax (8%)</span>
                <span>₦{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-100 border-t border-slate-900 pt-3">
                <span>Total</span>
                <span className="text-indigo-400">₦{total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckoutInit}
                disabled={cart.length === 0 || (user?.role === "Cashier" && (discountAmount > 50 || (subtotal > 0 && discountAmount / subtotal > 0.15)))}
                className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all"
              >
                Collect Payment
              </button>
            </div>
          </div>

          {/* Right Hand Side: Catalog Grid (60% width) */}
          <div className={`${mobileActiveTab === "catalog" ? "flex" : "hidden"} lg:flex flex-1 flex flex-col space-y-4 overflow-hidden`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Product Directory</h3>
                <p className="text-xs text-slate-500">Search products or scan barcodes</p>
              </div>
              
              <div className="flex gap-2">
                {/* Barcode Search Form */}
                <form onSubmit={handleBarcodeSubmit} className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="[Scan Barcode]"
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    className="px-3 py-1.5 w-40 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-100 focus:outline-none"
                  />
                  {scanError && (
                    <span className="absolute bottom-[-18px] left-0 text-[9px] text-red-400 font-bold bg-slate-950 px-1.5 rounded border border-red-950">
                      {scanError}
                    </span>
                  )}
                </form>

                {/* Text Search Input */}
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 w-48 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Product Cards Grid */}
            {loadingProducts ? (
              <div className="text-sm text-slate-500 py-8">Loading branch catalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-sm text-slate-555 py-8">No products found matching filters.</div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.totalStock <= 0}
                    className="border border-slate-850 hover:border-indigo-500 disabled:opacity-50 bg-slate-900/10 hover:bg-slate-900/30 text-left p-4 rounded-xl flex flex-col justify-between h-36 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-900 border-l border-b border-slate-850 text-[9px] text-slate-400 group-hover:bg-indigo-650 group-hover:text-white transition-colors font-bold">
                      {p.categoryName || "Unassigned"}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="font-semibold text-slate-200 group-hover:text-white transition-colors text-sm truncate pr-4">
                        {p.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">{p.sku}</div>
                      <div className="text-[10px] text-slate-450">
                        Stock: <span className={p.underStockAlert ? "text-red-400 font-bold" : "text-emerald-450 font-bold"}>{p.totalStock}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <span className="text-base font-bold text-indigo-400 group-hover:text-indigo-300">
                        ₦{p.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-350 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                        {p.totalStock <= 0 ? "Out of Stock" : "+ Add"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History & Performance Tab Content */
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {loadingStats || !stats ? (
            <div className="text-sm text-slate-400 py-8 text-center bg-slate-900/20 border border-slate-900 rounded-2xl">
              Loading performance stats...
            </div>
          ) : (
            <>
              {/* Stats Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-100">₦{stats.todaySalesAmount.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-550 font-bold">{stats.todaySalesCount} sales completed</p>
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Sales</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-100">₦{stats.weeklySalesAmount.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-550 font-bold">{stats.weeklySalesCount} sales completed</p>
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Sales</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-100">₦{stats.monthlySalesAmount.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-550 font-bold">{stats.monthlySalesCount} sales completed</p>
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Sales</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-100">₦{stats.lifetimeSalesAmount.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-550 font-bold">{stats.lifetimeSalesCount} sales completed</p>
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-2 col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Transaction Value</span>
                  <div>
                    <h2 className="text-xl font-black text-indigo-400">₦{stats.averageTransactionValue.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-550 font-bold">Revenue per invoice</p>
                  </div>
                </div>
              </div>

              {/* Charts & Top lists */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trend Chart (2/3 width) */}
                <div className="md:col-span-2 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h3 className="font-bold text-slate-200">Personal Daily Trend</h3>
                    <p className="text-xs text-slate-500 mb-4">Past 7 days performance metrics</p>
                  </div>
                  <div className="flex items-end justify-between h-40 pt-6 px-4 bg-slate-950/20 border border-slate-900/40 rounded-xl">
                    {stats.dailySalesTrend.map((trend: any, index: number) => {
                      const maxAmt = Math.max(...stats.dailySalesTrend.map((t: any) => t.amount), 1);
                      const heightPct = (trend.amount / maxAmt) * 100;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 group relative">
                          <div className="absolute top-[-32px] bg-slate-900 border border-slate-800 text-slate-100 text-[9px] font-black py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl whitespace-nowrap">
                            ₦{trend.amount.toFixed(2)} ({trend.count} sales)
                          </div>
                          <div 
                            className="w-10 sm:w-14 bg-gradient-to-t from-indigo-600 to-purple-650 rounded-t group-hover:from-indigo-550 group-hover:to-purple-550 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
                            style={{ height: `${Math.max(6, heightPct)}%` }}
                          ></div>
                          <span className="text-[9px] text-slate-550 mt-2 font-mono font-semibold">
                            {new Date(trend.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top selling & Payments (1/3 width) */}
                <div className="space-y-6">
                  {/* Top Products */}
                  <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl">
                    <h3 className="font-bold text-slate-200 mb-1">Top Products Sold</h3>
                    <p className="text-xs text-slate-500 mb-4">Your personal highest volume catalog items</p>
                    
                    {stats.topProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No sales registered yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.topProducts.map((tp: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-300 truncate max-w-[150px]">{tp.productName}</span>
                              <span className="text-slate-455 font-mono text-[11px] font-bold">
                                {tp.quantitySold} units (₦{tp.totalRevenue.toFixed(2)})
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-850">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" 
                                style={{ width: `${Math.min(100, (tp.quantitySold / Math.max(1, stats.topProducts[0]?.quantitySold)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl">
                    <h3 className="font-bold text-slate-200 mb-1">Payment Breakdowns</h3>
                    <p className="text-xs text-slate-500 mb-4">Distribution by collected methods</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {["Cash", "POS", "Transfer", "Mixed"].map((method) => {
                        const amt = stats.paymentMethodAmounts[method] || 0;
                        const count = stats.paymentMethodCounts[method] || 0;
                        const pct = stats.lifetimeSalesAmount > 0 ? (amt / stats.lifetimeSalesAmount) * 100 : 0;
                        return (
                          <div key={method} className="bg-slate-955 p-3 border border-slate-900 rounded-xl flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{method}</span>
                            <div className="mt-1">
                              <p className="text-sm font-black text-indigo-400">₦{amt.toFixed(2)}</p>
                              <p className="text-[9px] text-slate-550 font-bold">{count} items ({pct.toFixed(0)}%)</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Sales History Table */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-900">
                  <h3 className="font-bold text-slate-200">Personal Sales History</h3>
                  <p className="text-xs text-slate-500">All checkout transactions processed by you</p>
                </div>
                
                {loadingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading checkout history...</div>
                ) : salesHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">You haven't processed any transactions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          <th className="p-4">Invoice ID</th>
                          <th className="p-4">Date/Time</th>
                          <th className="p-4">Items Count</th>
                          <th className="p-4">Payment Mode</th>
                          <th className="p-4 text-right">Subtotal</th>
                          <th className="p-4 text-right">Discounts</th>
                          <th className="p-4 text-right">Total Paid</th>
                          <th className="p-4 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {salesHistory.map((sale: any) => {
                          const itemsCount = sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                          return (
                            <tr key={sale.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="p-4 font-mono text-[11px] text-slate-400">{sale.id.substring(0, 8).toUpperCase()}...</td>
                              <td className="p-4 text-slate-300">{new Date(sale.createdAt).toLocaleString()}</td>
                              <td className="p-4 font-semibold text-slate-400">{itemsCount} units</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sale.paymentMethod === "Cash" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30" :
                                  sale.paymentMethod === "POS" ? "bg-blue-950/50 text-blue-400 border border-blue-900/30" :
                                  sale.paymentMethod === "Transfer" ? "bg-purple-950/50 text-purple-400 border border-purple-900/30" :
                                  "bg-yellow-950/50 text-yellow-400 border border-yellow-900/30"
                                }`}>
                                  {sale.paymentMethod}
                                </span>
                              </td>
                              <td className="p-4 text-right text-slate-400">₦{sale.subtotal.toFixed(2)}</td>
                              <td className="p-4 text-right text-red-400">
                                {sale.discountAmount > 0 ? `-₦${sale.discountAmount.toFixed(2)}` : "-"}
                              </td>
                              <td className="p-4 text-right font-bold text-slate-200">₦{sale.total.toFixed(2)}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={async () => {
                                    // Set completed sale directly from history to launch receipt preview modal
                                    setCompletedSale(sale);
                                    setShowReceiptModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-350 hover:text-slate-100 transition-all active:scale-[0.97]"
                                >
                                  View / Print
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Collect Payment</h3>
            <p className="text-xs text-slate-500 mb-4">Select the payment method and enter details.</p>
            
            {checkoutError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">
                {checkoutError}
              </div>
            )}
            
            <form onSubmit={handleCheckoutConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-355 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Cash", "Transfer", "POS", "Mixed"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method === "Cash") {
                          setCashAmount(total);
                          setTransferAmount(0);
                          setPosAmount(0);
                        } else if (method === "Transfer") {
                          setCashAmount(0);
                          setTransferAmount(total);
                          setPosAmount(0);
                        } else if (method === "POS") {
                          setCashAmount(0);
                          setTransferAmount(0);
                          setPosAmount(total);
                        } else {
                          setCashAmount(0);
                          setTransferAmount(0);
                          setPosAmount(0);
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        paymentMethod === method
                          ? "bg-indigo-650/20 text-indigo-400 border-indigo-500/50"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Mixed" && (
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3 animate-in slide-in-from-top-3 duration-250">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Cash Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashAmount || ""}
                        onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-md text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Transfer Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={transferAmount || ""}
                        onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-md text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">POS Card Amt</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={posAmount || ""}
                        onChange={(e) => setPosAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-md text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  {/* Mixed Remaining Calculations */}
                  {(() => {
                    const currentSum = Number(cashAmount) + Number(transferAmount) + Number(posAmount);
                    const remaining = total - currentSum;
                    return (
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-slate-500">Collected: <span className="text-slate-350 font-bold">₦{currentSum.toFixed(2)}</span> / ₦{total.toFixed(2)}</span>
                        {Math.abs(remaining) <= 0.01 ? (
                          <span className="text-emerald-400 font-bold">✓ Fully Allocated</span>
                        ) : remaining > 0 ? (
                          <span className="text-yellow-450 font-semibold">Remaining: <span className="font-bold">₦{remaining.toFixed(2)}</span></span>
                        ) : (
                          <span className="text-red-400 font-semibold">Overallocated: <span className="font-bold">${Math.abs(remaining).toFixed(2)}</span></span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="border-t border-slate-850 pt-4 mt-2 flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Due:</span>
                <span className="text-lg font-bold text-indigo-400">₦{total.toFixed(2)}</span>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg hover:bg-slate-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutSubmitting || (paymentMethod === "Mixed" && Math.abs(Number(cashAmount) + Number(transferAmount) + Number(posAmount) - total) > 0.01)}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {checkoutSubmitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-100">Receipt Preview</h3>
              <span className="text-xs bg-slate-850 px-2 py-1 rounded text-slate-400 font-medium">
                Layout: {receiptSetting?.receiptLayout || "Thermal"}
              </span>
            </div>

            {/* Preview Box */}
            <div className="flex-1 bg-white text-slate-900 p-6 rounded-xl overflow-y-auto max-h-[60vh] border border-slate-200">
              {receiptSetting?.receiptLayout === "A4" ? (
                /* A4 Invoice Preview */
                <div className="font-sans text-xs space-y-6" style={{ borderColor: receiptSetting?.customBrandingColor || "#6366F1" }}>
                  {/* Top Header */}
                  <div className="flex justify-between items-start border-b pb-4" style={{ borderBottomColor: receiptSetting?.customBrandingColor || "#6366F1" }}>
                    <div>
                      {receiptSetting?.showLogo && receiptSetting?.logoUrl ? (
                        <img src={receiptSetting.logoUrl} alt="Logo" className="max-h-12 max-w-[150px] mb-2 object-contain" />
                      ) : (
                        <div className="h-10 w-10 bg-slate-200 rounded flex items-center justify-center font-bold text-slate-600 mb-2">Logo</div>
                      )}
                      <h2 className="text-base font-black tracking-tight">{receiptSetting?.businessName || "VENDORA POS PRO"}</h2>
                      {receiptSetting?.showBranchDetails && (
                        <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          <p className="font-semibold text-slate-700">{completedSale.branchName}</p>
                          {branchAddress && <p>{branchAddress}</p>}
                          {branchPhone && <p>Phone: {branchPhone}</p>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-black uppercase tracking-wider" style={{ color: receiptSetting?.customBrandingColor || "#6366F1" }}>INVOICE</h1>
                      <p className="text-[10px] font-semibold text-slate-500 mt-1">Invoice ID: {completedSale.id.toUpperCase()}</p>
                      <p className="text-[10px] text-slate-500">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
                      {receiptSetting?.showCashierInfo && (
                        <p className="text-[10px] text-slate-500 mt-2">
                          Cashier: <span className="font-semibold">{completedSale.cashierName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bill To */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Details</h4>
                    <p className="font-semibold text-slate-700">Payment: {completedSale.paymentMethod}</p>
                    {completedSale.paymentMethod === "Mixed" && completedSale.paymentDetails && (
                      (() => {
                        try {
                          const parsed = JSON.parse(completedSale.paymentDetails);
                          return (
                            <p className="text-[10px] text-slate-500">
                              (Cash: ${parsed.cash.toFixed(2)} | Transfer: ${parsed.transfer.toFixed(2)} | Card: ${parsed.pos.toFixed(2)})
                            </p>
                          );
                        } catch (e) { return null; }
                      })()
                    )}
                  </div>

                  {/* Invoice Table */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b text-[10px] text-slate-500 uppercase font-semibold" style={{ borderBottomColor: receiptSetting?.customBrandingColor || "#6366F1" }}>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedSale.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-2.5 font-mono text-[10px] text-slate-500">{item.sku}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-2.5 text-right text-slate-650">{item.quantity}</td>
                          <td className="py-2.5 text-right text-slate-650">₦{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">₦{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculations */}
                  <div className="flex justify-end pt-4">
                    <div className="w-48 space-y-1.5 text-right">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-800">₦{completedSale.subtotal.toFixed(2)}</span>
                      </div>
                      {completedSale.discountAmount > 0 && (
                        <div className="flex justify-between text-[10px] text-red-600 font-semibold">
                          <span>Discount</span>
                          <span>-₦{completedSale.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Sales Tax (8%)</span>
                        <span className="font-medium text-slate-800">₦{completedSale.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-sm font-black" style={{ borderTopColor: receiptSetting?.customBrandingColor || "#6366F1", color: receiptSetting?.customBrandingColor || "#6366F1" }}>
                        <span>Total Paid</span>
                        <span>₦{completedSale.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer & QR Verification */}
                  <div className="flex justify-between items-end border-t pt-4 border-slate-100 mt-6">
                    <div className="max-w-[70%] space-y-2">
                      {receiptSetting?.headerText && (
                        <p className="text-[10px] text-slate-550 italic leading-relaxed">
                          Note: {receiptSetting.headerText}
                        </p>
                      )}
                      {receiptSetting?.footerText && (
                        <p className="text-[10px] font-medium text-slate-600">
                          {receiptSetting.footerText}
                        </p>
                      )}
                    </div>
                    {receiptSetting?.showQRCode && (
                      <div className="text-center space-y-1">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/${completedSale.id}`)}`}
                          alt="Verification QR"
                          className="w-16 h-16 object-contain border p-1 rounded"
                        />
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Verify Receipt</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Thermal Layout Preview */
                <div className="font-mono text-[11px] leading-relaxed text-slate-800 space-y-4">
                  {/* Top Header */}
                  <div className="text-center space-y-1 pb-3 border-b border-dashed">
                    {receiptSetting?.showLogo && receiptSetting?.logoUrl && (
                      <div className="flex justify-center mb-2">
                        <img src={receiptSetting.logoUrl} alt="Logo" className="max-h-10 max-w-[120px] object-contain" />
                      </div>
                    )}
                    <h3 className="text-xs font-black tracking-wider">{receiptSetting?.businessName || "VENDORA POS PRO"}</h3>
                    {receiptSetting?.showBranchDetails && (
                      <div className="text-[10px] text-slate-500">
                        <p className="font-bold">{completedSale.branchName}</p>
                        {branchAddress && <p>{branchAddress}</p>}
                        {branchPhone && <p>Phone: {branchPhone}</p>}
                      </div>
                    )}
                    {receiptSetting?.headerText && (
                      <p className="text-[10px] text-slate-600 italic pt-1">{receiptSetting.headerText}</p>
                    )}
                    <p className="text-[9px] text-slate-400 mt-1">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400">ID: {completedSale.id.substring(0, 8).toUpperCase()}</p>
                  </div>

                  {/* Cashier */}
                  {receiptSetting?.showCashierInfo && (
                    <div className="text-[9px] text-slate-500">
                      <span>Cashier: {completedSale.cashierName}</span>
                    </div>
                  )}

                  {/* Sales Items */}
                  <div className="space-y-2 py-2 border-b border-dashed">
                    {completedSale.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="font-bold">{item.productName}</p>
                          <p className="text-[9px] text-slate-500">{item.sku}</p>
                          <p className="text-[9px] text-slate-500">
                            {item.quantity} x ₦{item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-bold">₦{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1 pt-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₦{completedSale.subtotal.toFixed(2)}</span>
                    </div>
                    {completedSale.discountAmount > 0 && (
                      <div className="flex justify-between text-red-650 font-bold">
                        <span>Discount</span>
                        <span>-₦{completedSale.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Sales Tax</span>
                      <span>₦{completedSale.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold border-t border-double pt-2 text-slate-900">
                      <span>TOTAL</span>
                      <span>₦{completedSale.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-2 bg-slate-50 border rounded space-y-1 text-[9px] text-slate-655">
                    <div className="flex justify-between">
                      <span>Payment Mode:</span>
                      <span className="font-bold">{completedSale.paymentMethod}</span>
                    </div>
                    {completedSale.paymentMethod === "Mixed" && completedSale.paymentDetails && (
                      (() => {
                        try {
                          const parsed = JSON.parse(completedSale.paymentDetails);
                          return (
                            <div className="pl-2 border-l space-y-0.5 mt-1 font-bold">
                              {parsed.cash > 0 && <div className="flex justify-between"><span>• Cash:</span><span>${parsed.cash.toFixed(2)}</span></div>}
                              {parsed.transfer > 0 && <div className="flex justify-between"><span>• Transfer:</span><span>${parsed.transfer.toFixed(2)}</span></div>}
                              {parsed.pos > 0 && <div className="flex justify-between"><span>• Card:</span><span>${parsed.pos.toFixed(2)}</span></div>}
                            </div>
                          );
                        } catch (e) { return null; }
                      })()
                    )}
                  </div>

                  {/* Footer message */}
                  <div className="text-center pt-3 border-t border-dashed text-[9px] text-slate-550 space-y-1">
                    {receiptSetting?.footerText ? (
                      <p className="font-bold">{receiptSetting.footerText}</p>
                    ) : (
                      <p className="font-bold">Thank you for your patronage!</p>
                    )}
                    <p>Please keep this receipt.</p>
                  </div>

                  {/* QR Verification */}
                  {receiptSetting?.showQRCode && (
                    <div className="flex flex-col items-center pt-4 mt-2 border-t border-dashed space-y-1.5">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/${completedSale.id}`)}`}
                        alt="Verification QR"
                        className="w-20 h-20 object-contain p-1 border rounded bg-white"
                      />
                      <p className="text-[8px] font-bold text-slate-450 uppercase tracking-wider text-center">Verify Transaction</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setCompletedSale(null);
                }}
                className="py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-750 transition-colors"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating bottom action bar for mobile catalog */}
      {activeTab === "register" && mobileActiveTab === "catalog" && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between border border-indigo-500/30 animate-in slide-in-from-bottom-5 duration-300 z-40">
          <div>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Active Receipt</p>
            <p className="text-sm font-black">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Units | ₦{total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setMobileActiveTab("cart")}
            className="px-4 py-2 bg-white text-indigo-700 font-black text-xs rounded-lg shadow-md hover:bg-slate-50 transition-all active:scale-[0.97]"
          >
            View Cart ➔
          </button>
        </div>
      )}
      </div>

      {/* Print-only container */}
      {completedSale && (
        <div className="hidden print:block font-sans text-slate-900 bg-white min-h-screen">
          {receiptSetting?.receiptLayout === "A4" ? (
            /* A4 Print Layout */
            <div className="p-8 max-w-[210mm] mx-auto space-y-8" style={{ fontSize: "12px" }}>
              {/* Top Header */}
              <div className="flex justify-between items-start border-b pb-6" style={{ borderColor: receiptSetting?.customBrandingColor || "#6366F1" }}>
                <div>
                  {receiptSetting?.showLogo && receiptSetting?.logoUrl && (
                    <img src={receiptSetting.logoUrl} alt="Logo" className="max-h-16 max-w-[200px] mb-3 object-contain" />
                  )}
                  <h1 className="text-xl font-black tracking-tight">{receiptSetting?.businessName || "VENDORA POS PRO"}</h1>
                  {receiptSetting?.showBranchDetails && (
                    <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      <p className="font-bold text-slate-700">{completedSale.branchName}</p>
                      {branchAddress && <p>{branchAddress}</p>}
                      {branchPhone && <p>Phone: {branchPhone}</p>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black uppercase tracking-wider" style={{ color: receiptSetting?.customBrandingColor || "#6366F1" }}>INVOICE</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Invoice ID: {completedSale.id.toUpperCase()}</p>
                  <p className="text-xs text-slate-500">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
                  {receiptSetting?.showCashierInfo && (
                    <p className="text-xs text-slate-500 mt-2">
                      Cashier: <span className="font-semibold">{completedSale.cashierName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bill/Pay Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Details</h3>
                  <p className="font-bold text-slate-750">{completedSale.paymentMethod}</p>
                  {completedSale.paymentMethod === "Mixed" && completedSale.paymentDetails && (
                    (() => {
                      try {
                        const parsed = JSON.parse(completedSale.paymentDetails);
                        return (
                          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                            {parsed.cash > 0 && <p>Cash: ${parsed.cash.toFixed(2)}</p>}
                            {parsed.transfer > 0 && <p>Transfer: ${parsed.transfer.toFixed(2)}</p>}
                            {parsed.pos > 0 && <p>Card POS: ${parsed.pos.toFixed(2)}</p>}
                          </div>
                        );
                      } catch (e) { return null; }
                    })()
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="border-b uppercase font-bold text-slate-500" style={{ borderColor: receiptSetting?.customBrandingColor || "#6366F1" }}>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSale.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                      <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">₦{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-slate-800">₦{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">₦{completedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Discount</span>
                      <span>-₦{completedSale.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Sales Tax (8%)</span>
                    <span className="font-semibold text-slate-800">₦{completedSale.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2.5 text-base font-black" style={{ borderColor: receiptSetting?.customBrandingColor || "#6366F1", color: receiptSetting?.customBrandingColor || "#6366F1" }}>
                    <span>Total Paid</span>
                    <span>₦{completedSale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom section */}
              <div className="flex justify-between items-end border-t pt-6 border-slate-100 mt-12">
                <div className="max-w-[65%] space-y-2">
                  {receiptSetting?.headerText && (
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      Note: {receiptSetting.headerText}
                    </p>
                  )}
                  {receiptSetting?.footerText && (
                    <p className="text-[11px] font-bold text-slate-600">
                      {receiptSetting.footerText}
                    </p>
                  )}
                </div>
                {receiptSetting?.showQRCode && (
                  <div className="text-center space-y-1">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/${completedSale.id}`)}`}
                      alt="Verification QR"
                      className="w-20 h-20 object-contain p-1 border rounded bg-white"
                    />
                    <p className="text-[8px] font-black text-slate-450 tracking-wider uppercase">Verify Receipt</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Thermal Print Layout (80mm Width optimized) */
            <div className="mx-auto p-4 w-[74mm] font-mono" style={{ fontSize: "11px", lineHeight: "1.4" }}>
              {/* Store Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                {receiptSetting?.showLogo && receiptSetting?.logoUrl && (
                  <div className="flex justify-center mb-2">
                    <img src={receiptSetting.logoUrl} alt="Logo" className="max-h-12 max-w-[150px] object-contain" />
                  </div>
                )}
                <h3 className="text-xs font-black tracking-widest">{receiptSetting?.businessName || "VENDORA POS PRO"}</h3>
                {receiptSetting?.showBranchDetails && (
                  <div className="text-[10px] text-slate-600">
                    <p className="font-bold">{completedSale.branchName}</p>
                    {branchAddress && <p>{branchAddress}</p>}
                    {branchPhone && <p>Phone: {branchPhone}</p>}
                  </div>
                )}
                {receiptSetting?.headerText && (
                  <p className="text-[9px] text-slate-650 italic pt-0.5">{receiptSetting.headerText}</p>
                )}
                <p className="text-[9px] text-slate-500 mt-1">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
                <p className="text-[9px] text-slate-500 font-bold">ID: {completedSale.id.toUpperCase()}</p>
              </div>

              {/* Cashier Info */}
              {receiptSetting?.showCashierInfo && (
                <div className="py-2 border-b border-dashed border-slate-400 text-[9px] text-slate-600">
                  <span>Cashier: {completedSale.cashierName}</span>
                </div>
              )}

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
                {completedSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start text-[10px]">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-[9px] text-slate-500">{item.sku}</p>
                      <p className="text-[9px] text-slate-500">
                        {item.quantity} x ₦{item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold shrink-0">₦{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial calculations */}
              <div className="py-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Discount</span>
                    <span>-₦{completedSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Sales Tax (8%)</span>
                  <span>₦{completedSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-double border-slate-900 pt-2">
                  <span>TOTAL PAID</span>
                  <span>₦{completedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-2 bg-slate-50 border rounded-md text-[9px] text-slate-655 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Payment Mode:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === "Mixed" && completedSale.paymentDetails && (
                  (() => {
                    try {
                      const parsed = JSON.parse(completedSale.paymentDetails);
                      return (
                        <div className="pl-2 border-l border-slate-300 space-y-0.5 mt-1">
                          {parsed.cash > 0 && <div className="flex justify-between"><span>• Cash:</span><span>${parsed.cash.toFixed(2)}</span></div>}
                          {parsed.transfer > 0 && <div className="flex justify-between"><span>• Transfer:</span><span>${parsed.transfer.toFixed(2)}</span></div>}
                          {parsed.pos > 0 && <div className="flex justify-between"><span>• Card POS:</span><span>${parsed.pos.toFixed(2)}</span></div>}
                        </div>
                      );
                    } catch (e) { return null; }
                  })()
                )}
              </div>

              {/* Footer text */}
              <div className="text-center pt-4 text-[9px] text-slate-650 space-y-1">
                {receiptSetting?.footerText ? (
                  <p className="font-bold">{receiptSetting.footerText}</p>
                ) : (
                  <p className="font-bold">Thank you for your patronage!</p>
                )}
                <p>Please keep this receipt for verification.</p>
              </div>

              {/* QR Code */}
              {receiptSetting?.showQRCode && (
                <div className="flex flex-col items-center pt-4 border-t border-dashed border-slate-400 mt-4 space-y-1.5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/₦{completedSale.id}`)}`}
                    alt="Verification QR"
                    className="w-24 h-24 object-contain border p-1 bg-white rounded"
                  />
                  <p className="text-[8px] font-bold text-slate-450 tracking-wide uppercase">Scan to Verify</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
