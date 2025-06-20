import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface SessionTimeoutWarningProps {
  onExtendSession?: () => void;
  onLogout?: () => void;
  warningTimeMinutes?: number;
  autoLogoutMinutes?: number;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  onExtendSession,
  onLogout,
  warningTimeMinutes = 5,
  autoLogoutMinutes = 10
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAutoLogout, setIsAutoLogout] = useState(false);
  
  const { session: clientSession, signOut: clientSignOut, isSessionExpired: clientExpired } = useAuth();
  const { session: adminSession, signOut: adminSignOut, isSessionExpired: adminExpired } = useAdminAuth();
  
  // Use whichever session is active
  const session = clientSession || adminSession;
  const signOut = clientSignOut || adminSignOut;
  const isSessionExpired = clientExpired || adminExpired;

  useEffect(() => {
    if (!session) return;

    const checkSessionTimeout = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      
      if (!expiresAt) return;
      
      const timeUntilExpiry = expiresAt - now;
      const warningTime = warningTimeMinutes * 60;
      const autoLogoutTime = autoLogoutMinutes * 60;
      
      if (timeUntilExpiry <= 0) {
        // Session has expired
        setIsAutoLogout(true);
        setShowWarning(true);
        setTimeLeft(0);
        
        // Auto logout after a brief delay
        setTimeout(() => {
          handleLogout();
        }, 3000);
        
      } else if (timeUntilExpiry <= warningTime) {
        // Show warning
        setShowWarning(true);
        setTimeLeft(timeUntilExpiry);
        setIsAutoLogout(timeUntilExpiry <= autoLogoutTime);
      } else {
        // Normal operation
        setShowWarning(false);
        setTimeLeft(0);
        setIsAutoLogout(false);
      }
    };

    // Check immediately
    checkSessionTimeout();
    
    // Then check every 30 seconds
    const interval = setInterval(checkSessionTimeout, 30000);
    
    return () => clearInterval(interval);
  }, [session, warningTimeMinutes, autoLogoutMinutes]);

  useEffect(() => {
    if (isSessionExpired) {
      setShowWarning(true);
      setIsAutoLogout(true);
      setTimeLeft(0);
    }
  }, [isSessionExpired]);

  const handleExtendSession = async () => {
    try {
      if (onExtendSession) {
        onExtendSession();
      } else {
        // Default: just make a simple API call to extend session
        // This could be replaced with your specific session extension logic
        await fetch('/api/ping', { 
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
      }
      
      setShowWarning(false);
      setTimeLeft(0);
      setIsAutoLogout(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      // If extension fails, proceed with logout
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force page reload as fallback
      window.location.reload();
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (!showWarning) return null;

  if (isAutoLogout) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-600">
              {isSessionExpired ? 'Sessão Expirada' : 'Saindo Automaticamente'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSessionExpired 
                ? 'Sua sessão expirou por motivos de segurança.'
                : 'Fazendo logout automático por inatividade...'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <Clock className="h-4 w-4" />
              <AlertTitle>Redirecionando para Login</AlertTitle>
              <AlertDescription>
                Você será redirecionado para a página de login em alguns segundos.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Fazer Login Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Alert variant="destructive" className="border-yellow-200 bg-yellow-50 max-w-sm shadow-lg">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Sessão Expirando</AlertTitle>
        <AlertDescription className="text-yellow-700 space-y-3">
          <p>
            Sua sessão expirará em <strong>{formatTimeLeft(timeLeft)}</strong>
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleExtendSession}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Estender
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sair
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SessionTimeoutWarning;