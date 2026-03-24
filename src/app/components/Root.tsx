import { Outlet, NavLink, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, BarChart2, Bell, Users, Plus,
  LogOut, Shield, ChevronDown, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff Member',
  safety_manager: 'Safety Manager',
  school_admin: 'School Administrator',
  it_admin: 'IT Administrator',
};

const ROLE_COLORS: Record<Role, string> = {
  staff: 'bg-blue-100 text-blue-700',
  safety_manager: 'bg-red-100 text-red-700',
  school_admin: 'bg-purple-100 text-purple-700',
  it_admin: 'bg-gray-100 text-gray-700',
};

interface NavItem { path: string; label: string; Icon: React.ElementType }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  staff: [
    { path: '/', label: 'My Alerts', Icon: LayoutDashboard },
    { path: '/submit', label: 'Submit Alert', Icon: Plus },
  ],
  safety_manager: [
    { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/submit', label: 'Submit Alert', Icon: Plus },
    { path: '/incidents', label: 'Incident Log', Icon: AlertTriangle },
    { path: '/analytics', label: 'Analytics', Icon: BarChart2 },
    { path: '/notifications', label: 'Notifications', Icon: Bell },
    { path: '/users', label: 'User Management', Icon: Users },
  ],
  school_admin: [
    { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/submit', label: 'Submit Alert', Icon: Plus },
    { path: '/incidents', label: 'Incident Log', Icon: AlertTriangle },
    { path: '/analytics', label: 'Analytics', Icon: BarChart2 },
  ],
  it_admin: [
    { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/notifications', label: 'Notifications', Icon: Bell },
  ],
};

export function Root() {
  const { currentUser, isAuthenticated, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!currentUser) return null;

  const navItems = NAV_BY_ROLE[currentUser.role] || [];
  const roles: Role[] = ['staff', 'safety_manager', 'school_admin', 'it_admin'];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="p-1.5 bg-red-600 rounded">
          <Shield className="size-4 text-white" />
        </div>
        <div>
          <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>SafeAlert</div>
          <div className="text-xs text-gray-400">School Safety System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Role Switcher (Demo) */}
      <div className="border-t border-gray-100 p-3">
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors text-left"
          >
            <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700 shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 truncate">{currentUser.name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[currentUser.role]}`}>
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
            <ChevronDown className="size-3 text-gray-400 shrink-0" />
          </button>
          {showRoleSwitcher && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">Switch role (demo)</p>
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => { switchRole(r); setShowRoleSwitcher(false); navigate('/'); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${currentUser.role === r ? 'text-blue-600' : 'text-gray-700'}`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="size-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-600">
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-red-600" />
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>SafeAlert</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
