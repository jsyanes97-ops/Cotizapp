import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Quote, NegotiationMessage } from '@/types';
import { DollarSign, MessageSquare, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PriceNegotiationProps {
  quote: Quote;
  userRole: 'client' | 'provider';
  onUpdateQuote: (updatedQuote: Quote) => void;
  onAccept: () => void;
}

export function PriceNegotiation({ quote, userRole, onUpdateQuote, onAccept }: PriceNegotiationProps) {
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [showPriceInput, setShowPriceInput] = useState(false);

  const negotiationHistory = quote.negotiationHistory || [];
  const currentPrice = quote.price;
  const originalPrice = quote.originalPrice || quote.price;
  const priceChanged = currentPrice !== originalPrice;

  const handleSendProposal = () => {
    if (!proposedPrice || Number(proposedPrice) <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    const newMessage: NegotiationMessage = {
      id: Date.now().toString(),
      sender: userRole === 'client' ? 'client' : 'provider',
      type: 'price_proposal',
      price: Number(proposedPrice),
      message: message || (userRole === 'client' 
        ? `¿Puedes hacerlo por $${proposedPrice}?`
        : `Te puedo ofrecer $${proposedPrice}`),
      timestamp: new Date()
    };

    const updatedQuote: Quote = {
      ...quote,
      price: Number(proposedPrice),
      originalPrice: originalPrice,
      status: 'negotiating',
      negotiationHistory: [...negotiationHistory, newMessage]
    };

    onUpdateQuote(updatedQuote);
    setProposedPrice('');
    setMessage('');
    setShowPriceInput(false);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: NegotiationMessage = {
      id: Date.now().toString(),
      sender: userRole === 'client' ? 'client' : 'provider',
      type: 'message',
      message: message,
      timestamp: new Date()
    };

    const updatedQuote: Quote = {
      ...quote,
      status: 'negotiating',
      negotiationHistory: [...negotiationHistory, newMessage]
    };

    onUpdateQuote(updatedQuote);
    setMessage('');
  };

  const handleAcceptPrice = () => {
    const acceptMessage: NegotiationMessage = {
      id: Date.now().toString(),
      sender: userRole === 'client' ? 'client' : 'provider',
      type: 'acceptance',
      price: currentPrice,
      message: `Acepto el precio de $${currentPrice}`,
      timestamp: new Date()
    };

    const updatedQuote: Quote = {
      ...quote,
      status: 'accepted',
      negotiationHistory: [...negotiationHistory, acceptMessage]
    };

    onUpdateQuote(updatedQuote);
    onAccept();
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Negociación de Precio
          </CardTitle>
          <Badge variant={priceChanged ? 'default' : 'secondary'}>
            {priceChanged ? 'En negociación' : 'Precio inicial'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Precio Actual */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Precio Actual</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-700">${currentPrice}</span>
                <span className="text-gray-500">USD</span>
              </div>
              {priceChanged && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {currentPrice < originalPrice ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        ${originalPrice - currentPrice} menos que el precio original
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-orange-600 font-medium">
                        ${currentPrice - originalPrice} más que el precio original
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {priceChanged && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Precio original</p>
                <p className="text-xl text-gray-400 line-through">${originalPrice}</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial de Negociación */}
        {negotiationHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Historial de Negociación</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {negotiationHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg text-sm ${
                    item.sender === userRole
                      ? 'bg-blue-100 ml-8'
                      : 'bg-gray-100 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {item.sender === 'client' ? '👤 Cliente' : '🧑‍🔧 Proveedor'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {item.type === 'price_proposal' && item.price && (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-lg">${item.price}</span>
                    </div>
                  )}
                  
                  <p className="text-gray-700">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-3 pt-4 border-t">
          {!showPriceInput ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPriceInput(true)}
                className="w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Proponer Precio
              </Button>
              <Button
                onClick={handleAcceptPrice}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aceptar ${currentPrice}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {userRole === 'client' ? '¿Cuánto puedes pagar?' : '¿Cuál es tu mejor precio?'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$</span>
                  <Input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={userRole === 'client' ? "Ej: 60" : "Ej: 70"}
                    className="text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensaje (opcional)
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explica por qué propones este precio..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPriceInput(false);
                    setProposedPrice('');
                    setMessage('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendProposal}
                  disabled={!proposedPrice}
                  className="flex-1"
                >
                  Enviar Propuesta
                </Button>
              </div>
            </div>
          )}

          {/* Chat simple */}
          {!showPriceInput && (
            <div className="pt-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Envía un mensaje..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="self-end"
                >
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-900">
            💡 <strong>Tip:</strong> {userRole === 'client' 
              ? 'Negocia de forma justa. Un buen precio beneficia a ambos.'
              : 'Sé flexible pero cubre tus costos. Recuerda incluir materiales y tiempo.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
