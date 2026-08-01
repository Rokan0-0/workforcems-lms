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
          <div className="sidebar-brand">
        <img
          src="/woms_logo.png"
          alt="WorkforceMS"
          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff', lineHeight: 1.1 }}>WorkforceMS</span>
          <span style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.2 }}>Learning Management</span>
        </div>
      </div>

          <nav className="sidebar-menu">
            <div className="menu-section">{isWorkforceMSMode ? '' : 'HR Super-App'}</div>
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

        
              {/* Log Out */}
              <button className="signout-btn" onClick={handleLogout}>
                <LogOut size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--pure-red)' }} />
                Sign Out
              </button>
        </aside>

        {/* Main Workspace */}
        <div className="main-content">
          <header className="topbar">

          <p>Learning Management and Health benefits</p>
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
