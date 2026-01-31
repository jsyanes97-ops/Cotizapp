import { useState, useEffect } from 'react';
import { ClientDashboard } from './components/ClientDashboard';
import { ProviderPanel } from './components/ProviderPanel';
import { Button } from './components/ui/button';
import { UserRole } from '@/types';
import { authService } from '@/services';
import { AuthModal, RegisterData } from './components/AuthModal';

function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('userRole') as UserRole | null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && userRole) {
      setIsAuthenticated(true);
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole && isAuthenticated) {
      localStorage.setItem('userRole', userRole);
    } else if (!isAuthenticated) {
      localStorage.removeItem('userRole');
    }
  }, [userRole, isAuthenticated]);

  const handleRoleSelect = (role: UserRole) => {
    setPendingRole(role);
    setShowAuthModal(true);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      setIsAuthenticated(true);
      if (pendingRole) setUserRole(pendingRole);
      setShowAuthModal(false);
    } catch (error) {
      alert('Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  const handleRegister = async (userData: RegisterData) => {
    try {
      await authService.register({
        nombre: userData.name,
        email: userData.email,
        password: userData.password,
        telefono: userData.phone,
        tipoUsuario: pendingRole === 'proveedor' ? 'Proveedor' : 'Cliente'
      });
      await authService.login(userData.email, userData.password);
      setIsAuthenticated(true);
      if (pendingRole) setUserRole(pendingRole);
      setShowAuthModal(false);
    } catch (error: any) {
      alert('Error al registrar: ' + (error.response?.data?.Error || error.message));
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setPendingRole(null);
  };

  if (!userRole || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="text-center space-y-8 p-8">
          <div>
            <h1 className="font-bold text-4xl mb-2">Cotizaciones PTY</h1>
            <p className="text-gray-600">Ciudad de Panamá</p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="w-64 h-16 text-lg"
              onClick={() => handleRoleSelect('cliente')}
            >
              👤 Soy Cliente
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-64 h-16 text-lg"
              onClick={() => handleRoleSelect('proveedor')}
            >
              🧑‍🔧 Soy Proveedor
            </Button>
          </div>
        </div>

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {userRole === 'cliente' && (
        <ClientDashboard
          onLogout={handleLogout}
        />
      )}
      {userRole === 'proveedor' && (
        <ProviderPanel
          onLogout={handleLogout}
        />
      )}

      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md bg-white/80 backdrop-blur-sm border opacity-50 hover:opacity-100 transition-opacity"
          onClick={handleLogout}
        >
          Cambiar rol ↻
        </Button>
      </div>
    </div>
  );
}

export default App;