import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { ServiceRequest, Provider } from '@/types';
import { MapPin, Clock, AlertCircle, Send, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';

interface IncomingRequestsProps {
  provider: Provider;
}

// Mock de solicitudes entrantes
const mockRequests: ServiceRequest[] = [
  {
    id: 'req-1',
    clientId: 'client-1',
    category: 'plomeria',
    description: 'Tengo una fuga de agua en el lavaplatos de la cocina',
    photos: [],
    location: {
      lat: 9.0336,
      lng: -79.5339,
      address: 'Calle 50, Obarrio',
      district: 'Obarrio'
    },
    status: 'pending',
    guidedAnswers: {
      'plumbing-type': 'Fuga de agua',
      'plumbing-urgency': 'Sí, es urgente'
    },
    createdAt: new Date(Date.now() - 3 * 60000), // Hace 3 minutos
    expiresAt: new Date(Date.now() + 7 * 60000) // Expira en 7 minutos
  },
  {
    id: 'req-2',
    clientId: 'client-2',
    category: 'plomeria',
    description: 'Necesito instalar un nuevo lavamanos en el baño',
    photos: [],
    location: {
      lat: 9.0280,
      lng: -79.5370,
      address: 'El Cangrejo',
      district: 'El Cangrejo'
    },
    status: 'pending',
    guidedAnswers: {
      'plumbing-type': 'Instalación nueva',
      'plumbing-urgency': 'No es urgente'
    },
    createdAt: new Date(Date.now() - 5 * 60000),
    expiresAt: new Date(Date.now() + 5 * 60000)
  }
];

export function IncomingRequests({ provider }: IncomingRequestsProps) {
  const [requests] = useState<ServiceRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [allowNegotiation, setAllowNegotiation] = useState(true);
  const [quoteData, setQuoteData] = useState({
    price: '',
    description: '',
    availability: '',
    conditions: 'Pago contra entrega del servicio'
  });

  const handleSendQuote = () => {
    if (!quoteData.price || !quoteData.description || !quoteData.availability) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Simular envío de cotización
    const negotiationText = allowNegotiation
      ? ' El cliente podrá negociar el precio contigo.'
      : ' Este precio es firme y no negociable.';

    alert(`✅ Cotización enviada: $${quoteData.price}\n\nEl cliente recibirá tu propuesta junto con otras cotizaciones.${negotiationText}`);
    setShowQuoteDialog(false);
    setQuoteData({
      price: '',
      description: '',
      availability: '',
      conditions: 'Pago contra entrega del servicio'
    });
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const diff = expiresAt.getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes} min` : 'Expirado';
  };

  const isExpired = (expiresAt: Date) => {
    return expiresAt.getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Solicitudes Entrantes</h2>
          <p className="text-gray-600 mt-1">
            Responde en los próximos 10 minutos para no perder la oportunidad
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {requests.filter(r => !isExpired(r.expiresAt)).length} activas
        </Badge>
      </div>

      {/* Alert sobre límite de solicitudes */}
      {!provider.isPremium && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Plan Gratuito: {provider.requestsThisMonth}/{provider.freeRequestsLimit} solicitudes este mes
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Actualiza a Premium por $5/mes para recibir solicitudes ilimitadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de solicitudes */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay solicitudes nuevas en este momento</p>
              <p className="text-sm mt-1">Te notificaremos cuando llegue una nueva solicitud</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const expired = isExpired(request.expiresAt);

            return (
              <Card
                key={request.id}
                className={`${expired ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Nueva Solicitud de {request.category}</CardTitle>
                        {request.guidedAnswers['plumbing-urgency'] === 'Sí, es urgente' && (
                          <Badge variant="destructive">🚨 Urgente</Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {request.location?.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Hace {Math.floor((Date.now() - request.createdAt.getTime()) / 60000)} min
                        </span>
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={expired ? 'secondary' : 'default'}
                        className={expired ? '' : 'bg-orange-500'}
                      >
                        {expired ? '⏰ Expirado' : `⏱️ ${getTimeRemaining(request.expiresAt)}`}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Descripción del cliente:</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      "{request.description}"
                    </p>
                  </div>

                  {Object.keys(request.guidedAnswers).length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Detalles adicionales:</p>
                      <div className="space-y-1 bg-gray-50 p-3 rounded-lg">
                        {Object.entries(request.guidedAnswers).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-gray-600">
                              {key.includes('type') ? 'Tipo:' :
                                key.includes('urgency') ? 'Urgencia:' :
                                  key.includes('brand') ? 'Marca:' : 'Info:'}
                            </span>
                            <span className="ml-2 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.photos.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Fotos:</p>
                      <div className="flex gap-2">
                        {request.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={expired}
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowQuoteDialog(true);
                      }}
                    >
                      {expired ? '❌ Tiempo expirado' : '📝 Enviar Cotización'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog de cotización */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Cotización</DialogTitle>
            <DialogDescription>
              Completa todos los campos. {allowNegotiation
                ? 'El cliente podrá negociar el precio contigo.'
                : 'El precio será firme y no negociable.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="price">Precio (USD) *</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">$</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="150"
                  value={quoteData.price}
                  onChange={(e) => setQuoteData({ ...quoteData, price: e.target.value })}
                  className="text-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Permitir negociación de precio</p>
                <p className="text-xs text-gray-600">El cliente podrá proponerte un precio diferente</p>
              </div>
              <Switch
                checked={allowNegotiation}
                onCheckedChange={setAllowNegotiation}
              />
            </div>

            <div>
              <Label htmlFor="description">¿Qué incluye? *</Label>
              <Textarea
                id="description"
                placeholder="Ej: Reparación de fuga + materiales + garantía de 30 días"
                value={quoteData.description}
                onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="availability">Disponibilidad *</Label>
              <Input
                id="availability"
                placeholder="Ej: Hoy en la tarde, Mañana 9am"
                value={quoteData.availability}
                onChange={(e) => setQuoteData({ ...quoteData, availability: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="conditions">Condiciones de pago</Label>
              <Input
                id="conditions"
                value={quoteData.conditions}
                onChange={(e) => setQuoteData({ ...quoteData, conditions: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-yellow-900">⚠️ Importante:</p>
            <ul className="mt-1 space-y-1 text-yellow-800 list-disc list-inside">
              <li>{allowNegotiation
                ? 'El cliente podrá negociar, pero puedes rechazar ofertas muy bajas'
                : 'El precio es firme, pero podrías recibir menos respuestas'}</li>
              <li>Tienes {selectedRequest && getTimeRemaining(selectedRequest.expiresAt)} para enviar</li>
              <li>El cliente recibirá máximo 5 cotizaciones</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSendQuote} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Enviar Cotización
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}