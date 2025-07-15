import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Users,
    UsersRound,
    FileText,
    CheckSquare,
    User,
    Monitor,
    LogOut,
    ChevronDown,
    Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/people', label: 'People', icon: Users },
    { path: '/groups', label: 'Groups', icon: UsersRound },
    { path: '/notes', label: 'Notes', icon: FileText },
    { path: '/action-items', label: 'Action Items', icon: CheckSquare },
    { path: '/devices', label: 'Devices', icon: Monitor },
    { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-colors">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">E3</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">Engage360</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-r-2 border-primary-700 dark:border-primary-300'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white capitalize">
                                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* User Profile - only show if user is authenticated */}
                            {user && (
                                <div className="relative group">
                                    <div className="flex items-center space-x-3 cursor-pointer">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={`${user.firstName} ${user.lastName}`}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </span>
                                            </div>
                                        )}
                                        <div className="hidden md:block">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </div>

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-1">
                                            <NavLink
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <User className="w-4 h-4 mr-3" />
                                                Profile Settings
                                            </NavLink>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <LogOut className="w-4 h-4 mr-3" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
