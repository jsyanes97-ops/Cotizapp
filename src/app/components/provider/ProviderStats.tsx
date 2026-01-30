import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Provider } from '@/types';
import { TrendingUp, DollarSign, Clock, Star, Target, CheckCircle } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

interface ProviderStatsProps {
  provider: Provider;
}

export function ProviderStats({ provider }: ProviderStatsProps) {
  // Mock data para estadísticas
  const stats = {
    quotesThisMonth: 45,
    acceptanceRate: 68,
    avgQuotePrice: 125,
    totalEarnings: 5625,
    responseRate: provider.responseRate,
    avgResponseTime: provider.avgResponseTime
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estadísticas y Desempeño</h2>
        <p className="text-gray-600 mt-1">Resumen de tu actividad este mes</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rating Promedio</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              {provider.rating}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Basado en {provider.totalReviews} reseñas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tasa de Respuesta</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              {stats.responseRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Tiempo promedio: {stats.avgResponseTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cotizaciones Enviadas</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              {stats.quotesThisMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tasa de Aceptación</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              {stats.acceptanceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {Math.round(stats.quotesThisMonth * stats.acceptanceRate / 100)} cotizaciones aceptadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Precio Promedio</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              ${stats.avgQuotePrice}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Por cotización
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Estimados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              ${stats.totalEarnings.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Calidad</CardTitle>
          <CardDescription>
            Estas métricas afectan tu posicionamiento en los resultados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium">Tasa de Respuesta</p>
              <p className="text-sm text-gray-600">
                Respondes el {stats.responseRate}% de las solicitudes
              </p>
            </div>
            <Badge className="bg-green-600">Excelente</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium">Tiempo de Respuesta</p>
              <p className="text-sm text-gray-600">
                Promedio de {stats.avgResponseTime}
              </p>
            </div>
            <Badge className="bg-blue-600">Muy bueno</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div>
              <p className="font-medium">Tasa de Aceptación</p>
              <p className="text-sm text-gray-600">
                {stats.acceptanceRate}% de tus cotizaciones son aceptadas
              </p>
            </div>
            <Badge className="bg-purple-600">Bueno</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Consejos */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Consejos para Mejorar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <p className="text-sm">
              <strong>Responde rápido:</strong> Proveedores que responden en menos de 5 minutos tienen 3x más probabilidad de ser seleccionados
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <p className="text-sm">
              <strong>Precios competitivos:</strong> Tu precio promedio es ${stats.avgQuotePrice}. Cotizaciones muy altas reducen tu tasa de aceptación
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <p className="text-sm">
              <strong>Detalles claros:</strong> Cotizaciones con descripciones detalladas tienen 50% más probabilidad de ser aceptadas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
