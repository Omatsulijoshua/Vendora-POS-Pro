"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function OPayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const amount = searchParams.get("amount") || "0";
  const businessId = searchParams.get("businessId");
  const plan = searchParams.get("plan") || "Pro";
  const duration = searchParams.get("duration") || "1";

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5149/api/billing/pay-opay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: plan,
          durationMonths: parseInt(duration, 10)
        })
      });

      if (res.ok) {
        alert("Payment Successful!");
        router.push("/dashboard/owner?tab=billing&payment=success");
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Error processing payment via API");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-[#2d3436] flex justify-center items-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-[400px] w-full overflow-hidden border border-[#dfe6e9]">
        <div className="bg-[#00b894] text-white p-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-1">OPay Checkout</h1>
          <p className="text-xs opacity-90">Secured by OPay</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-xs text-[#636e72] block mb-1 uppercase tracking-wider font-semibold">Total Amount to Pay</span>
            <h2 className="text-4xl font-extrabold text-[#2d3436]">
              ₦{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              Plan: {plan} • Duration: {duration} Month(s)
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
              {errorMessage}
            </div>
          )}
          
          <div className="mb-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#636e72] uppercase tracking-wider">Card Number</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-lg border border-[#dfe6e9] text-sm bg-gray-50 focus:outline-none focus:border-[#00b894]"
                value="5555 5555 5555 5555" 
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#636e72] uppercase tracking-wider">Expiry Date</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-[#dfe6e9] text-sm bg-gray-50 focus:outline-none focus:border-[#00b894]"
                  value="12/28" 
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#636e72] uppercase tracking-wider">CVV</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-[#dfe6e9] text-sm bg-gray-50 focus:outline-none focus:border-[#00b894]"
                  value="123" 
                  readOnly
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full p-4 bg-[#00b894] hover:bg-[#00a884] text-white rounded-lg font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none shadow-md shadow-[#00b894]/20"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
          
          <p className="text-center mt-4 text-[10px] text-[#636e72] leading-relaxed">
            This is a simulation. No real money will be charged.
          </p>
        </div>
        
        <div className="text-center p-4 border-t border-[#dfe6e9] text-[10px] text-[#636e72] bg-gray-50 font-medium">
          Powered by OPay
        </div>
      </div>
    </div>
  );
}

export default function OPayCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-[#636e72] font-semibold">Loading checkout details...</p>
      </div>
    }>
      <OPayCheckoutContent />
    </Suspense>
  );
}
