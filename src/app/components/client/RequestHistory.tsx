import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ServiceRequestHistory } from '@/types';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Star,
  Calendar,
  FileText,
  TrendingUp
} from 'lucide-react';

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'plomeria': '🔧',
    'electricidad': '⚡',
    'aire-acondicionado': '❄️',
    'cerrajeria': '🔑',
    'limpieza': '🧹',
    'electrodomesticos': '🔌',
    'pintura': '🎨',
    'carpinteria': '🪚'
  };
  return icons[category] || '🛠️';
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'plomeria': 'Plomería',
    'electricidad': 'Electricidad',
    'aire-acondicionado': 'Aire Acondicionado',
    'cerrajeria': 'Cerrajería',
    'limpieza': 'Limpieza',
    'electrodomesticos': 'Electrodomésticos',
    'pintura': 'Pintura',
    'carpinteria': 'Carpintería'
  };
  return names[category] || category;
};

export function RequestHistory() {
  const [history] = useState<ServiceRequestHistory[]>([
    {
      id: 'req-1',
      category: 'plomeria',
      description: 'Fuga de agua en la cocina, debajo del lavaplatos',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      status: 'completed',
      quotesReceived: 4,
      selectedProvider: {
        name: 'Mario Plomería Rápida',
        price: 85,
        rating: 4.9
      },
      finalPrice: 85,
      clientRating: 5,
      clientReview: 'Excelente servicio, muy rápido y profesional'
    },
    {
      id: 'req-2',
      category: 'electricidad',
      description: 'Se fue la luz en mi apartamento, necesito revisión urgente',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      status: 'completed',
      quotesReceived: 5,
      selectedProvider: {
        name: 'Carlos Electricista Panamá',
        price: 120,
        rating: 4.7
      },
      finalPrice: 100, // Negociado
      clientRating: 4,
      clientReview: 'Buen trabajo, llegó a tiempo'
    },
    {
      id: 'req-3',
      category: 'aire-acondicionado',
      description: 'Aire acondicionado no enfría bien, hace ruido extraño',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
      status: 'cancelled',
      quotesReceived: 3,
      selectedProvider: {
        name: 'Carlos A/C Service',
        price: 120,
        rating: 4.7
      }
    },
    {
      id: 'req-4',
      category: 'limpieza',
      description: 'Limpieza profunda de apartamento de 2 habitaciones',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21), // 21 days ago
      status: 'completed',
      quotesReceived: 5,
      selectedProvider: {
        name: 'Limpieza Express PTY',
        price: 60,
        rating: 4.8
      },
      finalPrice: 60,
      clientRating: 5,
      clientReview: 'Dejaron todo impecable, super recomendado'
    },
    {
      id: 'req-5',
      category: 'cerrajeria',
      description: 'Cambio de cerradura de puerta principal',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      status: 'completed',
      quotesReceived: 4,
      selectedProvider: {
        name: 'Ana Cerrajería 24/7',
        price: 70,
        rating: 5.0
      },
      finalPrice: 65, // Negociado
      clientRating: 5,
      clientReview: 'Servicio rápido y confiable'
    },
    {
      id: 'req-6',
      category: 'pintura',
      description: 'Pintar sala y comedor, aproximadamente 40m²',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
      status: 'completed',
      quotesReceived: 3,
      selectedProvider: {
        name: 'Pinturas Profesionales PTY',
        price: 200,
        rating: 4.6
      },
      finalPrice: 180, // Negociado
      clientRating: 4,
      clientReview: 'Buen trabajo pero tardó un poco más de lo previsto'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const completedCount = history.filter(h => h.status === 'completed').length;
  const cancelledCount = history.filter(h => h.status === 'cancelled').length;
  const totalSpent = history
    .filter(h => h.status === 'completed' && h.finalPrice)
    .reduce((sum, h) => sum + (h.finalPrice || 0), 0);
  const averageRating = history
    .filter(h => h.clientRating)
    .reduce((sum, h, _, arr) => sum + (h.clientRating || 0) / arr.length, 0);

  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  };

  const getStatusBadge = (status: ServiceRequestHistory['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completado
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            En Progreso
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-6 h-6" />
            Mi Historial
          </CardTitle>
          <p className="text-sm text-gray-600">
            Todas tus solicitudes y servicios pasados
          </p>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{history.length}</p>
              <p className="text-sm text-gray-600 mt-1">Solicitudes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">${totalSpent}</p>
              <p className="text-sm text-gray-600 mt-1">Total Gastado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <p className="text-3xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">Tu Rating Promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todos ({history.length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Completados ({completedCount})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setFilter('cancelled')}
          size="sm"
        >
          Cancelados ({cancelledCount})
        </Button>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-4xl">{getCategoryIcon(item.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">{getCategoryName(item.category)}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {item.quotesReceived} cotizaciones
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              {item.selectedProvider && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Proveedor Seleccionado</p>
                      <p className="font-semibold">{item.selectedProvider.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{item.selectedProvider.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Precio</p>
                      <div className="flex items-center gap-2">
                        {item.finalPrice && item.finalPrice !== item.selectedProvider.price ? (
                          <>
                            <span className="text-lg font-bold text-green-600">
                              ${item.finalPrice}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ${item.selectedProvider.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${item.selectedProvider.price}
                          </span>
                        )}
                      </div>
                      {item.finalPrice && item.finalPrice !== item.selectedProvider.price && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3" />
                          Negociado
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Client Rating */}
                  {item.clientRating && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">Tu Calificación</p>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= item.clientRating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {item.clientReview && (
                        <p className="text-sm text-gray-700 italic">"{item.clientReview}"</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cancelled Info */}
              {item.status === 'cancelled' && !item.finalPrice && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Solicitud cancelada • Recibiste {item.quotesReceived} cotizaciones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No hay solicitudes en esta categoría</p>
            <p className="text-sm text-gray-400">
              Cambia el filtro para ver otras solicitudes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
