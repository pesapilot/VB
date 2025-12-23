import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  LayoutDashboard,
  Users,
  PiggyBank,
  Landmark,
  Receipt,
  Heart,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  User,
  Shield,
  FolderOpen,
  Check
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useGroup } from '../../context/GroupContext'
import { profilesApi } from '../../lib/api'
import { cn } from '../../lib/cn'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresGroup: true },
  { name: 'My Groups', href: '/dashboard/groups', icon: FolderOpen, requiresGroup: false },
  { name: 'Members', href: '/dashboard/members', icon: Users, requiresGroup: true },
  { name: 'Savings', href: '/dashboard/savings', icon: PiggyBank, requiresGroup: true },
  { name: 'Loans', href: '/dashboard/loans', icon: Landmark, requiresGroup: true },
  { name: 'Repayments', href: '/dashboard/repayments', icon: Receipt, requiresGroup: true },
  { name: 'Social Fund', href: '/dashboard/social-fund', icon: Heart, requiresGroup: true },
  { name: 'Penalties', href: '/dashboard/penalties', icon: AlertTriangle, requiresGroup: true },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, requiresGroup: true },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, requiresGroup: true },
]

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentGroup, myGroups, selectGroup } = useGroup()

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: profilesApi.getCurrent,
  })

  const isSuperAdmin = profile?.data?.platform_role === 'super_admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Wise Village</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Group Selector */}
          {myGroups.length > 0 && (
            <div className="px-3 py-3 border-b">
              <div className="relative">
                <button
                  onClick={() => setGroupMenuOpen(!groupMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {currentGroup?.name || 'Select Group'}
                    </span>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', groupMenuOpen && 'rotate-180')} />
                </button>
                
                <AnimatePresence>
                  {groupMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 max-h-48 overflow-y-auto"
                    >
                      {myGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            selectGroup(group)
                            setGroupMenuOpen(false)
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <span className="truncate">{group.name}</span>
                          {currentGroup?.id === group.id && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
              const isDisabled = item.requiresGroup && !currentGroup
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
                    title="Select a group first"
                  >
                    <item.icon className="h-5 w-5 mr-3 text-gray-300" />
                    {item.name}
                  </div>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 mr-3', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Super Admin Link */}
            {isSuperAdmin && (
              <>
                <div className="my-2 border-t" />
                <Link
                  to="/dashboard/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === '/dashboard/admin'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Shield className={cn('h-5 w-5 mr-3', location.pathname === '/dashboard/admin' ? 'text-purple-600' : 'text-gray-400')} />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1"
                    >
                      <Link
                        to="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
