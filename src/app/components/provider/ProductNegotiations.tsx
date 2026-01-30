import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { ProductNegotiation, NegotiationMessage } from '@/types';
import { 
  TrendingUp, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  User
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';

export function ProductNegotiations() {
  const [negotiations, setNegotiations] = useState<ProductNegotiation[]>([
    {
      id: 'neg-1',
      productId: 'prod-1',
      productTitle: 'Control PS5 DualSense Blanco',
      clientId: 'client-1',
      clientName: 'María González',
      providerId: 'prov-1',
      providerName: 'Juan Electricista Pro',
      originalPrice: 75,
      currentOffer: 70,
      status: 'pending',
      messages: [
        {
          id: 'msg-1',
          sender: 'client',
          type: 'offer',
          amount: 70,
          message: 'Hola, me interesa el control. ¿Aceptarías $70?',
          createdAt: new Date(Date.now() - 1000 * 60 * 30)
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 'neg-2',
      productId: 'prod-3',
      productTitle: 'Multímetro Digital Profesional',
      clientId: 'client-2',
      clientName: 'Carlos Rodríguez',
      providerId: 'prov-1',
      providerName: 'Juan Electricista Pro',
      originalPrice: 25,
      currentOffer: 22,
      status: 'counter-offered',
      messages: [
        {
          id: 'msg-1',
          sender: 'client',
          type: 'offer',
          amount: 20,
          message: '¿Aceptas $20?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: 'msg-2',
          sender: 'provider',
          type: 'counter-offer',
          amount: 22,
          message: 'Hola Carlos, el precio más bajo que puedo aceptar es $22. Es un excelente multímetro.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60)
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: 'neg-3',
      productId: 'prod-1',
      productTitle: 'Control PS5 DualSense Blanco',
      clientId: 'client-3',
      clientName: 'Ana Martínez',
      providerId: 'prov-1',
      providerName: 'Juan Electricista Pro',
      originalPrice: 75,
      currentOffer: 72,
      status: 'accepted',
      messages: [
        {
          id: 'msg-1',
          sender: 'client',
          type: 'offer',
          amount: 72,
          message: 'Me interesa. ¿$72 está bien?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        {
          id: 'msg-2',
          sender: 'provider',
          type: 'acceptance',
          amount: 72,
          message: 'Perfecto Ana, acepto $72. ¡Trato hecho!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23)
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23)
    }
  ]);

  const [selectedNegotiation, setSelectedNegotiation] = useState<ProductNegotiation | null>(null);
  const [counterOffer, setCounterOffer] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const pendingNegotiations = negotiations.filter(n => n.status === 'pending' || n.status === 'counter-offered');
  const acceptedNegotiations = negotiations.filter(n => n.status === 'accepted');
  const rejectedNegotiations = negotiations.filter(n => n.status === 'rejected');

  const handleAcceptOffer = (negotiation: ProductNegotiation) => {
    const updatedNegotiation: ProductNegotiation = {
      ...negotiation,
      status: 'accepted',
      messages: [
        ...negotiation.messages,
        {
          id: `msg-${Date.now()}`,
          sender: 'provider',
          type: 'acceptance',
          amount: negotiation.currentOffer,
          message: responseMessage || `Acepto tu oferta de $${negotiation.currentOffer}. ¡Trato hecho!`,
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    };

    setNegotiations(negotiations.map(n => n.id === negotiation.id ? updatedNegotiation : n));
    alert(`✅ Oferta aceptada!\n\nProducto: ${negotiation.productTitle}\nCliente: ${negotiation.clientName}\nPrecio acordado: $${negotiation.currentOffer}`);
    setSelectedNegotiation(null);
    setResponseMessage('');
  };

  const handleRejectOffer = (negotiation: ProductNegotiation) => {
    const updatedNegotiation: ProductNegotiation = {
      ...negotiation,
      status: 'rejected',
      messages: [
        ...negotiation.messages,
        {
          id: `msg-${Date.now()}`,
          sender: 'provider',
          type: 'rejection',
          message: responseMessage || 'Lo siento, no puedo aceptar esa oferta.',
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    };

    setNegotiations(negotiations.map(n => n.id === negotiation.id ? updatedNegotiation : n));
    setSelectedNegotiation(null);
    setResponseMessage('');
  };

  const handleCounterOffer = (negotiation: ProductNegotiation) => {
    if (!counterOffer) {
      alert('Por favor ingresa una contraoferta');
      return;
    }

    const amount = parseFloat(counterOffer);
    const updatedNegotiation: ProductNegotiation = {
      ...negotiation,
      status: 'counter-offered',
      currentOffer: amount,
      messages: [
        ...negotiation.messages,
        {
          id: `msg-${Date.now()}`,
          sender: 'provider',
          type: 'counter-offer',
          amount: amount,
          message: responseMessage || `Te puedo ofrecer $${amount}`,
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    };

    setNegotiations(negotiations.map(n => n.id === negotiation.id ? updatedNegotiation : n));
    alert(`✅ Contraoferta enviada!\n\nTu contraoferta de $${amount} ha sido enviada a ${negotiation.clientName}`);
    setSelectedNegotiation(null);
    setCounterOffer('');
    setResponseMessage('');
  };

  const getStatusBadge = (status: ProductNegotiation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'counter-offered':
        return <Badge className="bg-blue-500"><TrendingUp className="w-3 h-3 mr-1" />Contraoferta Enviada</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Aceptada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Ahora';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Negociaciones de Productos
          </CardTitle>
          <p className="text-sm text-gray-600">
            Gestiona las ofertas de tus clientes
          </p>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{pendingNegotiations.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{acceptedNegotiations.length}</p>
              <p className="text-sm text-gray-600 mt-1">Aceptadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{rejectedNegotiations.length}</p>
              <p className="text-sm text-gray-600 mt-1">Rechazadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Negotiations */}
      {pendingNegotiations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Negociaciones Activas
          </h3>
          {pendingNegotiations.map((negotiation) => (
            <Card key={negotiation.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{negotiation.productTitle}</h4>
                      {getStatusBadge(negotiation.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{negotiation.clientName}</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatTimeAgo(negotiation.updatedAt)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-600">
                        {negotiation.messages[negotiation.messages.length - 1].message}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Precio Original:</span>
                        <span className="ml-2 font-semibold line-through text-gray-400">${negotiation.originalPrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Oferta Actual:</span>
                        <span className="ml-2 font-bold text-orange-600 text-lg">${negotiation.currentOffer}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Diferencia:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          -${(negotiation.originalPrice - negotiation.currentOffer).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      size="sm"
                      onClick={() => setSelectedNegotiation(negotiation)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Responder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accepted Negotiations */}
      {acceptedNegotiations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Negociaciones Aceptadas
          </h3>
          {acceptedNegotiations.map((negotiation) => (
            <Card key={negotiation.id} className="border-l-4 border-l-green-500 opacity-75">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{negotiation.productTitle}</h4>
                      {getStatusBadge(negotiation.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{negotiation.clientName}</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatTimeAgo(negotiation.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Precio Acordado:</span>
                        <span className="ml-2 font-bold text-green-600 text-lg">${negotiation.currentOffer}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {negotiations.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No tienes negociaciones</p>
            <p className="text-sm text-gray-400">
              Las ofertas de clientes aparecerán aquí
            </p>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Response Dialog */}
      <Dialog open={selectedNegotiation !== null} onOpenChange={() => {
        setSelectedNegotiation(null);
        setCounterOffer('');
        setResponseMessage('');
      }}>
        <DialogContent className="max-w-2xl">
          {selectedNegotiation && (
            <>
              <DialogHeader>
                <DialogTitle>Responder Negociación</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Product Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-1">{selectedNegotiation.productTitle}</h4>
                  <p className="text-sm text-gray-600">Cliente: {selectedNegotiation.clientName}</p>
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Precio Original</p>
                    <p className="text-lg font-bold text-gray-700">${selectedNegotiation.originalPrice}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Oferta del Cliente</p>
                    <p className="text-lg font-bold text-orange-600">${selectedNegotiation.currentOffer}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Diferencia</p>
                    <p className="text-lg font-bold text-red-600">
                      -${(selectedNegotiation.originalPrice - selectedNegotiation.currentOffer).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="font-semibold text-sm">Historial de Conversación</h4>
                  {selectedNegotiation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender === 'client' ? 'bg-blue-50 ml-0 mr-8' : 'bg-green-50 ml-8 mr-0'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {msg.sender === 'client' ? selectedNegotiation.clientName : 'Tú'}
                        </span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.amount && (
                        <p className="text-sm font-bold mt-1">Monto: ${msg.amount}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Response Options */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold">Tu Respuesta</h4>
                  
                  {/* Counter Offer Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contraoferta (opcional)</label>
                    <Input
                      type="number"
                      placeholder="Ingresa tu contraoferta"
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje</label>
                    <Textarea
                      placeholder="Escribe un mensaje para el cliente..."
                      rows={3}
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() => handleRejectOffer(selectedNegotiation)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                {counterOffer && (
                  <Button
                    variant="outline"
                    onClick={() => handleCounterOffer(selectedNegotiation)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Enviar Contraoferta
                  </Button>
                )}
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleAcceptOffer(selectedNegotiation)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aceptar Oferta
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
