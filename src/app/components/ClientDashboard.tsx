import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { MessageSquare, Users, History, ShoppingBag, Package2, LogIn, Settings } from 'lucide-react';
import { ChatContainer } from './ChatContainer';
import { ChatList } from './client/ChatList';
import { RequestHistory } from './client/RequestHistory';
import { ServiceMarketplace } from './client/ServiceMarketplace';
import { ProductMarketplace } from './client/ProductMarketplace';
import { UserSettings } from './UserSettings';
import { authService } from '@/services';

export function ClientDashboard({ onLogout }: { onLogout?: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; phone?: string; location?: string; bio?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({
        name: user.nombre,
        email: user.email,
        phone: user.telefono,
        location: 'Panamá'
      });
      setIsAuthenticated(true);
    }
  }, []);

  const handleUpdateProfile = (profileData: any) => {
    console.log('Updating profile:', profileData);
    setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    if (onLogout) onLogout();
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
              <div className="flex items-center gap-1 sm:gap-2 px-3 py-1 bg-gray-100 rounded text-gray-400 text-xs italic">
                No autenticado
              </div>
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}