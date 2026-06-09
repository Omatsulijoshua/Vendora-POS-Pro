"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

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

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "categories" | "transfers" | "sales">("overview");

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
    }
  }, [token, user?.businessId, user?.branchId]);

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

  // Submit Business
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative font-sans">
      {/* Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              V
            </div>
            
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-300">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500">Business Owner</p>
            </div>
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

              {activeTab !== "sales" && (
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
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Branches Mapped", value: branches.length.toString(), sub: "Total locations" },
                { label: "Context Net Sales", value: getBranchSales(), sub: activeBranch ? "Branch sales" : "Global sales" },
                { label: "Active Staff Listed", value: staff.length.toString(), sub: activeBranch ? "In branch" : "Consolidated team" },
                { label: "Product Types", value: products.length.toString(), sub: "Registered products" },
              ].map((stat, i) => (
                <div key={i} className="border border-slate-900 bg-slate-900/20 rounded-xl p-5">
                  <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                  <p className="text-3xl font-bold mt-3 text-slate-100">{stat.value}</p>
                  <p className="text-xs text-indigo-400 mt-1 font-medium">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Branch List */}
              <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-100">Branch Locations</h3>
                  <span className="text-xs text-slate-500 font-semibold">Total: {branches.length}</span>
                </div>
                {loadingBranches ? (
                  <div className="text-sm text-slate-500">Loading branch records...</div>
                ) : branches.length === 0 ? (
                  <div className="text-sm text-slate-500">No branches registered.</div>
                ) : (
                  <div className="space-y-3">
                    {branches.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSwitchBranch(b.id)}
                        className={`p-4 rounded-lg bg-slate-950/40 border flex justify-between items-center cursor-pointer transition-colors ${
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

              {/* Staff List */}
              <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-100">
                    Staff Directory {activeBranch ? `(${activeBranch.name})` : "(Consolidated)"}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">Count: {staff.length}</span>
                </div>
                {loadingStaff ? (
                  <div className="text-sm text-slate-500">Loading team...</div>
                ) : staff.length === 0 ? (
                  <div className="text-sm text-slate-500">No staff users registered.</div>
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
                          <p className="font-semibold text-slate-200">${p.price.toFixed(2)}</p>
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

            <button
              onClick={() => {
                setShowReceiptDetailModal(false);
                setSelectedSale(null);
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
