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
];

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500 ease-out border-4 border-gray-200/50 dark:border-gray-700/50 relative backdrop-blur-sm">
            {/* Sidebar */}
            <div className="w-64 bg-white/80 dark:bg-gray-800/80 shadow-xl border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-500 ease-out backdrop-blur-md">
                <div data-tauri-drag-region className="h-6 bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 border-b border-gray-200/50 dark:border-gray-600/50 transition-all duration-500 ease-out backdrop-blur-sm"></div>
                {/* Logo */}
                <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30 transition-all duration-500 ease-out">
                    <div className="flex items-center space-x-2 group">
                        <img
                            src="/logo-engage360.png"
                            alt="Engage360 Logo"
                            className="w-8 h-8 object-contain transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:rotate-6 drop-shadow-sm"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-800 dark:group-hover:from-primary-400 dark:group-hover:to-primary-200">Engage360</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 overflow-hidden">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'group flex items-center justify-between px-4 py-3 mx-1 rounded-xl text-sm font-medium transition-all duration-500 ease-out transform relative',
                                    isActive
                                        ? 'bg-gradient-to-r from-primary-50/40 to-primary-100/30 dark:from-primary-900/50 dark:to-primary-800/30 text-primary-700 dark:text-primary-300 shadow-md shadow-primary-500/10 scale-[1.01]'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50/60 hover:to-gray-100/40 dark:hover:from-gray-700/60 dark:hover:to-gray-600/40 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:shadow-gray-500/5 hover:scale-[1.01]'
                                )}
                            >
                                {/* Left accent line */}
                                <div className={clsx(
                                    "absolute left-0 top-1 bottom-1 w-1 rounded-r-full transition-all duration-500 ease-out",
                                    isActive
                                        ? "bg-gradient-to-b from-primary-400 to-primary-600 scale-y-100"
                                        : "bg-gradient-to-b from-primary-400 to-primary-600 scale-y-0 group-hover:scale-y-100"
                                )} />

                                {/* Content */}
                                <div className="flex items-center space-x-3">
                                    <Icon className={clsx(
                                        "w-5 h-5 transition-all duration-500 ease-out transform",
                                        isActive
                                            ? "text-primary-600 dark:text-primary-400 scale-105"
                                            : "group-hover:text-primary-500 group-hover:scale-105"
                                    )} />
                                    <span className={clsx(
                                        "transition-all duration-500 ease-out transform",
                                        isActive
                                            ? "translate-x-0.5 font-semibold"
                                            : "group-hover:translate-x-0.5 group-hover:font-semibold"
                                    )}>{item.label}</span>
                                </div>

                                {/* Morphing line effect */}
                                <div className={clsx(
                                    "h-0.5 rounded-full transition-all duration-700 ease-out",
                                    isActive
                                        ? "w-6 bg-gradient-to-r from-primary-500 to-primary-600 opacity-100"
                                        : "w-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:w-6 group-hover:opacity-100"
                                )} />
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/30 dark:border-gray-700/30 px-6 py-4 transition-all duration-500 ease-out backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent capitalize transition-all duration-500 ease-out transform hover:scale-[1.02]">
                                {(() => {
                                    if (location.pathname === '/') return 'Dashboard';
                                    if (location.pathname.startsWith('/people/')) return 'People';
                                    if (location.pathname.startsWith('/groups/')) return 'Groups';
                                    if (location.pathname.startsWith('/notes/')) return 'Notes';
                                    if (location.pathname.startsWith('/action-items/')) return 'Action Items';
                                    if (location.pathname.startsWith('/growth/')) return 'Personal Growth';
                                    return location.pathname.slice(1).replace('-', ' ');
                                })()}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* User Profile - only show if user is authenticated */}
                            {user && (
                                <div className="relative group">
                                    <div className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl transition-all duration-500 ease-out hover:bg-gray-50/50 dark:hover:bg-gray-700/50 hover:shadow-lg hover:shadow-gray-500/10 backdrop-blur-sm">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={`${user.firstName} ${user.lastName}`}
                                                className="w-8 h-8 rounded-full transition-all duration-500 ease-out hover:scale-110 hover:shadow-lg ring-2 ring-transparent hover:ring-primary-200 dark:hover:ring-primary-800"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center transition-all duration-500 ease-out hover:scale-110 hover:shadow-lg ring-2 ring-transparent hover:ring-primary-200 dark:hover:ring-primary-800">
                                                <span className="text-white text-sm font-medium">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </span>
                                            </div>
                                        )}
                                        <div className="hidden md:block">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-500">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-500">{user.email}</p>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-400 transition-all duration-500 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-200 group-hover:rotate-180 group-hover:scale-110" />
                                    </div>

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 ease-out transform scale-95 group-hover:scale-100 z-50 backdrop-blur-md">
                                        <div className="py-2 px-2">
                                            <NavLink
                                                to="/profile"
                                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300 ease-out rounded-lg"
                                            >
                                                <User className="w-4 h-4 mr-3 transition-all duration-300 group-hover:scale-110" />
                                                Profile Settings
                                            </NavLink>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300 ease-out rounded-lg"
                                            >
                                                <LogOut className="w-4 h-4 mr-3 transition-all duration-300 group-hover:scale-110" />
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
                <main className="flex-1 overflow-auto transition-all duration-500 ease-out">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
