import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Activity, Brain, Users, FlaskConical,
  GitCompare, Sliders, BarChart3, History, Settings,
  Shield, Database, LogOut, Zap, ChevronRight,
  Heart, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/patient-analysis', icon: Activity, label: 'Patient Analysis' },
  { path: '/explainable', icon: Brain, label: 'Explainable AI' },
  { path: '/risk-profiles', icon: TrendingUp, label: 'Risk Profiles' },
  { path: '/similar-patients', icon: Users, label: 'Similar Patients' },
  { path: '/counterfactual', icon: FlaskConical, label: 'Counterfactual Lab' },
  { path: '/what-if', icon: Sliders, label: 'What-If Simulator' },
  { path: '/model-lab', icon: Database, label: 'Model Lab' },
  { path: '/reliability', icon: Shield, label: 'Trust & Reliability' },
  { path: '/cross-dataset', icon: GitCompare, label: 'Cross-Dataset' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/history', icon: History, label: 'Prediction History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-brand-600">
          <Heart size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">ReAdmissionIQ</p>
          <p className="text-[10px] text-gray-400 leading-tight">Healthcare Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 group transition-colors',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
            <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
