import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';

export default function MobileHeader() {
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  const { user } = useAuth();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 border-b border-dark-200 dark:border-dark-800 safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors touch-manipulation"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-dark-700 dark:text-dark-300" />
          ) : (
            <Menu className="w-6 h-6 text-dark-700 dark:text-dark-300" />
          )}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo-engage360.png"
            alt="Engage360"
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-bold text-dark-900 dark:text-white">
            Engage360
          </span>
        </Link>

        {/* User Avatar */}
        <Link
          to="/profile"
          className="p-1 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors touch-manipulation"
          aria-label="View profile"
        >
          <img
            src={user?.avatarUrl || '/default-avatar.png'}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
