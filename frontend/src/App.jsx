import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ElectionsPage from './pages/ElectionsPage';
import ElectionDetailPage from './pages/ElectionDetailPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated, fetchProfile]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00E676',
            accentColorForeground: '#050508',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#181828',
                  color: '#E2E2F0',
                  border: '1px solid #252538',
                  fontFamily: 'DM Sans, sans-serif',
                },
                success: { iconTheme: { primary: '#00E676', secondary: '#050508' } },
                error: { iconTheme: { primary: '#FF4757', secondary: '#050508' } },
              }}
            />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/elections" element={<ElectionsPage />} />
              <Route path="/elections/:id" element={<ElectionDetailPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>}
              />
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;