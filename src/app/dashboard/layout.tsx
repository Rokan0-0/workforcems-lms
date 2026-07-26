'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Banknote,
  Briefcase,
  GraduationCap,
  Bot,
  FileText,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  Bell,
  AlertTriangle,
  Award,
  Settings
} from 'lucide-react';

import { SessionContext, UserSession, clearCache } from './session-provider';
import { getStoredFeatureFlags, setStoredFeatureFlags } from '../../config/features';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [flags, setFlags] = useState(getStoredFeatureFlags());

  // Keep flags state synced
  useEffect(() => {
    setFlags(getStoredFeatureFlags());
  }, [refreshFlag]);

  const triggerRefresh = () => {
    clearCache();
    setRefreshFlag(prev => prev + 1);
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, [user, refreshFlag]);

  const markNotificationRead = async (id?: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', id })
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Auto-seed default HR Admin session if unauthenticated
          const loginRes = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: 'emp-2' })
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            setUser(loginData.user);
          }
        }
      } catch (err) {
        console.error('Auth check error', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, refreshFlag]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Auto redirect from /dashboard to /dashboard/training when in WorkforceMS mode
  useEffect(() => {
    if (flags.workforceMSMode !== false && pathname === '/dashboard') {
      router.replace('/dashboard/training');
    }
  }, [flags.workforceMSMode, pathname, router]);

  const switchRole = async (employeeId: string) => {
    setLoading(true);
    clearCache();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Refresh page or trigger context state
        triggerRefresh();
        router.push(flags.workforceMSMode !== false ? '/dashboard/training' : '/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    clearCache();
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      router.push('/');
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkforceMSMode = () => {
    const updated = { ...flags, workforceMSMode: !flags.workforceMSMode };
    setFlags(updated);
    setStoredFeatureFlags(updated);
    triggerRefresh();
  };

  if (loading && !user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '18px',
        fontWeight: 600
      }}>
        Initializing session...
      </div>
    );
  }

  const isAdmin = user?.role === 'HR Admin';

  // Construct menu items based on WorkforceMS Mode (Only LMS Software + HMO Benefits)
  const isWorkforceMSMode = flags.workforceMSMode !== false; // Default ON

  const allMenuItems = isAdmin
    ? isWorkforceMSMode
      ? [
          { path: '/dashboard/training', label: 'AI LMS Training & Dev', icon: GraduationCap },
          { path: '/dashboard/benefits', label: 'HMO & Health Benefits', icon: FileText },
        ]
      : [
          { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/dashboard/employees', label: 'Employees', icon: Users },
          { path: '/dashboard/attendance', label: 'Attendance & Leave', icon: CalendarClock },
          { path: '/dashboard/payroll', label: 'Payroll & EWA', icon: Banknote },
          { path: '/dashboard/statutory', label: 'Statutory & Taxes', icon: Award },
          { path: '/dashboard/benefits', label: 'HMO & Benefits', icon: FileText },
          { path: '/dashboard/recruitment', label: 'Recruitment & Jobs', icon: Briefcase },
          { path: '/dashboard/memos', label: 'Memos & Mails', icon: FileText },
          { path: '/dashboard/incidents', label: 'Queries & Sanctions', icon: AlertTriangle },
          { path: '/dashboard/performance', label: 'Performance', icon: Award },
          { path: '/dashboard/training', label: 'Training & Dev', icon: GraduationCap },
          { path: '/dashboard/ai-assistant', label: 'AI HR Assistant', icon: Bot },
          { path: '/dashboard/settings', label: 'Platform Mode', icon: Settings },
        ]
    : isWorkforceMSMode
      ? [
          { path: '/dashboard/training', label: 'My LMS Courses', icon: GraduationCap },
          { path: '/dashboard/benefits', label: 'My HMO & Benefits', icon: FileText },
        ]
      : [
          { path: '/dashboard', label: 'Portal Home', icon: LayoutDashboard },
          { path: '/dashboard/employees', label: 'My Profile', icon: User },
          { path: '/dashboard/attendance', label: 'Attendance & Leave', icon: CalendarClock },
          { path: '/dashboard/payroll', label: 'My Payslips & EWA', icon: Banknote },
          { path: '/dashboard/benefits', label: 'My HMO & Benefits', icon: FileText },
          { path: '/dashboard/performance', label: 'Performance & Goals', icon: Award },
          { path: '/dashboard/memos', label: 'Memos & Mails', icon: FileText },
          { path: '/dashboard/incidents', label: 'Queries & Sanctions', icon: AlertTriangle },
          { path: '/dashboard/training', label: 'Training & Dev', icon: GraduationCap },
          { path: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Bot },
        ];

  const menuItems = allMenuItems;

  // Map pathname to header title
  const getHeaderTitle = () => {
    if (pathname === '/dashboard') return isAdmin ? 'WorkforceMS Control Center' : 'Employee Self-Service Portal';
    if (pathname.includes('/employees')) return isAdmin ? 'Employee Management' : 'My Personal Profile';
    if (pathname.includes('/attendance')) return 'Attendance & Leave Management';
    if (pathname.includes('/payroll')) return isAdmin ? 'Payroll & Deductions Ledger' : 'My Monthly Payslips';
    if (pathname.includes('/recruitment')) return 'Recruitment & Onboarding Pipelines';
    if (pathname.includes('/memos')) return 'Company Memos & Announcements';
    if (pathname.includes('/incidents')) return 'Incident Reporting & Sanctions';
    if (pathname.includes('/performance')) return 'Performance Metrics & Goals';
    if (pathname.includes('/training')) return 'AI LMS Training & Development';
    if (pathname.includes('/ai-assistant')) return 'Conversational AI Assistant';
    if (pathname.includes('/benefits')) return 'HMO & Healthcare Benefits';
    if (pathname.includes('/settings')) return 'Platform Mode Configuration';
    return 'WorkforceMS Management';
  };

  return (
    <SessionContext.Provider value={{ user, theme, toggleTheme, switchRole, loading, triggerRefresh, refreshFlag }}>
      <div className="app-shell">
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/woms_logo.png" alt="WorkforceMS Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '19px', letterSpacing: '-0.5px', color: '#ffffff' }}>
              WorkforceMS
            </span>
          </div>

          <nav className="sidebar-menu">
            <div className="menu-section">{isWorkforceMSMode ? 'WorkforceMS Engine' : 'HR Super-App'}</div>
            <ul>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <Icon className="menu-item-icon" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="sidebar-footer">
            {user && (
              <div className="user-badge">
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="user-avatar"
                  style={{ border: '2px solid #16a34a' }}
                />
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="main-content">
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="hamburger-btn"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                title="Toggle Menu"
              >
                <Menu size={20} />
              </button>
              <div className="page-title-area">
                <h1 className="page-title">{getHeaderTitle()}</h1>
                <p className="page-subtitle">WorkforceMS Engine • AI LMS + Healthcare Benefits</p>
              </div>
            </div>

            <div className="topbar-actions">
              {/* Instant Switcher Dropdown */}
              <div className="role-switcher-container">
                <span className="role-switcher-label">Role:</span>
                <select
                  className="role-select"
                  value={user?.id || ''}
                  onChange={(e) => switchRole(e.target.value)}
                  style={{ color: '#22c55e' }}
                >
                  <option value="emp-2">Admin: Olumide (HR)</option>
                  <option value="emp-1">Admin: Chioma (Engineering)</option>
                  <option value="emp-3">Employee: Fatima (Finance)</option>
                  <option value="emp-19">Employee: Taiwo (Recent Hire)</option>
                </select>
              </div>

              {/* Notifications Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  className="theme-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                  style={{ position: 'relative' }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'var(--danger)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <strong style={{ fontSize: '14px' }}>Notifications</strong>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markNotificationRead()}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div style={{
                      overflowY: 'auto',
                      flex: 1,
                      maxHeight: '300px'
                    }}>
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: '24px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '12px'
                        }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).map(note => (
                          <div
                            key={note.id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--border-color)',
                              backgroundColor: note.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (!note.read) {
                                markNotificationRead(note.id);
                              }
                              router.push('/dashboard/memos');
                              setShowNotifications(false);
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '8px'
                            }}>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: note.read ? 600 : 800,
                                color: note.read ? 'var(--text-secondary)' : 'var(--text-primary)'
                              }}>
                                {note.title}
                              </span>
                              {!note.read && (
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary)',
                                  flexShrink: 0,
                                  marginTop: '5px'
                                }} />
                              )}
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              lineHeight: '1.4'
                            }}>
                              {note.message}
                            </p>
                            <span style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              marginTop: '2px'
                            }}>
                              {note.createdDate}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button className="theme-btn" onClick={toggleTheme} title="Toggle Light/Dark Theme">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Log Out */}
              <button className="signout-btn" onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Sign Out
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
