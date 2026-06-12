import React, { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  timestamp: string;
  readAt: string | null;
}

interface NotificationBellProps {
  token: string | null;
  onViewAll?: () => void;
}

export default function NotificationBell({ token, onViewAll }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const baseUrl = "http://localhost:5149";

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll every 30 seconds for live updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${baseUrl}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-95 cursor-pointer"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-650 text-[9px] font-black text-white ring-2 ring-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Sliding Sidebar Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
          />

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            {/* Sidebar panel */}
            <div className="w-screen max-w-md border-l border-slate-900 bg-slate-950/95 backdrop-blur-md text-slate-200 shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-out animate-in slide-in-from-right">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
                <div className="flex items-center space-x-3">
                  <span className="p-2 rounded-lg bg-indigo-650/10 text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Notifications</h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">System Alerts & Broadcasts</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Action Bar */}
              {unreadCount > 0 && (
                <div className="px-6 py-3 bg-indigo-650/5 border-b border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-indigo-400 font-bold">{unreadCount} unread alert(s)</span>
                  <button 
                    onClick={async () => {
                      try {
                        await Promise.all(notifications.filter(n => !n.isRead).map(n => 
                          fetch(`${baseUrl}/api/notifications/${n.id}/read`, {
                            method: "PUT",
                            headers: { "Authorization": `Bearer ${token}` }
                          })
                        ));
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-405 font-semibold transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-550">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border transition-all ${
                        n.isRead 
                          ? "bg-slate-950/20 border-slate-900/40 hover:border-slate-900" 
                          : "bg-indigo-950/10 border-indigo-950/30 hover:border-indigo-950/50 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between gap-3 items-start">
                        <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-350 font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Read
                          </button>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed break-words">
                        {n.message}
                      </p>
                      
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900/40 text-[9px] text-slate-500">
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                          n.type === "LowStock" 
                            ? "bg-red-950/40 text-red-400 border border-red-900/20" 
                            : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/20"
                        }`}>
                          {n.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-900 bg-slate-900/10 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onViewAll) onViewAll();
                  }}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
