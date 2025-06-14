
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import PortalCases from "./pages/PortalCases";
import PortalDocuments from "./pages/PortalDocuments";
import PortalMessages from "./pages/PortalMessages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to portal if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return !isAuthenticated ? <>{children}</> : <Navigate to="/portal" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* Protected Portal Routes */}
          <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
          <Route path="/portal/cases" element={<ProtectedRoute><PortalCases /></ProtectedRoute>} />
          <Route path="/portal/documents" element={<ProtectedRoute><PortalDocuments /></ProtectedRoute>} />
          <Route path="/portal/messages" element={<ProtectedRoute><PortalMessages /></ProtectedRoute>} />
          <Route path="/portal/financial" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
          <Route path="/portal/notifications" element={<ProtectedRoute><Portal /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
