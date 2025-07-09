import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import ActionItems from './pages/ActionItems';
import ActionItemDetail from './pages/ActionItemDetail';
import Profile from './pages/Profile';
import Devices from './pages/Devices';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const {
    fetchPeople,
    fetchGroups,
    fetchNotes,
    fetchActionItems,
    fetchDevices,
    fetchUserProfile,
  } = useAppStore();

  useEffect(() => {
    // Load initial data
    fetchPeople();
    fetchGroups();
    fetchNotes();
    fetchActionItems();
    fetchDevices();
    fetchUserProfile();
  }, [fetchPeople, fetchGroups, fetchNotes, fetchActionItems, fetchDevices, fetchUserProfile]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Layout>
              <Routes>
                <Route path="/" element={<People />} />
                <Route path="/people" element={<People />} />
                <Route path="/people/:personId" element={<PersonDetail />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:groupId" element={<GroupDetail />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/notes/:noteId" element={<NoteDetail />} />
                <Route path="/action-items" element={<ActionItems />} />
                <Route path="/action-items/:actionItemId" element={<ActionItemDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/devices" element={<Devices />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
