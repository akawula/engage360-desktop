import { Link, useLocation } from 'react-router-dom';
import { Users, Building2, FileText, CheckSquare, Home, Monitor, LogOut, Menu, ChevronLeft } from 'lucide-react';
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

export default function DesktopSidebar() {
  const { isDesktopSidebarCollapsed, toggleDesktopSidebar } = useNavigation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={clsx(
      "hidden lg:flex flex-col bg-white dark:bg-dark-900 shadow-xl border-r border-dark-200 dark:border-dark-800 transition-all duration-300 ease-in-out",
      isDesktopSidebarCollapsed ? "w-20 xl:w-24" : "w-72 xl:w-80 3xl:w-96"
    )}>
      {/* macOS traffic light spacing */}
      <div className="h-8"></div>

      {/* Hamburger menu for collapsed state */}
      {isDesktopSidebarCollapsed && (
        <div className="h-12 flex items-center justify-center px-2">
          <button
            onClick={toggleDesktopSidebar}
            className="p-2 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            title="Expand sidebar"
          >
            <Menu className="w-5 h-5 text-dark-600 dark:text-dark-300" />
          </button>
        </div>
      )}

      {/* Header with logo and collapse toggle for expanded state */}
      {!isDesktopSidebarCollapsed && (
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-200 dark:border-dark-800 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-engage360.png"
              alt="Engage360"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-dark-900 dark:text-white">
              Engage360
            </span>
          </Link>
          <button
            onClick={toggleDesktopSidebar}
            className="p-2 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-dark-600 dark:text-dark-300" />
          </button>
        </div>
      )}

      {/* Navigation sections with responsive sizing */}
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {/* Logo for collapsed state */}
        {isDesktopSidebarCollapsed && (
          <div className="px-1 py-2 mb-4">
            <Link
              to="/"
              className="flex items-center justify-center p-2 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              title="Engage360"
            >
              <img
                src="/logo-engage360.png"
                alt="Engage360"
                className="w-8 h-8 object-contain"
              />
            </Link>
          </div>
        )}

        {navSections.map((section) => (
          <div key={section.title}>
            {!isDesktopSidebarCollapsed && (
              <h3 className="px-3 py-2 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'group flex items-center py-2 rounded-md text-sm font-medium transition-colors duration-200',
                      isDesktopSidebarCollapsed ? 'px-3 justify-center' : 'px-3',
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-white text-dark-700 dark:text-dark-300'
                    )}
                    title={isDesktopSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={clsx(
                      "w-5 h-5 xl:w-6 xl:h-6",
                      !isDesktopSidebarCollapsed && "mr-3"
                    )} />
                    {!isDesktopSidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile section with responsive layout */}
      <div className="p-2 bg-white dark:bg-dark-900 border-t border-dark-200 dark:border-dark-800">
        {isDesktopSidebarCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <Link
              to="/profile"
              className="p-2 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              title={user ? `${user.firstName} ${user.lastName}` : 'Profile'}
            >
              <img
                src={user?.avatarUrl || '/default-avatar.png'}
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-dark-300 dark:border-dark-600"
              />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-dark-200 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <Link
              to="/devices"
              className="p-2 rounded-md text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-dark-200 transition-colors"
              title="Devices"
            >
              <Monitor className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors">
            <Link to="/profile" className="flex items-center space-x-3 group">
              <div className="relative">
                <img
                  src={user?.avatarUrl || '/default-avatar.png'}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-dark-300 dark:border-dark-600"
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-dark-900 dark:text-dark-100">
                  {user ? `${user.firstName} ${user.lastName}` : ''}
                </p>
              </div>
            </Link>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-dark-200 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <Link
                to="/devices"
                className="p-2 rounded-full text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-dark-200 transition-colors"
                title="Devices"
              >
                <Monitor className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
