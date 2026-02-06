import { useState, useEffect } from 'react';
import { Provider, Location } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Bell, Settings, MessageSquare, Star, TrendingUp, DollarSign, Package, Package2, LogIn } from 'lucide-react';
import { IncomingRequests } from './provider/IncomingRequests';
import { ProviderProfile } from './provider/ProviderProfile';
import { ProviderStats } from './provider/ProviderStats';
import { ServiceCatalog } from './provider/ServiceCatalog';
import { ProductInventory } from './provider/ProductInventory';
import { ProviderNegotiations } from './provider/ProviderNegotiations';
import { ProviderEscrow } from './provider/ProviderEscrow';
import { AuthModal, RegisterData } from './AuthModal';
import { MembershipUpgradeWithLogic as MembershipUpgrade } from './provider/MembershipUpgrade';
import { UserSettings } from './UserSettings';
import { ChatList } from './chat/ChatList';
import { mockProviders } from '@/data/mockData';
import { authService, providerProfileService } from '@/services';

export function ProviderPanel({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [hasNewRequests, setHasNewRequests] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; phone?: string; location?: Location | string; bio?: string; isPremium?: boolean; membershipStatus?: 'free' | 'paid' } | null>(null);

  // Use authenticated user if available, otherwise mock
  const currentProvider: Provider = isAuthenticated && currentUser ? {
    ...mockProviders[0],
    ...currentUser,
    id: currentUser.id || mockProviders[0].id,
    isPremium: currentUser.isPremium ?? mockProviders[0].isPremium,
    membershipStatus: currentUser.membershipStatus || (currentUser.isPremium ? 'paid' : 'free'),
    location: (typeof currentUser.location === 'object' && currentUser.location !== null)
      ? currentUser.location
      : mockProviders[0].location
  } as Provider : mockProviders[0];

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        setIsAuthenticated(true);
        const user = JSON.parse(userStr);

        // Fetch full profile to get latest Premium status
        try {
          const profile = await providerProfileService.getProfile();
          // Map backend 'esPremium' to frontend 'isPremium'
          setCurrentUser({
            id: user.id,
            name: user.nombre, // basic auth info
            email: user.email,
            phone: user.telefono,
            ...profile.data,
            isPremium: !!profile.data.esPremium, // Explicit boolean conversion
            membershipStatus: !!profile.data.esPremium ? 'paid' : 'free',
            location: profile.data.location || mockProviders[0].location
          });
        } catch (err) {
          console.error("Error fetching available profile", err);
          setCurrentUser({
            id: user.id,
            name: user.nombre,
            email: user.email,
            phone: user.telefono,
            isPremium: false,
            membershipStatus: 'free',
            location: mockProviders[0].location
          });
        }
      }
    };
    checkAuth();
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-xl font-semibold">Panel de Proveedor</h1>
            <p className="text-xs sm:text-sm text-gray-600">{currentProvider.name}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              {hasNewRequests && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{currentProvider.rating}</span>
            </div>

            <Badge
              variant={currentProvider.isPremium ? 'default' : 'secondary'}
              className={`text-xs ${currentProvider.isPremium ? 'bg-green-600' : ''}`}
            >
              {currentProvider.isPremium ? 'Premium' : 'Free'}
            </Badge>

            {/* Auth Buttons */}
            {isAuthenticated && currentUser ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded text-gray-400 text-xs italic">
                No autenticado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Alert */}
      {currentProvider.membershipStatus === 'free' && currentProvider.requestsThisMonth >= currentProvider.freeRequestsLimit - 2 && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 text-xs sm:text-sm">
                ⚠️ Has usado {currentProvider.requestsThisMonth}/{currentProvider.freeRequestsLimit} solicitudes gratis este mes
              </span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs w-full sm:w-auto">
              Actualizar a Premium - $5/mes
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b px-2 sm:px-6 overflow-x-auto">
            <TabsList className="grid w-full min-w-[720px] grid-cols-8 h-auto">
              <TabsTrigger value="solicitudes" className="relative py-2 sm:py-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Solicitudes</span>
                <span className="sm:hidden">Solicit.</span>
                {hasNewRequests && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </TabsTrigger>
              <TabsTrigger value="servicios" className="py-2 sm:py-3 text-xs sm:text-sm">
                <Package className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Servicios</span>
              </TabsTrigger>
              <TabsTrigger value="productos" className="py-2 sm:py-3 text-xs sm:text-sm">
                <Package2 className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Productos</span>
              </TabsTrigger>
              {/* 
              <TabsTrigger value="negociaciones" className="py-2 sm:py-3 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Negoc.</span>
              </TabsTrigger> 
              */}
              <TabsTrigger value="ventas" className="py-2 sm:py-3 text-xs sm:text-sm">
                <DollarSign className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Ventas</span>
              </TabsTrigger>
              <TabsTrigger value="estadisticas" className="py-2 sm:py-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Estadísticas</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="perfil" className="py-2 sm:py-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Mi Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="mensajes" className="py-2 sm:py-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Mensajes</span>
                <span className="sm:hidden">Msgs</span>
              </TabsTrigger>
              <TabsTrigger value="ajustes" className="py-2 sm:py-3 text-xs sm:text-sm">
                <Settings className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Ajustes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <TabsContent value="solicitudes" className="mt-0">
              <IncomingRequests provider={currentProvider} />
            </TabsContent>

            <TabsContent value="servicios" className="mt-0">
              <ServiceCatalog />
            </TabsContent>

            <TabsContent value="productos" className="mt-0">
              <ProductInventory />
            </TabsContent>

            {/* 
            <TabsContent value="negociaciones" className="mt-0">
              <ProviderNegotiations />
            </TabsContent> 
            */}

            <TabsContent value="ventas" className="mt-0">
              <ProviderEscrow />
            </TabsContent>

            <TabsContent value="estadisticas" className="mt-0">
              <ProviderStats provider={currentProvider} />
            </TabsContent>

            <TabsContent value="perfil" className="mt-0">
              <ProviderProfile provider={currentProvider} />
            </TabsContent>

            <TabsContent value="mensajes" className="mt-0">
              <Card>
                <CardContent className="p-0 sm:p-6">
                  <ChatList userRole="proveedor" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ajustes" className="mt-0">
              {isAuthenticated && currentUser ? (
                <UserSettings
                  userType="provider"
                  currentUser={{
                    ...currentUser,
                    location: typeof currentUser?.location === 'string' ? currentUser.location : currentUser?.location?.address || ''
                  }}
                  onUpdateProfile={handleUpdateProfile}
                  providerId={currentProvider.id}
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}