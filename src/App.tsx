import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { StoreErrorHandler } from './components/StoreErrorHandler';
import { TauriEventHandler } from './components/TauriEventHandler';
import { deepLinkService } from './services/deepLinkService';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Notes from './pages/Notes';
import CreateNote from './pages/CreateNote';
import NoteDetail from './pages/NoteDetail';
import ActionItems from './pages/ActionItems';
import CreateActionItem from './pages/CreateActionItem';
import ActionItemDetail from './pages/ActionItemDetail';
import Profile from './pages/Profile';
import Devices from './pages/Devices';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnMount: false, // Don't automatically refetch on component mount
      refetchOnReconnect: false, // Don't refetch when network reconnects
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 2; // Only retry twice for server errors
      },
    },
  },
});

function App() {
  // Initialize deep link service
  useEffect(() => {
    const initDeepLinks = async () => {
      try {
        await deepLinkService.initialize();
      } catch (error) {
        console.error('Failed to initialize deep link service:', error);
      }
    };

    initDeepLinks();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider defaultConfig={{ position: 'top-right', maxNotifications: 5 }}>
          <StoreErrorHandler />
          <TauriEventHandler />
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-white dark:bg-dark-950 transition-colors">
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/people" element={<People />} />
                      <Route path="/people/:personId" element={<PersonDetail />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/groups/:groupId" element={<GroupDetail />} />
                      <Route path="/notes" element={<Notes />} />
                      <Route path="/notes/create" element={<CreateNote />} />
                      <Route path="/notes/:noteId" element={<NoteDetail />} />
                      <Route path="/action-items" element={<ActionItems />} />
                      <Route path="/action-items/create" element={<CreateActionItem />} />
                      <Route path="/action-items/:actionItemId/edit" element={<CreateActionItem />} />
                      <Route path="/action-items/:actionItemId" element={<ActionItemDetail />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/devices" element={<Devices />} />
                      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              </div>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
