"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

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
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Search & Barcode scanning states
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [scanError, setScanError] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleCheckoutInit = () => {
    if (cart.length === 0) return;
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
        setCheckoutError(`Mixed payment amounts (${sum.toFixed(2)}) must sum up to exactly the total amount (${total.toFixed(2)}).`);
        setCheckoutSubmitting(false);
        return;
      }
    }

    const payload = {
      paymentMethod,
      paymentDetails: paymentMethod === "Mixed" ? JSON.stringify({ cash: Number(cashAmount), transfer: Number(transferAmount), pos: Number(posAmount) }) : null,
      discountAmount: 0,
      taxAmount: tax,
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
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
      fetchProducts();
    } catch (err: any) {
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

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% sales tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md h-16 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 bg-gradient-to-br from-indigo-500 to-purple-650">
              V
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Vendora POS Pro
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              POS Terminal
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-350">
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

      {/* Main Grid: Split Screen */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left Hand Side: Receipt / Register (40% width) */}
        <div className="w-full md:w-[400px] border border-slate-800 bg-slate-900/20 rounded-2xl flex flex-col overflow-hidden">
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
                      {item.quantity} x ${item.price.toFixed(2)}
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
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-100 border-t border-slate-900 pt-3">
              <span>Total</span>
              <span className="text-indigo-400">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckoutInit}
              disabled={cart.length === 0}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all"
            >
              Collect Payment
            </button>
          </div>
        </div>

        {/* Right Hand Side: Catalog Grid (60% width) */}
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
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
                      ${p.price.toFixed(2)}
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
                        <span className="text-slate-500">Collected: <span className="text-slate-350 font-bold">${currentSum.toFixed(2)}</span> / ${total.toFixed(2)}</span>
                        {Math.abs(remaining) <= 0.01 ? (
                          <span className="text-emerald-400 font-bold">✓ Fully Allocated</span>
                        ) : remaining > 0 ? (
                          <span className="text-yellow-450 font-semibold">Remaining: <span className="font-bold">${remaining.toFixed(2)}</span></span>
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
                <span className="text-lg font-bold text-indigo-400">${total.toFixed(2)}</span>
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

      {/* Thermal Receipt Print Modal */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl flex flex-col font-mono text-xs">
            {/* Store details */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <h3 className="text-sm font-bold tracking-wider">VENDORA POS PRO</h3>
              <p className="text-[10px] text-slate-500">{completedSale.branchName}</p>
              <p className="text-[9px] text-slate-400">Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400">Receipt ID: {completedSale.id.substring(0, 8).toUpperCase()}</p>
            </div>

            {/* Cashier information */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[9px] text-slate-500">
              <span>Cashier: {completedSale.cashierName}</span>
            </div>

            {/* Sales Items */}
            <div className="flex-1 py-4 space-y-3 max-h-60 overflow-y-auto">
              {completedSale.items.map((item: any) => (
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
                <span>${completedSale.subtotal.toFixed(2)}</span>
              </div>
              {completedSale.discountAmount > 0 && (
                <div className="flex justify-between text-red-650 font-bold">
                  <span>Discount</span>
                  <span>-${completedSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax</span>
                <span>${completedSale.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-double border-slate-400 pt-2 text-slate-900">
                <span>TOTAL</span>
                <span>${completedSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-[9px] text-slate-600">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold tracking-wide">{completedSale.paymentMethod}</span>
              </div>
              {completedSale.paymentMethod === "Mixed" && completedSale.paymentDetails && (
                (() => {
                  try {
                    const parsed = JSON.parse(completedSale.paymentDetails);
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
              <p className="font-bold text-slate-600">Thank you for your patronage!</p>
              <p>Please keep this receipt as proof of purchase.</p>
            </div>

            <button
              onClick={() => {
                setShowReceiptModal(false);
                setCompletedSale(null);
              }}
              className="mt-6 py-2.5 w-full bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
