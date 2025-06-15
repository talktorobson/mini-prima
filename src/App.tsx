
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import PortalCases from "./pages/PortalCases";
import PortalDocuments from "./pages/PortalDocuments";
import PortalMessages from "./pages/PortalMessages";
import PortalFinancial from "./pages/PortalFinancial";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component for client portal
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Protected Route Component for admin panel
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, adminUser, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  return user && adminUser ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to portal if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/portal" replace />;
};

// Admin Public Route Component (redirect to admin dashboard if already logged in)
const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, adminUser, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  return !(user && adminUser) ? <>{children}</> : <Navigate to="/admin" replace />;
};

const ClientRoutes: React.FC = () => (
  <AuthProvider>
    <Routes>
      <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Protected Portal Routes */}
      <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
      <Route path="/portal/cases" element={<ProtectedRoute><PortalCases /></ProtectedRoute>} />
      <Route path="/portal/documents" element={<ProtectedRoute><PortalDocuments /></ProtectedRoute>} />
      <Route path="/portal/messages" element={<ProtectedRoute><PortalMessages /></ProtectedRoute>} />
      <Route path="/portal/financial" element={<ProtectedRoute><PortalFinancial /></ProtectedRoute>} />
      <Route path="/portal/notifications" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
    </Routes>
  </AuthProvider>
);

const AdminRoutes: React.FC = () => (
  <AdminAuthProvider>
    <Routes>
      {/* Redirect admin login attempts to unified login page */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/clients" element={<AdminProtectedRoute><div>Admin Clients - Coming Soon</div></AdminProtectedRoute>} />
      <Route path="/admin/cases" element={<AdminProtectedRoute><div>Admin Cases - Coming Soon</div></AdminProtectedRoute>} />
      <Route path="/admin/documents" element={<AdminProtectedRoute><div>Admin Documents - Coming Soon</div></AdminProtectedRoute>} />
      <Route path="/admin/financial" element={<AdminProtectedRoute><div>Admin Financial - Coming Soon</div></AdminProtectedRoute>} />
      <Route path="/admin/messages" element={<AdminProtectedRoute><div>Admin Messages - Coming Soon</div></AdminProtectedRoute>} />
      <Route path="/admin/settings" element={<AdminProtectedRoute><div>Admin Settings - Coming Soon</div></AdminProtectedRoute>} />
    </Routes>
  </AdminAuthProvider>
);

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Client Routes */}
    <Route path="/*" element={<ClientRoutes />} />
    
    {/* Admin Routes */}
    <Route path="/admin/*" element={<AdminRoutes />} />
    
    {/* Catch-all 404 route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
