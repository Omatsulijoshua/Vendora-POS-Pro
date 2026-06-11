"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function ManagerDashboard() {
  const { user, token, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [branchName, setBranchName] = useState("Loading branch...");
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "stock" | "transfers" | "sales" | "promo" | "receipt" | "audit-logs" | "notifications">("overview");

  // Phase 16 Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoadingNotifications(true);
    try {
      const res = await fetch("http://localhost:5149/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5149/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

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
  const [refundingSaleId, setRefundingSaleId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [filterCashierId, setFilterCashierId] = useState("");

  // Phase 14 Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

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
  const [stockModalTab, setStockModalTab] = useState<'add' | 'correct'>('add');
  const [adjQuantityToAdd, setAdjQuantityToAdd] = useState("");
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

  // Fetch staff (cashiers) for manager's branch
  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await fetch("http://localhost:5149/api/staff", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch sales history
  const fetchSales = async (cashierId?: string) => {
    try {
      setLoadingSales(true);
      const params = new URLSearchParams();
      const cId = cashierId !== undefined ? cashierId : filterCashierId;
      if (cId) params.append("cashierId", cId);

      const res = await fetch(`http://localhost:5149/api/sales?${params.toString()}`, {
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

  const fetchAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const res = await fetch("http://localhost:5149/api/audit-logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleRefundSale = async (id: string) => {
    if (!confirm("Are you sure you want to refund this transaction? This will restock all items and cannot be undone.")) return;
    try {
      setRefundingSaleId(id);
      const res = await fetch(`http://localhost:5149/api/sales/${id}/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("Transaction refunded successfully.");
        setShowReceiptDetailModal(false);
        setSelectedSale(null);
        fetchSales();
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to refund sale.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during refund processing.");
    } finally {
      setRefundingSaleId(null);
    }
  };

  useEffect(() => {
    if (token && activeTab === "audit-logs") {
      fetchAuditLogs();
    }
    if (token && activeTab === "notifications") {
      fetchNotifications();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token) {
      fetchBranchInfo();
      fetchProducts();
      fetchBranches();
      fetchTransfers();
      fetchSales();
      fetchDiscounts();
      fetchCoupons();
      fetchStaff();
    }
  }, [token, user?.branchId]);

  // Adjust / Add Stock Submit
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError("");
    setAdjSubmitting(true);
    try {
      const isAdd = stockModalTab === "add";
      const endpoint = isAdd ? "add-stock" : "adjust-stock";
      const payload = isAdd ? {
        branchId: user?.branchId,
        quantityToAdd: parseInt(adjQuantityToAdd) || 0,
        reason: adjReason.trim()
      } : {
        branchId: user?.branchId,
        quantity: adjQuantity,
        minStockLevel: adjMinLevel,
        reason: adjReason.trim()
      };

      const res = await fetch(`http://localhost:5149/api/products/${selectedProduct.id}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update stock.");
      }

      setAdjReason("");
      setAdjQuantityToAdd("");
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

  // Phase 10 Receipt settings states
  const [receiptHeaderText, setReceiptHeaderText] = useState("");
  const [receiptFooterText, setReceiptFooterText] = useState("");
  const [receiptShowLogo, setReceiptShowLogo] = useState(true);
  const [receiptShowBranchDetails, setReceiptShowBranchDetails] = useState(true);
  const [receiptShowCashierInfo, setReceiptShowCashierInfo] = useState(true);
  const [receiptShowQRCode, setReceiptShowQRCode] = useState(true);
  const [receiptLayout, setReceiptLayout] = useState("Thermal");
  const [receiptCustomBrandingColor, setReceiptCustomBrandingColor] = useState("#6366F1");
  const [receiptLogoUrl, setReceiptLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [receiptSaveSuccess, setReceiptSaveSuccess] = useState("");
  const [receiptSaveError, setReceiptSaveError] = useState("");
  const [receiptConfigName, setReceiptConfigName] = useState("Vendora Inventory Management System");

  const fetchReceiptSettingsForManager = async () => {
    if (!token || !user?.branchId) return;
    try {
      const res = await fetch(`http://localhost:5149/api/receipts?branchId=${user.branchId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptHeaderText(data.headerText || "");
        setReceiptFooterText(data.footerText || "");
        setReceiptShowLogo(data.showLogo);
        setReceiptShowBranchDetails(data.showBranchDetails);
        setReceiptShowCashierInfo(data.showCashierInfo);
        setReceiptShowQRCode(data.showQRCode);
        setReceiptLayout(data.receiptLayout || "Thermal");
        setReceiptCustomBrandingColor(data.customBrandingColor || "#6366F1");
        setReceiptLogoUrl(data.logoUrl);
        setReceiptConfigName(data.businessName || "Vendora Inventory Management System");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptSaveSuccess("");
    setReceiptSaveError("");
    try {
      const payload = {
        branchId: user?.branchId,
        logoUrl: receiptLogoUrl,
        headerText: receiptHeaderText.trim() || null,
        footerText: receiptFooterText.trim() || null,
        showLogo: receiptShowLogo,
        showBranchDetails: receiptShowBranchDetails,
        showCashierInfo: receiptShowCashierInfo,
        showQRCode: receiptShowQRCode,
        receiptLayout: receiptLayout,
        customBrandingColor: receiptCustomBrandingColor
      };
      
      const res = await fetch("http://localhost:5149/api/receipts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update receipt settings.");
      }
      
      setReceiptSaveSuccess("Receipt settings updated successfully!");
      setTimeout(() => setReceiptSaveSuccess(""), 4000);
      
      fetchReceiptSettingsForManager();
    } catch (err: any) {
      setReceiptSaveError(err.message || "Failed to save settings.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    setReceiptSaveSuccess("");
    setReceiptSaveError("");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://localhost:5149/api/receipts/upload-logo", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to upload logo.");
      }
      
      const data = await res.json();
      setReceiptLogoUrl(data.logoUrl);
      setReceiptSaveSuccess("Logo uploaded successfully! Remember to save settings.");
      setTimeout(() => setReceiptSaveSuccess(""), 4000);
    } catch (err: any) {
      setReceiptSaveError(err.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (token && user?.branchId) {
      fetchReceiptSettingsForManager();
    }
  }, [token, user?.branchId]);

  // Derived stats
  const lowStockItems = products.filter(p => p.underStockAlert);
  const totalStockCount = products.reduce((acc, p) => acc + p.totalStock, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={32} />
            <span className="font-bold text-lg flex flex-wrap items-center gap-x-1">
              <span className="text-foreground font-black">Vendora</span>
              <span className="text-[#10B981] font-medium ml-1">Inventory Management System</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
              Manager Panel
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell token={token} onViewAll={() => setActiveTab("notifications")} />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">Branch: {branchName}</p>
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
          <button
            onClick={() => setActiveTab("receipt")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "receipt" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Receipt Settings
          </button>
          <button
            onClick={() => setActiveTab("audit-logs")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "audit-logs" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "notifications" ? "border-emerald-500 text-emerald-450" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Notifications
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Branch Daily Sales", value: `₦${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, desc: "Total branch checkout value" },
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
                        <td className="py-3 px-4">₦{p.price.toFixed(2)}</td>
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
                              setStockModalTab('add');
                              setAdjQuantityToAdd("");
                              const currentStock = p.branchStocks?.find((bs: any) => bs.branchId === user?.branchId) || { quantity: p.totalStock, minStockLevel: 10 };
                              setAdjQuantity(currentStock.quantity);
                              setAdjMinLevel(currentStock.minStockLevel);
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
                onClick={() => fetchSales(filterCashierId)}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-lg transition-colors border border-slate-800"
              >
                Refresh Logs
              </button>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cashier / Staff</label>
                <select
                  value={filterCashierId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setFilterCashierId(cId);
                    fetchSales(cId);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Cashiers</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                  ))}
                </select>
              </div>
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
                          {sale.isRefunded && (
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Refunded
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{sale.items.length} items</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-200">₦{sale.total.toFixed(2)}</td>
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
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shadow-md shadow-primary/20"
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
                            {c.type === "Percentage" ? `${c.value}%` : `₦${c.value.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4">
                            {c.minCartAmount ? `₦${c.minCartAmount.toFixed(2)}` : "None"}
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
                            {d.type === "Percentage" ? `${d.value}%` : `₦${d.value.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4">
                            {d.target === "Cart" ? (
                              d.minCartAmount ? `Min Spend: ₦${d.minCartAmount.toFixed(2)}` : "No Min Spend"
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

        {activeTab === "receipt" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Receipt Customization</h3>
                <p className="text-xs text-slate-500">Configure layouts, logos, headers, footers, and verification QR codes for this branch</p>
              </div>
            </div>

            {/* Main Content Layout: Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Settings (7 cols) */}
              <div className="lg:col-span-7 border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-6">
                <form onSubmit={handleSaveReceiptSettings} className="space-y-6">
                  {/* Context Info */}
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                    <p className="text-xs font-bold text-indigo-400">Branch Specific Settings</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      You are editing settings for <strong className="text-slate-300">{branchName}</strong>. These settings override business defaults.
                    </p>
                  </div>

                  {/* Layout selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">Invoice / Receipt Layout</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Thermal", "A4"].map((layout) => (
                        <button
                          key={layout}
                          type="button"
                          onClick={() => setReceiptLayout(layout)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                            receiptLayout === layout
                              ? "bg-indigo-650/20 text-indigo-400 border-indigo-500/50"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span>{layout === "Thermal" ? "Thermal Receipt" : "A4 Invoice"}</span>
                          <span className="text-[9px] font-normal text-slate-500">
                            {layout === "Thermal" ? "80mm Roll Width" : "Standard Paper Page"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">Custom Logo (JPG/PNG, Max 2MB)</label>
                    <div className="flex items-center gap-4">
                      {receiptLogoUrl ? (
                        <div className="relative group border border-slate-800 rounded-lg p-2 bg-slate-950/40">
                          <img src={receiptLogoUrl} alt="Logo Preview" className="h-16 w-32 object-contain rounded" />
                          <button
                            type="button"
                            onClick={() => setReceiptLogoUrl(null)}
                            className="absolute -top-2 -right-2 h-5 w-5 bg-red-650 hover:bg-red-750 text-white rounded-full flex items-center justify-center text-[10px] shadow"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-32 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 bg-slate-950/20">
                          No Logo Uploaded
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="inline-block px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[9px] text-slate-500 mt-1">Recommended aspect ratio: 2:1 or square.</p>
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Show Logo</p>
                        <p className="text-[9px] text-slate-500">Render business logo</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={receiptShowLogo}
                        onChange={(e) => setReceiptShowLogo(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Show Branch Details</p>
                        <p className="text-[9px] text-slate-500">Render address & phone</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={receiptShowBranchDetails}
                        onChange={(e) => setReceiptShowBranchDetails(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Show Cashier Info</p>
                        <p className="text-[9px] text-slate-500">Render cashier name</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={receiptShowCashierInfo}
                        onChange={(e) => setReceiptShowCashierInfo(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Show Verification QR</p>
                        <p className="text-[9px] text-slate-500">Link to verification page</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={receiptShowQRCode}
                        onChange={(e) => setReceiptShowQRCode(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded"
                      />
                    </div>
                  </div>

                  {/* Header / Footer Text */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Header Text (Greeting)</label>
                      <input
                        type="text"
                        placeholder="e.g. Welcome to our store!"
                        value={receiptHeaderText}
                        onChange={(e) => setReceiptHeaderText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Footer Text (Terms/Greeting)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Thank you for your patronage. Please keep this receipt."
                        value={receiptFooterText}
                        onChange={(e) => setReceiptFooterText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Branding Color Picker */}
                  {receiptLayout === "A4" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-slate-300">Branding Theme Accent Color (for A4)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={receiptCustomBrandingColor}
                          onChange={(e) => setReceiptCustomBrandingColor(e.target.value)}
                          className="h-9 w-12 bg-transparent cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={receiptCustomBrandingColor}
                          onChange={(e) => setReceiptCustomBrandingColor(e.target.value)}
                          className="px-3 py-1.5 w-28 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Success / Error Messages */}
                  {receiptSaveSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg text-xs font-medium">
                      ✓ {receiptSaveSuccess}
                    </div>
                  )}
                  {receiptSaveError && (
                    <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 rounded-lg text-xs font-medium">
                      ✕ {receiptSaveError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/15"
                  >
                    Save Configuration
                  </button>
                </form>
              </div>

              {/* Right Column: Live Preview Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <h4 className="font-bold text-slate-300 text-sm pl-1">Live Receipt Preview</h4>
                <div className="border border-slate-855 bg-white text-slate-900 p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[75vh]">
                  {receiptLayout === "A4" ? (
                    /* A4 Live Invoice Preview */
                    <div className="font-sans text-[10px] space-y-5" style={{ borderColor: receiptCustomBrandingColor }}>
                      <div className="flex justify-between items-start border-b pb-3" style={{ borderBottomColor: receiptCustomBrandingColor }}>
                        <div>
                          {receiptShowLogo && receiptLogoUrl ? (
                            <img src={receiptLogoUrl} alt="Logo" className="max-h-10 max-w-[120px] mb-2 object-contain" />
                          ) : (
                            <div className="h-8 w-8 bg-slate-200 rounded flex items-center justify-center font-bold text-slate-500 mb-2">Logo</div>
                          )}
                          <h2 className="text-xs font-black tracking-tight text-slate-900">{receiptConfigName}</h2>
                          {receiptShowBranchDetails && (
                            <div className="text-[8px] text-slate-505 mt-1">
                              <p className="font-bold">{branchName}</p>
                              <p>Branch Specific Address</p>
                              <p>Branch Specific Phone</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <h1 className="text-sm font-black uppercase tracking-wider" style={{ color: receiptCustomBrandingColor }}>INVOICE</h1>
                          <p className="text-[8px] font-bold text-slate-505 mt-1">Invoice ID: INV-2026-009</p>
                          <p className="text-[8px] text-slate-400">Date: 6/9/2026, 12:00 PM</p>
                          {receiptShowCashierInfo && (
                            <p className="text-[8px] text-slate-400">
                              Cashier: <span className="font-semibold">Jane Doe</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[8px] font-bold text-slate-450 uppercase tracking-widest mb-0.5">Transaction Details</h4>
                        <p className="font-semibold text-slate-700">Payment: Cash</p>
                      </div>

                      <table className="w-full text-left border-collapse text-[9px]">
                        <thead>
                          <tr className="border-b uppercase text-slate-550 font-bold" style={{ borderBottomColor: receiptCustomBrandingColor }}>
                            <th className="py-1">SKU</th>
                            <th className="py-1">Item Description</th>
                            <th className="py-1 text-right">Qty</th>
                            <th className="py-1 text-right">Price</th>
                            <th className="py-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-1.5 font-mono text-[8px]">PROD-SKU-990</td>
                            <td className="py-1.5 font-semibold text-slate-800">Wireless Super Mouse</td>
                            <td className="py-1.5 text-right">1</td>
                            <td className="py-1.5 text-right">$45.00</td>
                            <td className="py-1.5 text-right font-bold text-slate-900">$45.00</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-mono text-[8px]">PROD-SKU-102</td>
                            <td className="py-1.5 font-semibold text-slate-800">Mechanical Keyboard RGB</td>
                            <td className="py-1.5 text-right">1</td>
                            <td className="py-1.5 text-right">$95.00</td>
                            <td className="py-1.5 text-right font-bold text-slate-900">$95.00</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-end pt-2">
                        <div className="w-40 space-y-1 text-right text-[9px]">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>$140.00</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Sales Tax (8%)</span>
                            <span>$11.20</span>
                          </div>
                          <div className="flex justify-between border-t pt-1.5 font-bold" style={{ borderTopColor: receiptCustomBrandingColor, color: receiptCustomBrandingColor }}>
                            <span>Total Paid</span>
                            <span>$151.20</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t pt-3 border-slate-100 mt-4">
                        <div className="max-w-[70%] space-y-1">
                          {receiptHeaderText && (
                            <p className="text-[8px] text-slate-500 italic">
                              Note: {receiptHeaderText}
                            </p>
                          )}
                          {receiptFooterText && (
                            <p className="text-[9px] font-bold text-slate-600">
                              {receiptFooterText}
                            </p>
                          )}
                        </div>
                        {receiptShowQRCode && (
                          <div className="text-center space-y-0.5">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/00000000`)}`}
                              alt="Verification QR"
                              className="w-12 h-12 object-contain border p-0.5 rounded bg-white"
                            />
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Verify</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Thermal Live Roll Preview */
                    <div className="font-mono text-[10px] leading-relaxed text-slate-800 space-y-4">
                      <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-slate-400">
                        {receiptShowLogo && receiptLogoUrl && (
                          <div className="flex justify-center mb-1.5">
                            <img src={receiptLogoUrl} alt="Logo" className="max-h-9 max-w-[100px] object-contain" />
                          </div>
                        )}
                        <h3 className="text-xs font-black tracking-widest">{receiptConfigName}</h3>
                        {receiptShowBranchDetails && (
                          <div className="text-[9px] text-slate-500">
                            <p className="font-bold">{branchName}</p>
                            <p>Branch Specific Address</p>
                            <p>Branch Specific Phone</p>
                          </div>
                        )}
                        {receiptHeaderText && (
                          <p className="text-[9px] text-slate-600 italic pt-0.5">{receiptHeaderText}</p>
                        )}
                        <p className="text-[8px] text-slate-400 mt-1">Date: 6/9/2026, 12:00 PM</p>
                        <p className="text-[8px] text-slate-400 font-bold">ID: SALE-98A2</p>
                      </div>

                      {receiptShowCashierInfo && (
                        <div className="py-1 border-b border-dashed border-slate-400 text-[8px] text-slate-500">
                          <span>Cashier: Jane Doe</span>
                        </div>
                      )}

                      <div className="space-y-1.5 py-1.5 border-b border-dashed border-slate-400">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <p className="font-bold">Wireless Super Mouse</p>
                            <p className="text-[8px] text-slate-505">PROD-SKU-990</p>
                            <p className="text-[8px] text-slate-505">1 x $45.00</p>
                          </div>
                          <span className="font-bold">$45.00</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <p className="font-bold">Mechanical Keyboard RGB</p>
                            <p className="text-[8px] text-slate-555">PROD-SKU-102</p>
                            <p className="text-[8px] text-slate-555">1 x $95.00</p>
                          </div>
                          <span className="font-bold">$95.00</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 pt-0.5 text-[9px]">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>$140.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sales Tax (8%)</span>
                          <span>$11.20</span>
                        </div>
                        <div className="flex justify-between text-xs font-black border-t border-double pt-1.5 text-slate-900">
                          <span>TOTAL PAID</span>
                          <span>$151.20</span>
                        </div>
                      </div>

                      <div className="p-1.5 bg-slate-50 border rounded text-[8px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span>Payment Mode:</span>
                          <span>Cash</span>
                        </div>
                      </div>

                      <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-1 text-[8px] text-slate-505">
                        {receiptFooterText ? (
                          <p className="font-bold">{receiptFooterText}</p>
                        ) : (
                          <p className="font-bold">Thank you for your patronage!</p>
                        )}
                        <p>Please keep this receipt.</p>
                      </div>

                      {receiptShowQRCode && (
                        <div className="flex flex-col items-center pt-3 border-t border-dashed border-slate-400 mt-2 space-y-1">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/verify-receipt/00000000`)}`}
                            alt="Verification QR"
                            className="w-16 h-16 object-contain border p-0.5 bg-white rounded"
                          />
                          <p className="text-[7px] font-bold text-slate-450 tracking-widest">Scan to Verify</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "audit-logs" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Audit Logs Timeline</h3>
                <p className="text-xs text-slate-500">Track and monitor every significant event in your branch context</p>
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={loadingAuditLogs}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                {loadingAuditLogs ? "Refreshing..." : "Refresh Logs"}
              </button>
            </div>

            {loadingAuditLogs ? (
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl animate-pulse">
                Loading audit logs timeline...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-sm text-slate-555 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                No audit logs found for this branch context.
              </div>
            ) : (
              <div className="border border-slate-900 bg-slate-900/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-bold">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-slate-300">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 whitespace-nowrap text-slate-555">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.action === "SaleRefunded" || log.action === "DiscountDeleted" || log.action === "CouponDeleted"
                                ? "bg-red-950/40 text-red-400 border-red-900/20"
                                : log.action === "SaleProcessed" || log.action === "LoginSuccess"
                                ? "bg-green-950/40 text-green-400 border-green-900/20"
                                : log.action === "StockAdjusted" || log.action === "StockTransferApproved"
                                ? "bg-blue-950/40 text-blue-400 border-blue-900/20"
                                : "bg-indigo-950/40 text-indigo-400 border-indigo-900/20"
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-medium text-slate-200">
                            {log.actorEmail}
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-555">
                            {log.ipAddress || "127.0.0.1"}
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs sm:max-w-md md:max-w-lg truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Notifications Center</h3>
                <p className="text-xs text-slate-500">Monitor low stock alerts and branch alerts</p>
              </div>
              <button
                onClick={fetchNotifications}
                disabled={loadingNotifications}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                {loadingNotifications ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingNotifications ? (
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl animate-pulse">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                No notifications found.
              </div>
            ) : (
              <div className="border border-slate-900 bg-slate-900/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-bold">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Recipient</th>
                        <th className="p-4">Message</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-slate-300">
                      {notifications.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 whitespace-nowrap text-slate-555">
                            {new Date(n.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              n.type === "LowStock"
                                ? "bg-red-950/40 text-red-400 border-red-900/20"
                                : "bg-amber-950/40 text-amber-400 border-amber-900/20"
                            }`}>
                              {n.type}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap font-medium text-slate-200">
                            {n.title}
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-555">
                            {n.recipientEmail}
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs sm:max-w-md md:max-w-lg truncate" title={n.message}>
                            {n.message}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {n.isRead ? (
                              <span className="text-slate-500">Read</span>
                            ) : (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="px-2.5 py-1 bg-purple-950/40 border border-purple-900/20 hover:bg-purple-900/30 text-purple-400 text-[10px] font-bold rounded-lg transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 animate-in scale-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-1">Update Inventory Stock</h3>
              <p className="text-xs text-slate-450">Product: <span className="text-emerald-400 font-bold">{selectedProduct?.name}</span></p>
            </div>
            {adjError && <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs animate-in slide-in-from-top-2">{adjError}</div>}
            
            <div className="flex border-b border-slate-850">
              <button
                type="button"
                onClick={() => setStockModalTab('add')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  stockModalTab === 'add' ? 'text-emerald-400 border-emerald-400' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                📥 Add Stock (Restock)
              </button>
              <button
                type="button"
                onClick={() => setStockModalTab('correct')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  stockModalTab === 'correct' ? 'text-emerald-400 border-emerald-400' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                🛠️ Correct Stock (Audit)
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              {stockModalTab === 'add' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-455">Current Stock Level:</span>
                    <strong className="text-emerald-450 font-bold">{adjQuantity} units</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={adjQuantityToAdd}
                      onChange={(e) => setAdjQuantityToAdd(e.target.value)}
                      required
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Stock Quantity</label>
                    <input
                      type="number"
                      value={adjQuantity}
                      onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Low Stock Alert Limit</label>
                    <input
                      type="number"
                      value={adjMinLevel}
                      onChange={(e) => setAdjMinLevel(parseInt(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {stockModalTab === 'add' ? "Addition Notes / Reason" : "Adjustment Reason / Notes"}
                </label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder={stockModalTab === 'add' ? "Intake delivery, new shipment, etc." : "Damaged items, counting mistake, audit correction, etc."}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustStockModal(false);
                    setSelectedProduct(null);
                    setAdjQuantityToAdd("");
                    setAdjReason("");
                  }}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg transition-colors hover:bg-slate-750 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjSubmitting}
                  className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {adjSubmitting ? "Updating..." : stockModalTab === 'add' ? "Add Stock" : "Correct Stock"}
                </button>
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
              <h3 className="text-sm font-bold tracking-wider">VENDORA INVENTORY MANAGEMENT SYSTEM</h3>
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
                      {item.quantity} x ₦{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold">₦{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-red-655 font-bold">
                  <span>Discount</span>
                  <span>-₦{selectedSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {selectedSale.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Sales Tax</span>
                  <span>₦{selectedSale.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-double border-slate-400 pt-2 text-slate-900">
                <span>TOTAL</span>
                <span>₦{selectedSale.total.toFixed(2)}</span>
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

            {selectedSale.isRefunded && (
              <div className="mt-4 p-2.5 bg-red-50 border border-red-200 text-red-655 font-bold rounded-xl text-center">
                REFUNDED ON {new Date(selectedSale.refundedAt).toLocaleString()}
              </div>
            )}

            {!selectedSale.isRefunded && (
              <button
                type="button"
                onClick={() => handleRefundSale(selectedSale.id)}
                disabled={refundingSaleId === selectedSale.id}
                className="mt-4 py-2.5 w-full bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs transition-colors active:scale-95 shadow-md shadow-red-900/10"
              >
                {refundingSaleId === selectedSale.id ? "Processing Refund..." : "Refund Transaction"}
              </button>
            )}

            <button
              onClick={() => {
                setShowReceiptDetailModal(false);
                setSelectedSale(null);
              }}
              className="mt-2 py-2.5 w-full bg-slate-905 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
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
                <button type="submit" disabled={couponSubmittingForm} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors">{couponSubmittingForm ? "Creating..." : "Create Coupon"}</button>
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
