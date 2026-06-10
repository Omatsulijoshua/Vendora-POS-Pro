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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
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
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-1 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <span className="text-sm font-bold text-slate-200">Recent Alerts</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400 font-semibold border border-purple-500/20">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-850">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                No recent notifications
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    notification.isRead ? "hover:bg-slate-850/40" : "bg-purple-950/10 hover:bg-purple-950/20"
                  }`}
                >
                  <div className="flex justify-between gap-2 items-start">
                    <span className="text-xs font-bold text-slate-200 line-clamp-1">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 shrink-0"
                        title="Mark as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed break-words">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] text-slate-500">
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      notification.type === "LowStock" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {notification.type === "LowStock" ? "Stock" : "Subscription"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {onViewAll && (
            <button
              onClick={() => {
                setIsOpen(false);
                onViewAll();
              }}
              className="w-full text-center py-2.5 bg-slate-950/40 hover:bg-slate-900 border-t border-slate-800 text-xs font-bold text-purple-400 transition-colors"
            >
              View All Notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}
