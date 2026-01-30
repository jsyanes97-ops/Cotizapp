import { useState } from 'react';
import { ClientDashboard } from './components/ClientDashboard';
import { ProviderPanel } from './components/ProviderPanel';
import { Button } from './components/ui/button';
import { UserRole } from '@/types';

function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  if (!userRole) {
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
              onClick={() => setUserRole('cliente')}
            >
              👤 Soy Cliente
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-64 h-16 text-lg"
              onClick={() => setUserRole('proveedor')}
            >
              🧑‍🔧 Soy Proveedor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-50"
        onClick={() => setUserRole(null)}
      >
        Cambiar rol ↻
      </Button>

      {userRole === 'cliente' && <ClientDashboard />}
      {userRole === 'proveedor' && <ProviderPanel />}
    </div>
  );
}

export default App;