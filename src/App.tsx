
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import Index from "./pages/Index";
import MockHome from "./pages/MockHome";
import MockHome1 from "./pages/MockHome1";
import MockHome2 from "./pages/MockHome2";
import MockHome3 from "./pages/MockHome3";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import PortalCases from "./pages/PortalCases";
import PortalDocuments from "./pages/PortalDocuments";
import PortalMessages from "./pages/PortalMessages";
import PortalFinancial from "./pages/PortalFinancial";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ClientRegistration from "./pages/ClientRegistration";
import ClientSubscriptions from "./pages/ClientSubscriptions";
import PaymentCheckout from "./pages/PaymentCheckout";

const queryClient = new QueryClient();

// Enhanced Protected Route Component for client portal
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error, isSessionExpired, connectionStatus } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando portal do cliente...</p>
          {connectionStatus === 'offline' && (
            <p className="text-red-500 text-xs mt-2">Verificando conexão...</p>
          )}
        </div>
      </div>
    );
  }
  
  // Handle session expiration
  if (isSessionExpired) {
    return <Navigate to="/login" replace state={{ message: 'Sua sessão expirou. Faça login novamente.' }} />;
  }
  
  // Handle connection errors
  if (error && connectionStatus === 'offline') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro de Conexão</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  
  return user ? (
    <>
      <SessionTimeoutWarning />
      {children}
    </>
  ) : <Navigate to="/login" replace />;
};

// Enhanced Protected Route Component for admin panel
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, adminUser, loading, error, isSessionExpired, connectionStatus } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando painel administrativo...</p>
          {connectionStatus === 'offline' && (
            <p className="text-red-500 text-xs mt-2">Verificando conexão...</p>
          )}
        </div>
      </div>
    );
  }
  
  // Handle session expiration
  if (isSessionExpired) {
    return <Navigate to="/login" replace state={{ message: 'Sua sessão administrativa expirou. Faça login novamente.' }} />;
  }
  
  // Handle connection errors
  if (error && connectionStatus === 'offline') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro de Conexão Administrativa</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  
  // Handle permission errors
  if (user && !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-500 text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Não Autorizado</h2>
          <p className="text-gray-600 mb-4">Você não possui permissões para acessar o painel administrativo.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }
  
  return user && adminUser ? (
    <>
      <SessionTimeoutWarning />
      {children}
    </>
  ) : <Navigate to="/login" replace />;
};

// Enhanced Public Route Component (redirect to portal if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, connectionStatus } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Verificando autenticação...</p>
          {connectionStatus === 'offline' && (
            <p className="text-red-500 text-xs mt-2">Sem conexão com o servidor</p>
          )}
        </div>
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/portal" replace />;
};

// Enhanced Admin Public Route Component (redirect to admin dashboard if already logged in)
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, adminUser, loading, connectionStatus } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Verificando autenticação administrativa...</p>
          {connectionStatus === 'offline' && (
            <p className="text-red-500 text-xs mt-2">Sem conexão com o servidor</p>
          )}
        </div>
      </div>
    );
  }
  
  return !(user && adminUser) ? <>{children}</> : <Navigate to="/admin" replace />;
};

// Unified login route that needs both auth contexts
const UnifiedLogin: React.FC = () => (
  <AuthProvider>
    <AdminAuthProvider>
      <Login />
    </AdminAuthProvider>
  </AuthProvider>
);

const ClientRoutes: React.FC = () => (
  <AuthProvider>
    <Routes>
      <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
      <Route path="/mock" element={<MockHome />} />
      {/* Protected Portal Routes */}
      <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
      <Route path="/portal/cases" element={<ProtectedRoute><PortalCases /></ProtectedRoute>} />
      <Route path="/portal/documents" element={<ProtectedRoute><PortalDocuments /></ProtectedRoute>} />
      <Route path="/portal/messages" element={<ProtectedRoute><PortalMessages /></ProtectedRoute>} />
      <Route path="/portal/financial" element={<ProtectedRoute><PortalFinancial /></ProtectedRoute>} />
      <Route path="/portal/subscriptions" element={<ProtectedRoute><ClientSubscriptions /></ProtectedRoute>} />
      <Route path="/portal/payment" element={<ProtectedRoute><PaymentCheckout paymentType="one_time" /></ProtectedRoute>} />
      <Route path="/portal/notifications" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
    </Routes>
  </AuthProvider>
);

const AdminRoutes: React.FC = () => (
  <AdminAuthProvider>
    <Routes>
      {/* Redirect admin login attempts to unified login page */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/*" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
    </Routes>
  </AdminAuthProvider>
);

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Unified login route with both auth contexts */}
    <Route path="/login" element={<UnifiedLogin />} />

    {/* Mock marketing homepages */}
    <Route path="/mock" element={<MockHome />} />
    <Route path="/mock1" element={<MockHome1 />} />
    <Route path="/mock2" element={<MockHome2 />} />
    <Route path="/mock3" element={<MockHome3 />} />

    {/* Admin Routes */}
    <Route path="/admin/*" element={<AdminRoutes />} />

    {/* Client Routes */}
    <Route path="/*" element={<ClientRoutes />} />
    
    {/* Catch-all 404 route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
