import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle2, Zap, TrendingUp, Star, Shield } from 'lucide-react';
import { providerService } from '@/services';

interface MembershipUpgradeProps {
  providerId: string;
  isPremium: boolean;
}

export function MembershipUpgradeWithLogic({ providerId, isPremium }: MembershipUpgradeProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    if (!confirm('¿Confirmas el pago de $5.00 para la suscripción Premium?')) return;

    setLoading(true);
    try {
      await providerService.upgradeMembership(providerId, 'CreditCard');
      setSuccess(true);
      alert('¡Felicidades! Ahora eres Premium.');
      // window.location.reload(); // Removed to prevent logout feeling
    } catch (error) {
      console.error(error);
      alert('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium || success) {
    return (
      <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-800">¡Tu Membresía Premium está Activa!</h2>
        <p className="text-green-700 mb-6 max-w-md mx-auto">
          Disfrutas de solicitudes ilimitadas, prioridad en búsquedas y soporte VIP.
        </p>

        <div className="flex justify-center gap-4">
          <Badge className="bg-green-600 hover:bg-green-700 text-base px-4 py-1">Estado: Activo</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Actualiza a Premium</h2>
        <p className="text-gray-600">
          Recibe más solicitudes y destaca entre la competencia
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Plan Free */}
        <Card className="relative opacity-60">
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">Plan Actual</Badge>
            <CardTitle className="text-2xl">Gratuito</CardTitle>
            <div className="text-3xl font-bold">$0</div>
            <CardDescription>por mes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span>10 solicitudes por mes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span>Perfil básico</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span>Notificaciones estándar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4">×</span>
              <span>Sin prioridad en resultados</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4">×</span>
              <span>Sin estadísticas avanzadas</span>
            </div>
          </CardContent>
        </Card>

        {/* Plan Premium */}
        <Card className="relative border-2 border-blue-500 shadow-lg bg-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4">
              ⭐ Recomendado
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">$5</span>
              <span className="text-gray-500">USD/mes</span>
            </div>
            <CardDescription>Facturación mensual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>✨ Solicitudes ilimitadas</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Prioridad en resultados de búsqueda</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Star className="w-4 h-4 text-blue-600" />
              <span>Badge "Premium" visible</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Estadísticas y analytics avanzados</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Soporte prioritario</span>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Actualizar Ahora - $5.00'}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Simulación de pago segura
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 text-center">
            📊 Proveedores Premium reciben en promedio:
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">3.5x</div>
              <div className="text-sm text-gray-600">Más solicitudes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">68%</div>
              <div className="text-sm text-gray-600">Mayor tasa de aceptación</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">$480</div>
              <div className="text-sm text-gray-600">Ingresos extra/mes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔒 Pago seguro • Cancela cuando quieras • Sin compromisos a largo plazo</p>
      </div>
    </div>
  );
}
