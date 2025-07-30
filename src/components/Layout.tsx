import { ReactNode } from 'react';
import { NavigationProvider } from '../contexts/NavigationContext';
import MobileHeader from './navigation/MobileHeader';
import MobileSidebar from './navigation/MobileSidebar';
import DesktopSidebar from './navigation/DesktopSidebar';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <NavigationProvider>
            <div className="flex h-screen bg-dark-50 dark:bg-dark-950 text-dark-900 dark:text-dark-200">
                {/* Mobile Header */}
                <MobileHeader />

                {/* Mobile Sidebar */}
                <MobileSidebar />

                {/* Desktop Sidebar */}
                <DesktopSidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Desktop Header (hidden on mobile) */}
                    <header
                        data-tauri-drag-region
                        className="hidden lg:flex items-center justify-between p-3 bg-white dark:bg-dark-900 shadow-sm border-b border-dark-200 dark:border-dark-800 h-12 flex-shrink-0"
                    >
                        {/* Desktop header content can be added here */}
                        <div className="flex items-center space-x-4">
                            {/* Search bar or other header content */}
                        </div>
                    </header>

                    {/* Main Content Area with mobile padding */}
                    <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-dark-50 dark:bg-dark-800 pt-16 lg:pt-6">
                        {children}
                    </main>
                </div>
            </div>
        </NavigationProvider>
    );
}
