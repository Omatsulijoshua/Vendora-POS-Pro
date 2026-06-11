"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardFallbackPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user) {
        const role = user.role;
        if (role === "SuperAdmin") {
          router.push("/dashboard/super-admin");
        } else if (role === "Owner") {
          router.push("/dashboard/owner");
        } else if (role === "Manager") {
          router.push("/dashboard/manager");
        } else if (role === "Cashier") {
          router.push("/dashboard/cashier");
        }
      }
    }
  }, [user, loading, isAuthenticated, router]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-background min-h-screen text-foreground">
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      
      <div className="flex flex-col items-center z-10 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-semibold">Redirecting you to your space...</p>
      </div>
    </div>
  );
}
