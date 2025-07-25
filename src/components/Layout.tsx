import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Users,
    Building2,
    FileText,
    CheckSquare,
    Monitor,
    LogOut,
    Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

interface LayoutProps {
    children: ReactNode;
}

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

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [currentPlatform] = useState('');

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-dark-200">
            {/* Sidebar */}
            <div className="w-72 flex flex-col bg-white dark:bg-dark-900 shadow-xl border-r border-gray-200 dark:border-dark-800">
                {/* Sidebar Header */}
                <div
                    data-tauri-drag-region
                    className={clsx(
                        'h-12 flex items-center justify-center px-4 border-b border-gray-200 dark:border-dark-800 flex-shrink-0',
                        { 'pl-20': currentPlatform === 'darwin' }
                    )}
                >
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
                    {/* Logo as part of navigation */}
                    <div className="px-3 py-2 mb-2">
                        <NavLink
                            to="/"
                            className="flex items-center space-x-3 group hover:bg-gray-100 dark:hover:bg-dark-800 p-2 rounded-md transition-colors duration-200"
                        >
                            <img
                                src="/logo-engage360.png"
                                alt="Engage360 Logo"
                                className="w-8 h-8 object-contain"
                            />
                            <span className="text-lg font-bold text-gray-900 dark:text-dark-100 group-hover:text-gray-900 dark:group-hover:text-white">Engage360</span>
                        </NavLink>
                    </div>

                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wider">{section.title}</h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={clsx(
                                                'group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                                                isActive
                                                    ? 'bg-primary-100 dark:bg-dark-950 text-primary-700 dark:text-dark-50'
                                                    : 'hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-dark-100 text-gray-700 dark:text-dark-300'
                                            )}
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-2 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors duration-200">
                        <NavLink to="/profile" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <img
                                    src={user?.avatarUrl || '/default-avatar.png'}
                                    alt="User Avatar"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-dark-600"
                                />
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-dark-900"></span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-dark-100">{user ? `${user.firstName} ${user.lastName}` : ''}</p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">Online</p>
                            </div>
                        </NavLink>
                        <div className="flex items-center space-x-1">
                            <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-dark-200 transition-colors duration-200">
                                <LogOut className="w-5 h-5" />
                            </button>
                            <NavLink to="/devices" className="p-2 rounded-full text-gray-500 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-dark-200 transition-colors duration-200">
                                <Monitor className="w-5 h-5" />
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y">
                {/* Header */}
                <header
                    data-tauri-drag-region
                    className="flex items-center justify-between p-3 bg-white dark:bg-dark-900 shadow-sm border-b border-gray-200 dark:border-dark-700 h-12 flex-shrink-0"
                >
                    {/* This would be dynamic based on context, e.g., current page or chat */}
                    <div className="flex items-center space-x-4">
                        {/* Search bar could go here */}
                    </div>
                </header>                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-dark-800">
                    {children}
                </main>
            </div>
        </div>
    );
}
