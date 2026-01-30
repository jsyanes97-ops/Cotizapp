import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { MessageSquare, Users, History, ShoppingBag, Package2, LogIn, Settings } from 'lucide-react';
import { ChatContainer } from './ChatContainer';
import { ChatList } from './client/ChatList';
import { RequestHistory } from './client/RequestHistory';
import { ServiceMarketplace } from './client/ServiceMarketplace';
import { ProductMarketplace } from './client/ProductMarketplace';
import { AuthModal, RegisterData } from './AuthModal';
import { UserSettings } from './UserSettings';
import { authService } from '@/services';

export function ClientDashboard() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; phone?: string; location?: string; bio?: string } | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      // Backend returns { token, user: { id, nombre, ... } }
      // setCurrentUser needs name, email, phone, location. 
      // Ensure backend returns enough info or fetch profile.
      setCurrentUser({
        name: data.user.nombre,
        email: email,
        phone: data.user.telefono,
        location: 'Panamá' // Backend might not return location on login yet
      });
      setIsAuthenticated(true);
      setShowAuthModal(false);
      alert('¡Inicio de sesión exitoso!');
    } catch (error) {
      console.error(error);
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
        tipoUsuario: 'Cliente'
      });

      // Auto-login
      const loginData = await authService.login(userData.email, userData.password);
      setCurrentUser({
        name: loginData.user.nombre,
        email: userData.email,
        phone: loginData.user.telefono,
        location: 'Panamá'
      });
      setIsAuthenticated(true);
      setShowAuthModal(false);
      alert('¡Cuenta creada y sesión iniciada!');
    } catch (error: any) {
      console.error(error);
      alert('Error al registrar usuario: ' + (error.response?.data?.Error || error.message));
    }
  };

  const handleUpdateProfile = (profileData: any) => {
    console.log('Updating profile:', profileData);
    setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base sm:text-xl">Cotizaciones PTY</h1>
            <p className="text-xs sm:text-sm text-gray-600">Ciudad de Panamá - Modo Cliente</p>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                  <span className="sm:hidden">Salir</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6 rounded-none border-b h-auto">
          <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Solicitud</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <Package2 className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="my-chats" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <Users className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Chats</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <History className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3">
            <Settings className="w-4 h-4" />
            <span className="text-[10px] sm:text-sm">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <ChatContainer />
        </TabsContent>

        <TabsContent value="catalog" className="flex-1 mt-0 overflow-y-auto p-2 sm:p-4">
          <ServiceMarketplace />
        </TabsContent>

        <TabsContent value="products" className="flex-1 mt-0 overflow-y-auto p-2 sm:p-4">
          <ProductMarketplace />
        </TabsContent>

        <TabsContent value="my-chats" className="flex-1 mt-0 overflow-y-auto p-2 sm:p-4">
          <ChatList />
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-0 overflow-y-auto p-2 sm:p-4">
          <RequestHistory />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0 overflow-y-auto">
          {isAuthenticated && currentUser ? (
            <UserSettings
              userType="client"
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
              <Settings className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center">Inicia sesión para configurar tu perfil</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 text-center max-w-md">
                Accede a tu cuenta para personalizar tu experiencia y gestionar tus preferencias
              </p>
              <Button onClick={() => setShowAuthModal(true)} className="text-sm">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}