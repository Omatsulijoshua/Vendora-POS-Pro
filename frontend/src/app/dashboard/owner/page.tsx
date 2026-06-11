"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";

export default function OwnerDashboard() {
  const { user, token, switchBusiness, switchBranch, logout } = useAuth();
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "categories" | "transfers" | "sales" | "promo" | "receipt" | "billing" | "audit-logs" | "notifications">("overview");

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

  // Phase 14 Billing States
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Yearly">("Yearly");

  // Modals visibility
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Selected Entities for editing/adjustments
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentLogs, setAdjustmentLogs] = useState<any[]>([]);

  // Form states - Business/Branch/Staff
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [businessSubmitting, setBusinessSubmitting] = useState(false);

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [branchError, setBranchError] = useState("");
  const [branchSubmitting, setBranchSubmitting] = useState(false);

  const [staffFirstName, setStaffFirstName] = useState("");
  const [staffLastName, setStaffLastName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("Cashier");
  const [staffBranchId, setStaffBranchId] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // Form states - Category
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catError, setCatError] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Form states - Product
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCost, setProdCost] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodInitialStock, setProdInitialStock] = useState<{ [branchId: string]: { quantity: number, minLevel: number } }>({});
  const [prodError, setProdError] = useState("");
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Form states - Adjust Stock
  const [adjBranchId, setAdjBranchId] = useState("");
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjMinLevel, setAdjMinLevel] = useState(0);
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  // Phase 7 Stock Transfers
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [showAddTransferModal, setShowAddTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState("");
  const [transferSourceBranchId, setTransferSourceBranchId] = useState("");
  const [transferTargetBranchId, setTransferTargetBranchId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Phase 8 Sales
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
  const [refundingSaleId, setRefundingSaleId] = useState<string | null>(null);

  // Phase 14 Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Phase 12 Owner Stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Phase 10 Receipt settings states
  const [selectedBranchIdReceipt, setSelectedBranchIdReceipt] = useState<string>("");
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
  const [receiptConfigName, setReceiptConfigName] = useState("Vendora POS Pro");

  // Dropdown states
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Fetch businesses
  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const res = await fetch("http://localhost:5149/api/businesses/my-businesses", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // Fetch billing status
  const fetchBillingStatus = async () => {
    if (!token) return;
    try {
      setLoadingBilling(true);
      setBillingError(null);
      const res = await fetch("http://localhost:5149/api/billing/status", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBillingStatus(data);
      } else {
        const err = await res.json();
        setBillingError(err.message || "Failed to load billing status.");
      }
    } catch (err) {
      console.error(err);
      setBillingError("Network error. Failed to load billing.");
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleCheckout = async (tier: string) => {
    if (!token) return;
    try {
      setBillingSubmitting(true);
      setBillingError(null);
      const res = await fetch("http://localhost:5149/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          tier,
          billingCycle,
          successUrl: window.location.href,
          cancelUrl: window.location.href
        })
      });

      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setBillingError(data.message || "Failed to initiate checkout.");
      }
    } catch (err) {
      console.error(err);
      setBillingError("Network error. Failed to initiate checkout.");
    } finally {
      setBillingSubmitting(false);
    }
  };

  const handlePortalRedirect = async () => {
    if (!token) return;
    try {
      setBillingSubmitting(true);
      setBillingError(null);
      const res = await fetch("http://localhost:5149/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const data = await res.json();
      if (res.ok && data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        setBillingError(data.message || "Failed to open billing portal.");
      }
    } catch (err) {
      console.error(err);
      setBillingError("Network error. Failed to open billing portal.");
    } finally {
      setBillingSubmitting(false);
    }
  };

  // Fetch branches
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

  // Fetch staff
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("http://localhost:5149/api/categories", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch products
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

  // Fetch stock transfers
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

  // Fetch owner stats
  const fetchOwnerStats = async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const url = user?.businessId
        ? `http://localhost:5149/api/businesses/owner-stats?businessId=${user.businessId}`
        : "http://localhost:5149/api/businesses/owner-stats";
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch owner stats", err);
    } finally {
      setLoadingStats(false);
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

  const fetchReceiptSettingsForOwner = async (branchId: string) => {
    if (!token) return;
    try {
      const url = branchId 
        ? `http://localhost:5149/api/receipts?branchId=${branchId}`
        : `http://localhost:5149/api/receipts`;
      const res = await fetch(url, {
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
        setReceiptConfigName(data.businessName || "Vendora POS Pro");
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
        branchId: selectedBranchIdReceipt ? selectedBranchIdReceipt : null,
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
      
      fetchReceiptSettingsForOwner(selectedBranchIdReceipt);
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
    if (token && user?.businessId) {
      fetchReceiptSettingsForOwner(selectedBranchIdReceipt);
    }
  }, [token, user?.businessId, selectedBranchIdReceipt]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchBusinesses();
      fetchBranches();
    }
  }, [token, user?.businessId]);

  // Load contextual data
  useEffect(() => {
    if (token && user?.businessId) {
      fetchStaff();
      fetchCategories();
      fetchProducts();
      fetchTransfers();
      fetchSales();
      fetchDiscounts();
      fetchCoupons();
      fetchOwnerStats();
      fetchBillingStatus();
    }
  }, [token, user?.businessId, user?.branchId]);

  // Load owner stats on tab active
  useEffect(() => {
    if (token && activeTab === "overview") {
      fetchOwnerStats();
    }
    if (token && activeTab === "billing") {
      fetchBillingStatus();
    }
    if (token && activeTab === "audit-logs") {
      fetchAuditLogs();
    }
    if (token && activeTab === "notifications") {
      fetchNotifications();
    }
  }, [token, user?.businessId, activeTab]);

  // Set default branch option when staff modal opens
  useEffect(() => {
    if (branches.length > 0 && !staffBranchId) {
      setStaffBranchId(branches[0].id);
    }
  }, [branches, staffBranchId]);

  // Active Context Resolutions
  const activeBusiness = businesses.find(b => b.id === user?.businessId) || {
    id: user?.businessId || "default",
    name: "Apex Test Shop",
    subdomain: "apex-store",
    sharedStockMode: false
  };

  const activeBranch = branches.find(b => b.id === user?.branchId);

  // Context Switchers
  const handleSwitchBusiness = async (id: string) => {
    try {
      await switchBusiness(id);
      setBizDropdownOpen(false);
      setBranchDropdownOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to switch business.");
    }
  };

  const handleSwitchBranch = async (id: string | null) => {
    try {
      await switchBranch(id);
      setBranchDropdownOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to switch branch.");
    }
  };

  // Toggle Shared Stock Mode
  const handleToggleSharedStockMode = async () => {
    try {
      const res = await fetch("http://localhost:5149/api/businesses/toggle-shared-stock", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(prev => prev.map(b => b.id === data.id ? { ...b, sharedStockMode: data.sharedStockMode } : b));
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to toggle stock mode.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Transfer
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
          sourceBranchId: transferSourceBranchId,
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
      setTransferSourceBranchId("");
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
        body: JSON.stringify({ notes: "Approved by Owner" })
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
        body: JSON.stringify({ rejectionReason: reason || "Rejected by Owner" })
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
        body: JSON.stringify({ notes: "Cancelled by Owner" })
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

  // Submit Business
  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError("");
    setBusinessSubmitting(true);
    try {
      const res = await fetch("http://localhost:5149/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBusinessName.trim(), subdomain: newSubdomain.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create business.");
      }
      const newBiz = await res.json();
      setBusinesses(prev => [...prev, newBiz]);
      setNewBusinessName("");
      setNewSubdomain("");
      setShowAddBusinessModal(false);
      await handleSwitchBusiness(newBiz.id);
    } catch (err: any) {
      setBusinessError(err.message || "Failed to create business.");
    } finally {
      setBusinessSubmitting(false);
    }
  };

  // Submit Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchError("");
    setBranchSubmitting(true);
    try {
      const res = await fetch("http://localhost:5149/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newBranchName.trim(),
          address: newBranchAddress.trim(),
          phone: newBranchPhone.trim()
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create branch.");
      }
      const newBranch = await res.json();
      setBranches(prev => [...prev, newBranch]);
      setNewBranchName("");
      setNewBranchAddress("");
      setNewBranchPhone("");
      setShowAddBranchModal(false);
      if (!staffBranchId) setStaffBranchId(newBranch.id);
    } catch (err: any) {
      setBranchError(err.message || "Failed to create branch.");
    } finally {
      setBranchSubmitting(false);
    }
  };

  // Submit Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    setStaffSubmitting(true);
    try {
      const res = await fetch("http://localhost:5149/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: staffFirstName.trim(),
          lastName: staffLastName.trim(),
          email: staffEmail.trim(),
          password: staffPassword,
          role: staffRole,
          branchId: staffBranchId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add staff member.");
      }
      const newStaff = await res.json();
      setStaff(prev => [...prev, newStaff]);
      setStaffFirstName("");
      setStaffLastName("");
      setStaffEmail("");
      setStaffPassword("");
      setShowAddStaffModal(false);
    } catch (err: any) {
      setStaffError(err.message || "Failed to add staff.");
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleToggleStaffActive = async (staffId: string) => {
    try {
      const res = await fetch(`http://localhost:5149/api/staff/${staffId}/toggle-active`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to toggle staff active status.");
      }
      const data = await res.json();
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, isActive: data.isActive } : s));
    } catch (err: any) {
      alert(err.message || "Failed to toggle staff status.");
    }
  };

  // Submit Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    setCatSubmitting(true);
    try {
      const res = await fetch("http://localhost:5149/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add category.");
      }
      const newCat = await res.json();
      setCategories(prev => [...prev, newCat]);
      setCatName("");
      setCatDesc("");
      setShowAddCategoryModal(false);
    } catch (err: any) {
      setCatError(err.message);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    setCatSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5149/api/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update category.");
      }
      const updatedCat = await res.json();
      setCategories(prev => prev.map(c => c.id === selectedCategory.id ? updatedCat : c));
      setCatName("");
      setCatDesc("");
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
    } catch (err: any) {
      setCatError(err.message);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`http://localhost:5149/api/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError("");
    setProdSubmitting(true);

    const initialStocksPayload = activeBusiness.sharedStockMode 
      ? [{ branchId: null, quantity: prodInitialStock["global"]?.quantity || 0, minStockLevel: prodInitialStock["global"]?.minLevel || 0 }]
      : branches.map(b => ({
          branchId: b.id,
          quantity: prodInitialStock[b.id]?.quantity || 0,
          minStockLevel: prodInitialStock[b.id]?.minLevel || 0
        }));

    try {
      const res = await fetch("http://localhost:5149/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName.trim(),
          sku: prodSku.trim(),
          barcode: prodBarcode.trim() || null,
          description: prodDesc.trim() || null,
          price: parseFloat(prodPrice),
          costPrice: parseFloat(prodCost),
          categoryId: prodCategoryId || null,
          initialStocks: initialStocksPayload
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add product.");
      }

      setProdName("");
      setProdSku("");
      setProdBarcode("");
      setProdDesc("");
      setProdPrice("");
      setProdCost("");
      setProdCategoryId("");
      setProdInitialStock({});
      setShowAddProductModal(false);
      fetchProducts();
    } catch (err: any) {
      setProdError(err.message);
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError("");
    setProdSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5149/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName.trim(),
          sku: prodSku.trim(),
          barcode: prodBarcode.trim() || null,
          description: prodDesc.trim() || null,
          price: parseFloat(prodPrice),
          costPrice: parseFloat(prodCost),
          categoryId: prodCategoryId || null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update product.");
      }

      setShowEditProductModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setProdError(err.message);
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5149/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust Stock
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
          branchId: activeBusiness.sharedStockMode ? null : adjBranchId,
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

  // Real consolidated dashboard sales values
  const getBranchSales = () => {
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
    return `$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative font-sans">
      {/* Header Navbar */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={32} />
            
            {/* Business Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setBizDropdownOpen(!bizDropdownOpen);
                  setBranchDropdownOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-semibold text-slate-200 transition-all active:scale-[0.98]"
              >
                <span className="text-indigo-400 font-bold">🏢 {activeBusiness.name}</span>
                <span className="text-xs text-slate-500">▼</span>
              </button>
              
              {bizDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold px-3 py-1.5">Switch Business</p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSwitchBusiness(b.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex justify-between items-center transition-colors ${
                          b.id === activeBusiness.id ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "hover:bg-slate-800 text-slate-350"
                        }`}
                      >
                        <span>{b.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{b.subdomain}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-850 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setBizDropdownOpen(false);
                        setShowAddBusinessModal(true);
                      }}
                      className="w-full text-center py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-xs font-bold text-indigo-400 rounded-lg transition-colors"
                    >
                      + Register Brand
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Branch Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setBranchDropdownOpen(!branchDropdownOpen);
                  setBizDropdownOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-semibold text-slate-200 transition-all active:scale-[0.98]"
              >
                <span className="text-purple-400 font-bold">📍 {activeBranch ? activeBranch.name : "All Branches"}</span>
                <span className="text-xs text-slate-500">▼</span>
              </button>
              
              {branchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold px-3 py-1.5">Switch Branch</p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => handleSwitchBranch(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex justify-between items-center transition-colors ${
                        !activeBranch ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" : "hover:bg-slate-800 text-slate-350"
                      }`}
                    >
                      <span>All Branches (Global)</span>
                    </button>
                    
                    {branches.map((br) => (
                      <button
                        key={br.id}
                        onClick={() => handleSwitchBranch(br.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex justify-between items-center transition-colors ${
                          activeBranch?.id === br.id ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" : "hover:bg-slate-800 text-slate-350"
                        }`}
                      >
                        <span>{br.name}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[100px]">{br.phone}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-850 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setBranchDropdownOpen(false);
                        setShowAddBranchModal(true);
                      }}
                      className="w-full text-center py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-xs font-bold text-purple-400 rounded-lg transition-colors"
                    >
                      + Create Branch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell token={token} onViewAll={() => setActiveTab("notifications")} />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500">Business Owner</p>
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Context Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 sm:p-8">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
                {activeBusiness.name} Control Panel
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                Active Branch Context: <span className="text-purple-400 font-bold">{activeBranch ? activeBranch.name : "Consolidated Global View"}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Shared Stock Toggle */}
              <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-lg text-xs font-semibold">
                <span className="text-slate-300">Shared Stock Pool</span>
                <button
                  type="button"
                  onClick={handleToggleSharedStockMode}
                  className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${activeBusiness.sharedStockMode ? "bg-indigo-650" : "bg-slate-800"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${activeBusiness.sharedStockMode ? "translate-x-4" : ""}`} />
                </button>
              </div>

              {activeTab !== "sales" && activeTab !== "promo" && (
                <button
                  onClick={() => {
                    if (activeTab === "categories") setShowAddCategoryModal(true);
                    else if (activeTab === "inventory") setShowAddProductModal(true);
                    else if (activeTab === "transfers") {
                      if (products.length > 0) setTransferProductId(products[0].id);
                      if (branches.length > 0) setTransferSourceBranchId(branches[0].id);
                      if (branches.length > 1) setTransferTargetBranchId(branches[1].id);
                      setTransferQuantity(1);
                      setTransferNotes("");
                      setTransferError("");
                      setShowAddTransferModal(true);
                    }
                    else setShowAddBranchModal(true);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
                >
                  {activeTab === "categories" ? "+ Create Category" : activeTab === "inventory" ? "+ Add Product" : activeTab === "transfers" ? "+ Initiate Transfer" : "+ Add Branch"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-900 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "overview" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "inventory" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Inventory Catalog
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "categories" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "transfers" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Stock Transfers
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "sales" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Sales History
          </button>
          <button
            onClick={() => setActiveTab("promo")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "promo" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Discounts & Coupons
          </button>
          <button
            onClick={() => setActiveTab("receipt")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "receipt" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Receipt Settings
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "billing" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Billing & Subscriptions
          </button>
          <button
            onClick={() => setActiveTab("audit-logs")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "audit-logs" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-3 border-b-2 transition-colors ${activeTab === "notifications" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            Notifications
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {loadingStats || !stats ? (
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                Loading consolidated dashboard stats...
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: `₦${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: activeBranch?.name ? `Branch: ${activeBranch.name}` : "Consolidated revenue" },
                    { label: "Gross Profit", value: `₦${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `Margin: ${stats.profitMargin.toFixed(1)}%`, highlight: true },
                    { label: "Transactions Count", value: stats.totalSalesCount.toString(), sub: "Completed checkouts" },
                    { label: "Avg Transaction Value", value: `₦${stats.averageTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "ATV per invoice" },
                  ].map((stat, i) => (
                    <div key={i} className={`border border-slate-900 bg-slate-900/20 rounded-xl p-5 ${stat.highlight ? "ring-1 ring-indigo-500/30" : ""}`}>
                      <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                      <p className={`text-3xl font-black mt-3 ${stat.highlight ? "text-indigo-400" : "text-slate-100"}`}>{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* 7-Day Performance Trend Chart */}
                <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 flex flex-col min-h-[320px]">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Consolidated Daily Trend</h3>
                    <p className="text-xs text-slate-500 mb-6">Daily revenue and gross profit over the last 7 days</p>
                  </div>
                  
                  {stats.dailyTrend.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-slate-650">No recent sales data.</div>
                  ) : (
                    <div className="flex-1 flex items-end justify-between gap-2 h-44 px-4 bg-slate-950/20 border border-slate-900/40 rounded-xl pt-6">
                      {stats.dailyTrend.map((trend: any, index: number) => {
                        const maxRev = Math.max(...stats.dailyTrend.map((t: any) => t.revenue), 1);
                        const revHeight = (trend.revenue / maxRev) * 100;
                        const profHeight = (trend.profit / maxRev) * 100;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip */}
                            <div className="absolute top-[-48px] bg-slate-900 border border-slate-800 text-[10px] text-slate-100 font-bold py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl whitespace-nowrap text-center space-y-0.5">
                              <p className="font-semibold text-slate-400">{trend.date}</p>
                              <p>Revenue: <span className="text-indigo-400 font-bold">${trend.revenue.toFixed(2)}</span></p>
                              <p>Profit: <span className="text-emerald-400 font-bold">${trend.profit.toFixed(2)}</span></p>
                              <p className="text-[9px] text-slate-550">{trend.salesCount} checkout(s)</p>
                            </div>

                            {/* Stacked / Adjacent bars */}
                            <div className="w-full flex justify-center gap-1.5 h-full items-end">
                              {/* Revenue Bar */}
                              <div 
                                className="w-3 sm:w-5 bg-indigo-600 hover:bg-indigo-550 rounded-t transition-all shadow-md shadow-indigo-500/10"
                                style={{ height: `${Math.max(4, revHeight)}%` }}
                              ></div>
                              {/* Profit Bar */}
                              <div 
                                className="w-3 sm:w-5 bg-emerald-600 hover:bg-emerald-555 rounded-t transition-all shadow-md shadow-emerald-500/10"
                                style={{ height: `${Math.max(4, profHeight)}%` }}
                              ></div>
                            </div>

                            <span className="text-[9px] text-slate-500 mt-2 font-mono font-semibold">
                              {new Date(trend.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Comparative Panels (Cross-Business vs Branch Comparison) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cross-Business Metrics */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">Cross-Business Analytics</h3>
                      <p className="text-xs text-slate-500">Comparative revenue and gross profit across all your businesses</p>
                    </div>

                    {stats.businessMetrics.length === 0 ? (
                      <p className="text-sm text-slate-500">No businesses registered.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.businessMetrics.map((bm: any) => {
                          const maxRevenue = Math.max(...stats.businessMetrics.map((b: any) => b.revenue), 1);
                          const pct = (bm.revenue / maxRevenue) * 100;
                          return (
                            <div key={bm.businessId} className="p-4 rounded-lg bg-slate-950/40 border border-slate-900 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-200 text-sm">{bm.businessName}</span>
                                <span className="text-slate-400 font-mono">
                                  {bm.branchesCount} branch(es)
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400">
                                <span>Revenue: <strong className="text-indigo-400">${bm.revenue.toFixed(2)}</strong></span>
                                <span>Profit: <strong className="text-emerald-450">${bm.profit.toFixed(2)}</strong></span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-900">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-650 h-full rounded-full" 
                                  style={{ width: `${Math.max(3, pct)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Branch Metrics (Scoped to active selected business) */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">
                        Branch Comparison {activeBusiness.name ? `(${activeBusiness.name})` : ""}
                      </h3>
                      <p className="text-xs text-slate-500">Performance rank across locations in the selected business context</p>
                    </div>

                    {!user?.businessId || stats.branchMetrics.length === 0 ? (
                      <p className="text-sm text-slate-500">Select a business context or create branches to view comparison.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="pb-3 pr-4">Branch Location</th>
                              <th className="pb-3 px-4 text-right">Sales Count</th>
                              <th className="pb-3 px-4 text-right">Revenue</th>
                              <th className="pb-3 px-4 text-right">Gross Profit</th>
                              <th className="pb-3 pl-4 text-right">Staff</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 text-slate-350">
                            {stats.branchMetrics.map((br: any) => (
                              <tr key={br.branchId} className="hover:bg-slate-900/10 transition-colors">
                                <td className="py-3 pr-4 font-bold text-slate-200">{br.branchName}</td>
                                <td className="py-3 px-4 text-right">{br.salesCount}</td>
                                <td className="py-3 px-4 text-right text-indigo-400 font-bold">${br.revenue.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right text-emerald-450 font-bold">${br.profit.toFixed(2)}</td>
                                <td className="py-3 pl-4 text-right font-mono">{br.staffCount} staff</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaderboards (Top Products vs Top Cashiers) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Products */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">Top Selling Products</h3>
                      <p className="text-xs text-slate-500">Highest volume and most profitable catalog items</p>
                    </div>

                    {stats.topProducts.length === 0 ? (
                      <p className="text-sm text-slate-500">No products sold yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.topProducts.map((tp: any) => (
                          <div key={tp.productId} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-900 rounded-lg">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-200 text-xs">{tp.productName}</p>
                              <p className="text-[10px] text-slate-505 font-mono">SKU: {tp.sku}</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-bold text-slate-300">{tp.quantitySold} sold</p>
                              <p className="text-[10px] text-slate-450">
                                Rev: <strong className="text-indigo-400">${tp.revenue.toFixed(2)}</strong> | Prof: <strong className="text-emerald-400">${tp.profit.toFixed(2)}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Cashiers */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">Top Cashier Performers</h3>
                      <p className="text-xs text-slate-500">Leaderboard of cashier staff by sales revenue</p>
                    </div>

                    {stats.topCashiers.length === 0 ? (
                      <p className="text-sm text-slate-500">No checkout transactions registered.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.topCashiers.map((tc: any) => (
                          <div key={tc.userId} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-900 rounded-lg">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-200 text-xs">{tc.cashierName}</p>
                              <p className="text-[10px] text-slate-505">Branch: {tc.branchName}</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-bold text-indigo-400">${tc.revenue.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-505">{tc.salesCount} sales</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contextual Branch & Staff Directory */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-900 pt-8 mt-8">
                  {/* Branch Locations List */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-slate-100">Branch Switcher Context</h3>
                        <p className="text-xs text-slate-500">Select branch context to filter dashboard views</p>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">Total: {branches.length}</span>
                    </div>
                    {loadingBranches ? (
                      <div className="text-sm text-slate-500">Loading branch records...</div>
                    ) : branches.length === 0 ? (
                      <div className="text-sm text-slate-555">No branches registered.</div>
                    ) : (
                      <div className="space-y-3">
                        {branches.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => handleSwitchBranch(b.id)}
                            className={`p-4 rounded-lg bg-slate-955/40 border flex justify-between items-center cursor-pointer transition-colors ${
                              activeBranch?.id === b.id ? "border-purple-500" : "border-slate-900 hover:border-slate-850"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-slate-200">{b.name}</p>
                              <p className="text-xs text-slate-500">{b.address || "No address"}</p>
                              <p className="text-xs text-slate-400">Phone: {b.phone || "N/A"}</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Select Context
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Staff Directory List */}
                  <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-slate-100">
                          Staff Operations Directory {activeBranch ? `(${activeBranch.name})` : "(Consolidated)"}
                        </h3>
                        <p className="text-xs text-slate-500">Manage cashier and manager active statuses</p>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">Count: {staff.length}</span>
                    </div>
                    {loadingStaff ? (
                      <div className="text-sm text-slate-500">Loading team...</div>
                    ) : staff.length === 0 ? (
                      <div className="text-sm text-slate-555">No staff users registered.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                              <th className="pb-3 pr-4">Staff Member</th>
                              <th className="pb-3 px-4">Role</th>
                              <th className="pb-3 px-4">Branch</th>
                              <th className="pb-3 px-4 text-center">Status</th>
                              <th className="pb-3 pl-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-slate-350">
                            {staff.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-900/5">
                                <td className="py-3 pr-4">
                                  <p className="font-semibold text-slate-200">{s.firstName} {s.lastName}</p>
                                  <p className="text-[10px] text-slate-550">{s.email}</p>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    s.role === "Manager" ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/25" : "bg-blue-500/10 text-blue-450 border border-blue-500/25"
                                  }`}>
                                    {s.role}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-450">{s.branchName}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${s.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-850 text-slate-400"}`}>
                                    {s.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <button
                                    onClick={() => handleToggleStaffActive(s.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                      s.isActive 
                                        ? "bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-900/30"
                                        : "bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/30"
                                    }`}
                                  >
                                    {s.isActive ? "Deactivate" : "Activate"}
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
              </>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Product Inventory</h3>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg transition-colors"
              >
                + Add Product
              </button>
            </div>

            {loadingProducts ? (
              <div className="text-sm text-slate-500">Loading products catalog...</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-slate-500">No products registered. Click "+ Add Product" to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">SKU / Barcode</th>
                      <th className="pb-3 px-4">Product Name</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Pricing</th>
                      <th className="pb-3 px-4 text-center">Stock Level</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-mono text-indigo-400 font-semibold">{p.sku}</p>
                          <p className="text-[10px] text-slate-500">{p.barcode || "No Barcode"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">{p.name}</p>
                          {p.description && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{p.description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400">
                            {p.categoryName || "Unassigned"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">₦{p.price.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-550">Cost: ${p.costPrice.toFixed(2)}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.underStockAlert 
                                ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {p.totalStock} {p.underStockAlert ? "⚠️ Low" : "✓ OK"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjBranchId(user?.branchId || branches[0]?.id || "");
                              const currentStock = p.branchStocks?.find((bs: any) => bs.branchId === (user?.branchId || branches[0]?.id)) || { quantity: 0, minStockLevel: 0 };
                              setAdjQuantity(currentStock.quantity);
                              setAdjMinLevel(currentStock.minStockLevel);
                              setShowAdjustStockModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-250 font-bold transition-all"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              fetchAdjustmentLogs(p.id);
                              setShowLogModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 font-bold transition-all"
                          >
                            Logs
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setProdName(p.name);
                              setProdSku(p.sku);
                              setProdBarcode(p.barcode || "");
                              setProdDesc(p.description || "");
                              setProdPrice(p.price.toString());
                              setProdCost(p.costPrice.toString());
                              setProdCategoryId(p.categoryId || "");
                              setShowEditProductModal(true);
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-2 py-1 bg-red-950/20 hover:bg-red-900/25 border border-red-900/40 rounded text-red-400"
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
        )}

        {activeTab === "categories" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Product Categories</h3>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg transition-colors"
              >
                + Create Category
              </button>
            </div>

            {loadingCategories ? (
              <div className="text-sm text-slate-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-slate-500">No categories registered. Click "+ Create Category" to add one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">Category Name</th>
                      <th className="pb-3 px-4">Description</th>
                      <th className="pb-3 px-4 text-center">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-slate-250">{c.name}</td>
                        <td className="py-3 px-4 text-slate-500">{c.description || "No description"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isActive ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" : "bg-slate-850 text-slate-400"}`}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(c);
                              setCatName(c.name);
                              setCatDesc(c.description || "");
                              setShowEditCategoryModal(true);
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="px-2 py-1 bg-red-950/20 hover:bg-red-900/25 border border-red-900/40 rounded text-red-400"
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
        )}

        {activeTab === "transfers" && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Stock Transfers</h3>
              {!activeBusiness.sharedStockMode && (
                <button
                  onClick={() => {
                    if (products.length > 0) setTransferProductId(products[0].id);
                    if (branches.length > 0) setTransferSourceBranchId(branches[0].id);
                    if (branches.length > 1) setTransferTargetBranchId(branches[1].id);
                    setTransferQuantity(1);
                    setTransferNotes("");
                    setTransferError("");
                    setShowAddTransferModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg transition-colors"
                >
                  + Initiate Transfer
                </button>
              )}
            </div>

            {activeBusiness.sharedStockMode ? (
              <div className="text-sm text-slate-500 bg-slate-950/40 p-4 rounded-lg border border-slate-900">
                ⚠️ Shared Stock Mode is active. Stock transfers between branches are disabled because inventory is managed in a single unified pool.
              </div>
            ) : loadingTransfers ? (
              <div className="text-sm text-slate-500">Loading transfer history...</div>
            ) : transfers.length === 0 ? (
              <div className="text-sm text-slate-500">No stock transfers logged. Click "+ Initiate Transfer" to begin moving stock.</div>
            ) : (
              <div className="overflow-x-auto">
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
                        <td className="py-3 px-4 text-slate-400">{t.sourceBranchName}</td>
                        <td className="py-3 px-4 text-slate-400">{t.targetBranchName}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">{t.quantity}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            t.status === "Rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            t.status === "Cancelled" ? "bg-slate-800 text-slate-400 border-slate-700" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{t.initiatedByUserName}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pl-4 text-right space-x-2">
                          {t.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApproveTransfer(t.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectTransfer(t.id)}
                                className="px-2 py-1 bg-red-650 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleCancelTransfer(t.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded"
                              >
                                Cancel
                              </button>
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
              <h3 className="font-bold text-lg text-slate-100">Sales History Logs</h3>
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
              <div className="text-sm text-slate-500 py-6">No sales transactions found.</div>
            ) : (
              <div className="overflow-x-auto animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">Receipt ID</th>
                      <th className="pb-3 px-4">Branch</th>
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
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded transition-colors active:scale-95"
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
                  className="px-4 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-650/20"
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
                <div className="text-xs text-slate-550">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="text-xs text-slate-550">No coupons created yet.</div>
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
                <div className="text-xs text-slate-550">Loading discounts...</div>
              ) : discounts.length === 0 ? (
                <div className="text-xs text-slate-550">No discount rules configured.</div>
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

        {activeTab === "receipt" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Receipt Customization</h3>
                <p className="text-xs text-slate-500">Configure layouts, logos, headers, footers, and verification QR codes</p>
              </div>
            </div>

            {/* Main Content Layout: Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Settings (7 cols) */}
              <div className="lg:col-span-7 border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-6">
                <form onSubmit={handleSaveReceiptSettings} className="space-y-6">
                  {/* Scope / Context Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">Select Configuration Target</label>
                    <select
                      value={selectedBranchIdReceipt}
                      onChange={(e) => setSelectedBranchIdReceipt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Business Default (All Branches)</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>Branch Override: {b.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Settings configured for a branch will override the business default settings.
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
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-650/15"
                  >
                    Save Configuration
                  </button>
                </form>
              </div>

              {/* Right Column: Live Preview Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <h4 className="font-bold text-slate-300 text-sm pl-1">Live Receipt Preview</h4>
                <div className="border border-slate-850 bg-white text-slate-900 p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[75vh]">
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
                            <div className="text-[8px] text-slate-500 mt-1">
                              <p className="font-bold">Main Street Branch</p>
                              <p>123 POS Highway, Tech City</p>
                              <p>Phone: +1 555-0199</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <h1 className="text-sm font-black uppercase tracking-wider" style={{ color: receiptCustomBrandingColor }}>INVOICE</h1>
                          <p className="text-[8px] font-bold text-slate-550 mt-1">Invoice ID: INV-2026-009</p>
                          <p className="text-[8px] text-slate-400">Date: 6/9/2026, 12:00 PM</p>
                          {receiptShowCashierInfo && (
                            <p className="text-[8px] text-slate-400">
                              Cashier: <span className="font-semibold">Jane Doe</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Transaction Details</h4>
                        <p className="font-semibold text-slate-700">Payment: Cash</p>
                      </div>

                      <table className="w-full text-left border-collapse text-[9px]">
                        <thead>
                          <tr className="border-b uppercase text-slate-500 font-bold" style={{ borderBottomColor: receiptCustomBrandingColor }}>
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
                            <p className="font-bold">Main Street Branch</p>
                            <p>123 POS Highway, Tech City</p>
                            <p>Phone: +1 555-0199</p>
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
                            <p className="text-[8px] text-slate-500">PROD-SKU-990</p>
                            <p className="text-[8px] text-slate-500">1 x $45.00</p>
                          </div>
                          <span className="font-bold">$45.00</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <p className="font-bold">Mechanical Keyboard RGB</p>
                            <p className="text-[8px] text-slate-500">PROD-SKU-102</p>
                            <p className="text-[8px] text-slate-500">1 x $95.00</p>
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

                      <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-1 text-[8px] text-slate-500">
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

        {activeTab === "billing" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Subscription & Billing</h3>
                <p className="text-xs text-slate-500">Manage your subscription tier, billing period, and Stripe payment methods</p>
              </div>
            </div>

            {/* Error notifications */}
            {billingError && (
              <div className="p-4 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-xl flex items-center justify-between">
                <span>{billingError}</span>
                <button onClick={() => setBillingError(null)} className="text-red-400 font-bold hover:text-red-300">✕</button>
              </div>
            )}

            {loadingBilling ? (
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                Loading subscription context...
              </div>
            ) : (
              <>
                {/* Current Plan Overview Card */}
                {billingStatus && (
                  <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
                    {/* Glow effect */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Active Plan</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            billingStatus.subscriptionStatus === "Active"
                              ? "bg-green-950/50 text-green-400 border border-green-800/40"
                              : billingStatus.subscriptionStatus === "Past Due"
                              ? "bg-amber-950/50 text-amber-400 border border-amber-800/40"
                              : "bg-red-950/50 text-red-400 border border-red-800/40"
                          }`}>
                            {billingStatus.subscriptionStatus}
                          </span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-100">{billingStatus.subscriptionTier} Edition</h4>
                        <p className="text-xs text-slate-400">
                          {billingStatus.subscriptionPrice > 0 
                            ? `$${billingStatus.subscriptionPrice.toLocaleString()}/period`
                            : "Free / Trial"}
                          {billingStatus.subscriptionExpiresAt && (
                            <span className="text-slate-500">
                              {" • "}Renews/Expires on {new Date(billingStatus.subscriptionExpiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {billingStatus.stripeCustomerId && (
                          <button
                            type="button"
                            onClick={handlePortalRedirect}
                            disabled={billingSubmitting}
                            className="px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                          >
                            {billingSubmitting ? "Loading..." : "Manage Invoices & Cards"}
                          </button>
                        )}
                        {billingStatus.isMockMode && (
                          <span className="px-3 py-2 bg-indigo-950/20 text-indigo-400 border border-indigo-900/50 rounded-xl text-[10px] font-semibold flex items-center">
                            ⚙️ Mock Stripe Mode Enabled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Cycle Switcher */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <span className={`text-xs font-bold transition-colors ${billingCycle === "Monthly" ? "text-indigo-400" : "text-slate-500"}`}>Monthly</span>
                  <button
                    type="button"
                    onClick={() => setBillingCycle(billingCycle === "Monthly" ? "Yearly" : "Monthly")}
                    className="relative w-12 h-6 bg-slate-900 border border-slate-800 rounded-full transition-colors focus:outline-none"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-indigo-500 rounded-full transition-transform ${
                      billingCycle === "Yearly" ? "translate-x-6" : ""
                    }`} />
                  </button>
                  <span className={`text-xs font-bold transition-colors ${billingCycle === "Yearly" ? "text-indigo-400" : "text-slate-500"} flex items-center gap-1.5`}>
                    Yearly <span className="px-1.5 py-0.5 bg-green-950/50 text-green-400 border border-green-900/50 rounded text-[9px] font-black uppercase tracking-wider">Save ~17%</span>
                  </span>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Plan */}
                  <div className="border border-slate-900 bg-slate-950/30 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all group relative">
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <h5 className="text-md font-bold text-slate-300">Basic</h5>
                        <p className="text-xs text-slate-500">Perfect for single-location shops</p>
                      </div>
                      <div className="flex items-baseline gap-1 text-slate-100">
                        <span className="text-3xl font-black font-mono">
                          {billingCycle === "Monthly" ? "$99" : "$990"}
                        </span>
                        <span className="text-xs text-slate-500">/{billingCycle === "Monthly" ? "mo" : "yr"}</span>
                      </div>
                      <ul className="space-y-3.5 text-xs text-slate-400 border-t border-slate-900/60 pt-5">
                        <li className="flex items-center gap-2">✓ 1 Active Business</li>
                        <li className="flex items-center gap-2">✓ Up to 3 Branch Locations</li>
                        <li className="flex items-center gap-2">✓ Max 10 Staff Users</li>
                        <li className="flex items-center gap-2">✓ POS Register Checkout</li>
                        <li className="flex items-center gap-2">✓ Standard Inventory Logs</li>
                      </ul>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-900/60">
                      <button
                        type="button"
                        onClick={() => handleCheckout("Basic")}
                        disabled={billingSubmitting || billingStatus?.subscriptionTier === "Basic"}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          billingStatus?.subscriptionTier === "Basic"
                            ? "bg-slate-900 text-slate-550 cursor-not-allowed border border-slate-800"
                            : "bg-indigo-650 hover:bg-indigo-750 text-white shadow-lg shadow-indigo-600/10"
                        }`}
                      >
                        {billingStatus?.subscriptionTier === "Basic" ? "Current Tier" : "Select Basic"}
                      </button>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="border border-indigo-900/40 bg-slate-900/10 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-800/50 transition-all group relative ring-1 ring-indigo-500/20">
                    <div className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg">
                      Popular
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <h5 className="text-md font-bold text-slate-200">Pro</h5>
                        <p className="text-xs text-slate-400">Great for multi-branch brands</p>
                      </div>
                      <div className="flex items-baseline gap-1 text-slate-100">
                        <span className="text-3xl font-black font-mono text-indigo-400">
                          {billingCycle === "Monthly" ? "$299" : "$2990"}
                        </span>
                        <span className="text-xs text-slate-500">/{billingCycle === "Monthly" ? "mo" : "yr"}</span>
                      </div>
                      <ul className="space-y-3.5 text-xs text-slate-355 border-t border-slate-900/60 pt-5">
                        <li className="flex items-center gap-2">✓ 1 Active Business</li>
                        <li className="flex items-center gap-2">✓ Up to 10 Branch Locations</li>
                        <li className="flex items-center gap-2">✓ Unlimited Staff Users</li>
                        <li className="flex items-center gap-2">✓ Inter-branch Stock Transfers</li>
                        <li className="flex items-center gap-2">✓ Discounts & Coupon Builder</li>
                        <li className="flex items-center gap-2">✓ Advanced Analytics & SVG Charts</li>
                      </ul>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-900/60">
                      <button
                        type="button"
                        onClick={() => handleCheckout("Pro")}
                        disabled={billingSubmitting || billingStatus?.subscriptionTier === "Pro"}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          billingStatus?.subscriptionTier === "Pro"
                            ? "bg-slate-900 text-slate-555 cursor-not-allowed border border-slate-800"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                        }`}
                      >
                        {billingStatus?.subscriptionTier === "Pro" ? "Current Tier" : "Select Pro"}
                      </button>
                    </div>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="border border-slate-900 bg-slate-950/30 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all group relative">
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <h5 className="text-md font-bold text-slate-300">Enterprise</h5>
                        <p className="text-xs text-slate-500">For franchise groups & conglomerates</p>
                      </div>
                      <div className="flex items-baseline gap-1 text-slate-100">
                        <span className="text-3xl font-black font-mono">
                          {billingCycle === "Monthly" ? "$999" : "$9990"}
                        </span>
                        <span className="text-xs text-slate-500">/{billingCycle === "Monthly" ? "mo" : "yr"}</span>
                      </div>
                      <ul className="space-y-3.5 text-xs text-slate-400 border-t border-slate-900/60 pt-5">
                        <li className="flex items-center gap-2">✓ Multiple Businesses per Owner</li>
                        <li className="flex items-center gap-2">✓ Unlimited Branch Locations</li>
                        <li className="flex items-center gap-2">✓ Unlimited Staff Users</li>
                        <li className="flex items-center gap-2">✓ Global Stock Consolidation</li>
                        <li className="flex items-center gap-2">✓ Custom Receipt Styling Overrides</li>
                        <li className="flex items-center gap-2">✓ 24/7 Dedicated Support</li>
                      </ul>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-900/60">
                      <button
                        type="button"
                        onClick={() => handleCheckout("Enterprise")}
                        disabled={billingSubmitting || billingStatus?.subscriptionTier === "Enterprise"}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          billingStatus?.subscriptionTier === "Enterprise"
                            ? "bg-slate-900 text-slate-555 cursor-not-allowed border border-slate-800"
                            : "bg-indigo-650 hover:bg-indigo-750 text-white shadow-lg"
                        }`}
                      >
                        {billingStatus?.subscriptionTier === "Enterprise" ? "Current Tier" : "Select Enterprise"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "audit-logs" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-200">Audit Logs Timeline</h3>
                <p className="text-xs text-slate-500">Track and monitor every significant event across your business tenant</p>
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
              <div className="text-sm text-slate-500 py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                No audit logs found for this business.
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
                <p className="text-xs text-slate-500">Monitor low stock alerts, subscription reminders, and other system warnings</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!token) return;
                    try {
                      await fetch("http://localhost:5149/api/notifications/check-subscription-reminders", {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${token}`
                        }
                      });
                      fetchNotifications();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-650/20"
                >
                  Scan Subscriptions
                </button>
                <button
                  onClick={fetchNotifications}
                  disabled={loadingNotifications}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  {loadingNotifications ? "Refreshing..." : "Refresh"}
                </button>
              </div>
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

      {/* MODALS SECTION */}

      {/* Register Business Modal */}
      {showAddBusinessModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Register Additional Business</h3>
            {businessError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{businessError}</div>}
            <form onSubmit={handleAddBusiness} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Apex Supermarket"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subdomain Slug</label>
                <input
                  type="text"
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="apex-grocery"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddBusinessModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={businessSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">{businessSubmitting ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Create New Branch</h3>
            {branchError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{branchError}</div>}
            <form onSubmit={handleAddBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch Name</label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Northside Depot"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location Address</label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="305 North Blvd, Capital City"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="555-0199"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={branchSubmitting} className="flex-1 py-2.5 bg-purple-650 text-white text-xs font-bold rounded-lg">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Register Store Staff</h3>
            {staffError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{staffError}</div>}
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={staffFirstName}
                    onChange={(e) => setStaffFirstName(e.target.value)}
                    placeholder="Sarah"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={staffLastName}
                    onChange={(e) => setStaffLastName(e.target.value)}
                    placeholder="Connor"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="sarah@connor.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Password123!"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch Assignment</label>
                  <select
                    value={staffBranchId}
                    onChange={(e) => setStaffBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2"
                  >
                    {branches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-350 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={staffSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Register User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Create New Category</h3>
            {catError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{catError}</div>}
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Beverages"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Drinks, sodas, and juices"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={catSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Edit Category</h3>
            {catError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{catError}</div>}
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowEditCategoryModal(false); setSelectedCategory(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={catSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-8">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Add New Product</h3>
            {prodError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{prodError}</div>}
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Coca Cola 330ml"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="COKE-330"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    placeholder="5449000000996"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Price ($ Selling)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="1.50"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cost Price ($ Buying)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    placeholder="0.80"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Carbonated soft drink canned"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                />
              </div>

              {/* Initial Stock Setup */}
              <div className="border-t border-slate-850 pt-3">
                <p className="text-xs font-bold text-indigo-400 mb-2">Initial Stock Setup</p>
                <div className="max-h-40 overflow-y-auto space-y-2 p-1">
                  {activeBusiness.sharedStockMode ? (
                    <div className="grid grid-cols-2 gap-4 p-2 bg-slate-950/40 rounded border border-slate-900">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Global Stock Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={prodInitialStock["global"]?.quantity || ""}
                          onChange={(e) => setProdInitialStock(prev => ({
                            ...prev,
                            "global": { quantity: parseInt(e.target.value) || 0, minLevel: prev["global"]?.minLevel || 0 }
                          }))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Low Stock Warning Limit</label>
                        <input
                          type="number"
                          placeholder="5"
                          value={prodInitialStock["global"]?.minLevel || ""}
                          onChange={(e) => setProdInitialStock(prev => ({
                            ...prev,
                            "global": { quantity: prev["global"]?.quantity || 0, minLevel: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  ) : branches.length === 0 ? (
                    <p className="text-[10px] text-amber-500">Create a branch first to assign stock.</p>
                  ) : (
                    branches.map(b => (
                      <div key={b.id} className="grid grid-cols-3 gap-3 p-2 bg-slate-950/30 rounded border border-slate-900 items-center">
                        <span className="text-[10px] font-semibold text-slate-350 truncate">{b.name}</span>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={prodInitialStock[b.id]?.quantity || ""}
                          onChange={(e) => setProdInitialStock(prev => ({
                            ...prev,
                            [b.id]: { quantity: parseInt(e.target.value) || 0, minLevel: prev[b.id]?.minLevel || 0 }
                          }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                        />
                        <input
                          type="number"
                          placeholder="Alert Qty"
                          value={prodInitialStock[b.id]?.minLevel || ""}
                          onChange={(e) => setProdInitialStock(prev => ({
                            ...prev,
                            [b.id]: { quantity: prev[b.id]?.quantity || 0, minLevel: parseInt(e.target.value) || 0 }
                          }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={prodSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Edit Product details</h3>
            {prodError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{prodError}</div>}
            
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Barcode</label>
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={prodSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Adjust Inventory Level</h3>
            <p className="text-xs text-slate-455 mb-4">Product: <span className="text-indigo-400 font-bold">{selectedProduct?.name}</span></p>
            {adjError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{adjError}</div>}
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              {!activeBusiness.sharedStockMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch Location Context</label>
                  <select
                    value={adjBranchId}
                    onChange={(e) => {
                      setAdjBranchId(e.target.value);
                      const currentStock = selectedProduct.branchStocks?.find((bs: any) => bs.branchId === e.target.value) || { quantity: 0, minStockLevel: 0 };
                      setAdjQuantity(currentStock.quantity);
                      setAdjMinLevel(currentStock.minStockLevel);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Stock Quantity</label>
                  <input
                    type="number"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Low Stock Alert Limit</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Intake delivery, damaged items, stock take, etc."
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowAdjustStockModal(false); setSelectedProduct(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={adjSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Confirm Changes</button>
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
                <p className="text-xs text-slate-455">Product: <span className="text-indigo-400 font-bold">{selectedProduct?.name}</span></p>
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
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div>Branch: <span className="text-purple-400 font-medium">{log.branchName}</span></div>
                      <div>Prev Qty: <span className="text-slate-300">{log.previousQuantity}</span></div>
                      <div>New Qty: <span className="text-indigo-400 font-bold">{log.newQuantity}</span></div>
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

      {/* Initiate Transfer Modal */}
      {showAddTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Initiate Stock Transfer</h3>
            {transferError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{transferError}</div>}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Source Branch</label>
                  <select
                    value={transferSourceBranchId}
                    onChange={(e) => setTransferSourceBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Branch</label>
                  <select
                    value={transferTargetBranchId}
                    onChange={(e) => setTransferTargetBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
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
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={prodSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Adjust Inventory Level</h3>
            <p className="text-xs text-slate-455 mb-4">Product: <span className="text-indigo-400 font-bold">{selectedProduct?.name}</span></p>
            {adjError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{adjError}</div>}
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              {!activeBusiness.sharedStockMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch Location Context</label>
                  <select
                    value={adjBranchId}
                    onChange={(e) => {
                      setAdjBranchId(e.target.value);
                      const currentStock = selectedProduct.branchStocks?.find((bs: any) => bs.branchId === e.target.value) || { quantity: 0, minStockLevel: 0 };
                      setAdjQuantity(currentStock.quantity);
                      setAdjMinLevel(currentStock.minStockLevel);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Stock Quantity</label>
                  <input
                    type="number"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Low Stock Alert Limit</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Intake delivery, damaged items, stock take, etc."
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => { setShowAdjustStockModal(false); setSelectedProduct(null); }} className="flex-1 py-2.5 bg-slate-800 text-slate-355 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={adjSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">Confirm Changes</button>
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
                <p className="text-xs text-slate-455">Product: <span className="text-indigo-400 font-bold">{selectedProduct?.name}</span></p>
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
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div>Branch: <span className="text-purple-400 font-medium">{log.branchName}</span></div>
                      <div>Prev Qty: <span className="text-slate-300">{log.previousQuantity}</span></div>
                      <div>New Qty: <span className="text-indigo-400 font-bold">{log.newQuantity}</span></div>
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

      {/* Initiate Transfer Modal */}
      {showAddTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Initiate Stock Transfer</h3>
            {transferError && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs">{transferError}</div>}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Source Branch</label>
                  <select
                    value={transferSourceBranchId}
                    onChange={(e) => setTransferSourceBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Branch</label>
                  <select
                    value={transferTargetBranchId}
                    onChange={(e) => setTransferTargetBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                  >
                    {branches.map((br) => (
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
                <button type="submit" disabled={transferSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">{transferSubmitting ? "Initiating..." : "Confirm Transfer"}</button>
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
              <p className="text-[9px] text-slate-450">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
              <p className="text-[9px] text-slate-450">Receipt ID: {selectedSale.id.substring(0, 8).toUpperCase()}</p>
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
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-red-650 font-bold">
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
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-[9px] text-slate-600">
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
              <p className="font-bold text-slate-600">Thank you for your patronage!</p>
              <p>Please keep this receipt as proof of purchase.</p>
            </div>

            {selectedSale.isRefunded && (
              <div className="mt-4 p-2.5 bg-red-50 border border-red-200 text-red-650 font-bold rounded-xl text-center">
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
              className="mt-2 py-2.5 w-full bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
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
                <button type="submit" disabled={promoSubmitting} className="flex-1 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-lg">{promoSubmitting ? "Creating..." : "Create Discount"}</button>
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

      {/* Subscription Expired Lock Overlay */}
      {user?.isSubscriptionActive === false && activeTab !== "billing" && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg flex justify-center items-center p-4 z-45 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-8 bg-slate-900 border border-red-900/30 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-950/50 border border-red-800/40 rounded-full flex items-center justify-center mx-auto text-red-400 text-2xl shadow-lg animate-bounce">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100">Subscription Expired</h3>
              <p className="text-xs text-slate-405 leading-relaxed">
                Access to operational features (inventory, sales, register checkouts, and consolidated reports) is locked because your business subscription is inactive or has expired.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-650/15"
              >
                Go to Billing & Subscriptions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
