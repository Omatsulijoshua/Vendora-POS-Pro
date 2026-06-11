"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { registerOwner } = useAuth();
  const router = useRouter();

  // Basic step 1 validation
  const validateStep1 = () => {
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please fill in your first and last name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setStep(1);
  };

  const handleSubdomainChange = (val: string) => {
    // Keep it alphanumeric and hyphens only
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!businessName.trim()) {
      setError("Please enter your business name.");
      return;
    }
    if (!subdomain.trim()) {
      setError("Please specify a subdomain for your store.");
      return;
    }

    setSubmitting(true);

    try {
      await registerOwner(
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password,
        businessName.trim(),
        subdomain.trim()
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-background text-foreground min-h-screen py-12 transition-colors duration-300">
      {/* Top action bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
        <ThemeToggle />
        <Link href="/" className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors">
          Home
        </Link>
      </div>

      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg p-8 bg-card border border-border rounded-2xl shadow-xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size={44} className="mb-3" />
          <h1 className="text-2xl font-bold flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
            <span className="text-foreground font-black">Vendora</span>
            <span className="text-[#10B981] font-medium ml-1">Inventory Management System</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-xs">Get started by setting up your brand new account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div className="flex items-center">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === 1 
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                : "bg-accent text-accent-foreground"
            }`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span className="ml-2 text-sm font-semibold text-foreground">Account</span>
          </div>
          <div className="w-12 h-[2px] bg-border" />
          <div className="flex items-center">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === 2 
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                : "bg-secondary text-muted-foreground border border-border"
            }`}>
              2
            </span>
            <span className="ml-2 text-sm font-semibold text-foreground">Business</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm transition-all duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Repeat your password"
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Continue to Business Setup
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Apex Supermarket"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Subdomain Slug
                </label>
                <div className="flex rounded-lg border border-input overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    required
                    className="flex-1 min-w-0 px-4 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                    placeholder="apex-store"
                  />
                  <span className="inline-flex items-center px-4 bg-secondary border-l border-border text-muted-foreground text-sm font-semibold">
                    .vendorapos.com
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 bg-secondary hover:bg-secondary/85 text-foreground font-semibold rounded-lg border border-border transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-2 w-2/3 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submitting ? "Creating account..." : "Register & Enter"}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
