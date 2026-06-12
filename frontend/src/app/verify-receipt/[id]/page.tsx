"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, Receipt, Calendar, User, Store, MapPin, Phone, CreditCard } from "lucide-react";

export default function VerifyReceiptPage() {
  const { id } = useParams();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVerification = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5149/api/sales/verify/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Invalid receipt verification ID. This receipt could not be verified.");
          }
          throw new Error("Failed to fetch verification details from server.");
        }
        const data = await res.json();
        setSale(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-slate-800 rounded-full"></div>
          <div className="h-6 w-48 bg-slate-800 rounded"></div>
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
          <div className="w-full space-y-3 pt-6 border-t border-slate-800">
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6"></div>
            <div className="h-4 bg-slate-800 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-950/50 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Verification Failed</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {error || "We could not find any transaction records matching this receipt code."}
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Go to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Verification Banner */}
        <div className="flex flex-col items-center text-center border-b border-slate-800 pb-6">
          <div className="w-16 h-16 bg-emerald-950/40 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4 animate-bounce">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/10">
            Official Receipt Verified
          </span>
          <h1 className="text-2xl font-black mt-3 tracking-tight text-white">{sale.businessName}</h1>
          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1 font-mono">
            <Receipt className="w-3.5 h-3.5 text-indigo-400" /> ID: {sale.saleId.toUpperCase()}
          </p>
        </div>

        {/* Store & Metadata Details */}
        <div className="py-5 border-b border-slate-800 space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Store className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">{sale.branchName}</p>
              {sale.branchAddress && (
                <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-600" /> {sale.branchAddress}
                </p>
              )}
              {sale.branchPhone && (
                <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-600" /> {sale.branchPhone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-500" />
            <p>
              Cashier: <span className="font-semibold text-slate-200">{sale.cashierName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <p>
              Date: <span className="font-semibold text-slate-200">{new Date(sale.createdAt).toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <p>
              Payment: <span className="font-bold text-indigo-400">{sale.paymentMethod}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-5 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Transaction Items</h3>
          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
            {sale.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-200">{item.productName}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.quantity} x ₦{item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold text-slate-200">₦{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="pt-5 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>₦{sale.subtotal.toFixed(2)}</span>
          </div>

          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-red-400 font-semibold">
              <span>Applied Discounts</span>
              <span>-₦{sale.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {sale.taxAmount > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Sales Tax</span>
              <span>₦{sale.taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-3 text-white">
            <span>TOTAL PAID</span>
            <span className="text-indigo-400 text-base">₦{sale.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Certified Footer */}
        <div className="mt-8 text-center text-[10px] text-slate-600">
          <p className="font-medium tracking-wide">VENDORA INVENTORY MANAGEMENT SYSTEM SECURE RECEIPT VERIFIER</p>
          <p className="mt-0.5">© 2026 Vendora Inventory Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
