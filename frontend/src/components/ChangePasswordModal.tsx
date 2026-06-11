import React, { useState } from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export default function ChangePasswordModal({ isOpen, onClose, token }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:5149/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 animate-in scale-in duration-300">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🔑 Change Your Password
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-lg text-xs font-medium animate-in slide-in-from-top-2">
            ✕ {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-medium animate-in slide-in-from-top-2">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-850">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
