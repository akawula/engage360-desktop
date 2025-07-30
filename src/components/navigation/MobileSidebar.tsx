import { Link, useLocation } from 'react-router-dom';
import { X, Users, Building2, FileText, CheckSquare, Home, Monitor, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';

const navSections = [
  {
    title: 'Main',
    items: [
      { path: '/', label: 'Home', icon: Home },
      { path: '/people', label: 'People', icon: Users },
      { path: '/groups', label: 'Groups', icon: Building2 },
    ]
  },
  {
    title: 'Work',
    items: [
      { path: '/notes', label: 'Notes', icon: FileText },
      { path: '/action-items', label: 'Action Items', icon: CheckSquare },
    ]
  }
];

export default function MobileSidebar() {
  const { isMobileMenuOpen, closeMobileMenu } = useNavigation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
  };

  return (
    <>
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        id="mobile-navigation"
        className={clsx(
          "lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-dark-900 z-50 transform transition-transform duration-300 ease-in-out safe-area-inset-top safe-area-inset-bottom",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-200 dark:border-dark-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo-engage360.png"
              alt="Engage360"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-dark-900 dark:text-white">
              Engage360
            </span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-dark-600 dark:text-dark-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-3 py-2 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={clsx(
                        'flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors touch-manipulation',
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
                      )}
                    >
                      <Icon className="w-6 h-6 mr-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-dark-200 dark:border-dark-800 p-4">
          <Link
            to="/profile"
            onClick={closeMobileMenu}
            className="flex items-center p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors mb-2 touch-manipulation"
          >
            <img
              src={user?.avatarUrl || '/default-avatar.png'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <div className="flex-1">
              <p className="font-medium text-dark-900 dark:text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                View profile
              </p>
            </div>
          </Link>

          <div className="flex gap-2">
            <Link
              to="/devices"
              onClick={closeMobileMenu}
              className="flex-1 flex items-center justify-center p-3 rounded-lg border border-dark-300 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors touch-manipulation"
              aria-label="Devices"
            >
              <Monitor className="w-5 h-5 text-dark-600 dark:text-dark-400" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center p-3 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
