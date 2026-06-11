"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  businessId?: string;
  branchId?: string;
  isSubscriptionActive?: boolean;
}

interface DecodedToken {
  sub: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | string[];
  business_id?: string;
  branch_id?: string;
  is_subscription_active?: string;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerOwner: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    businessName: string,
    subdomain: string
  ) => Promise<void>;
  logout: () => void;
  switchBusiness: (businessId: string) => Promise<void>;
  switchBranch: (branchId: string | null) => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isCashier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Recover session from local storage on load
    const savedToken = localStorage.getItem("vendorapos_token");
    if (savedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(savedToken);
        // Check if token has expired
        const now = Date.now() / 1000;
        if (decoded.exp > now) {
          setToken(savedToken);
          setUser({
            userId: decoded.sub,
            email: decoded.email,
            firstName: decoded.first_name,
            lastName: decoded.last_name,
            role: typeof decoded.role === "string" ? decoded.role : (Array.isArray(decoded.role) ? decoded.role[0] : "") || "",
            businessId: decoded.business_id,
            branchId: decoded.branch_id,
            isSubscriptionActive: decoded.is_subscription_active === "true",
          });
        } else {
          localStorage.removeItem("vendorapos_token");
        }
      } catch (err) {
        console.error("Invalid saved token", err);
        localStorage.removeItem("vendorapos_token");
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (jwt: string) => {
    localStorage.setItem("vendorapos_token", jwt);
    document.cookie = `vendorapos_token=${jwt}; path=/; max-age=86400; SameSite=Lax`;
    const decoded = jwtDecode<DecodedToken>(jwt);
    setToken(jwt);
    setUser({
      userId: decoded.sub,
      email: decoded.email,
      firstName: decoded.first_name,
      lastName: decoded.last_name,
      role: typeof decoded.role === "string" ? decoded.role : (Array.isArray(decoded.role) ? decoded.role[0] : "") || "",
      businessId: decoded.business_id,
      branchId: decoded.branch_id,
      isSubscriptionActive: decoded.is_subscription_active === "true",
    });
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    const data = await res.json();
    handleAuthSuccess(data.token);
  };

  const registerOwner = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    businessName: string,
    subdomain: string
  ) => {
    const res = await fetch(`${API_URL}/auth/register-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        businessName,
        subdomain,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Registration failed");
    }

    const data = await res.json();
    handleAuthSuccess(data.token);
  };

  const switchBusiness = async (businessId: string) => {
    const res = await fetch(`${API_URL}/auth/switch-business/${businessId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to switch business");
    }

    const data = await res.json();
    handleAuthSuccess(data.token);
  };

  const switchBranch = async (branchId: string | null) => {
    const targetId = branchId || "global";
    const res = await fetch(`${API_URL}/auth/switch-branch/${targetId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to switch branch");
    }

    const data = await res.json();
    handleAuthSuccess(data.token);
  };

  const logout = () => {
    localStorage.removeItem("vendorapos_token");
    document.cookie = "vendorapos_token=; path=/; max-age=0; SameSite=Lax";
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = user?.role === "SuperAdmin";
  const isOwner = user?.role === "Owner";
  const isManager = user?.role === "Manager";
  const isCashier = user?.role === "Cashier";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        registerOwner,
        logout,
        switchBusiness,
        switchBranch,
        isAuthenticated,
        isSuperAdmin,
        isOwner,
        isManager,
        isCashier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
