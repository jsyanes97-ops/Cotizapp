import { useState } from 'react';
import { Quote } from '@/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Star, MapPin, Clock, CheckCircle2, MessageSquare, DollarSign } from 'lucide-react';
import { ProviderChat } from './ProviderChat';
import { RatingSystem } from './RatingSystem';
import { PriceNegotiation } from './PriceNegotiation';

interface QuoteComparisonProps {
  quotes: Quote[];
}

export function QuoteComparison({ quotes }: QuoteComparisonProps) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [negotiatingQuoteId, setNegotiatingQuoteId] = useState<string | null>(null);
  const [quotesData, setQuotesData] = useState<Quote[]>(quotes);

  const sortedQuotes = [...quotesData].sort((a, b) => {
    // Ordenar por: mejor rating, luego por precio, luego por distancia
    if (b.providerRating !== a.providerRating) {
      return b.providerRating - a.providerRating;
    }
    if (a.price !== b.price) {
      return a.price - b.price;
    }
    return a.distance - b.distance;
  });

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
  };

  const handleStartNegotiation = (quoteId: string) => {
    setNegotiatingQuoteId(quoteId);
  };

  const handleUpdateQuote = (updatedQuote: Quote) => {
    setQuotesData(prev =>
      prev.map(q => q.id === updatedQuote.id ? updatedQuote : q)
    );
  };

  const handleAcceptNegotiatedPrice = () => {
    setNegotiatingQuoteId(null);
    // Automáticamente seleccionar la cotización
    setChatMode(true);
  };

  const handleStartChat = () => {
    setChatMode(true);
  };

  const handleCompleteService = () => {
    setChatMode(false);
    setShowRating(true);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    console.log('Rating submitted:', { rating, comment });
    // Aquí iría la lógica para guardar la calificación
  };

  const selectedQuote = quotesData.find(q => q.id === selectedQuoteId);
  const negotiatingQuote = quotesData.find(q => q.id === negotiatingQuoteId);

  // Mostrar negociación si está activa
  if (negotiatingQuoteId && negotiatingQuote) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <h3 className="font-semibold text-lg mb-1">
            Negociando con {negotiatingQuote.providerName}
          </h3>
          <p className="text-sm text-gray-600">
            Precio original: ${negotiatingQuote.originalPrice || negotiatingQuote.price} USD
          </p>
        </div>

        <PriceNegotiation
          quote={negotiatingQuote}
          userRole="client"
          onUpdateQuote={handleUpdateQuote}
          onAccept={handleAcceptNegotiatedPrice}
        />

        <Button
          variant="outline"
          onClick={() => setNegotiatingQuoteId(null)}
          className="w-full"
        >
          ← Volver a todas las cotizaciones
        </Button>
      </div>
    );
  }

  // Mostrar chat si está activo
  if (chatMode && selectedQuote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div>
            <h3 className="font-semibold text-lg">
              Chateando con {selectedQuote.providerName}
            </h3>
            <p className="text-sm text-gray-600">
              Cotización: ${selectedQuote.price} USD
            </p>
          </div>
          <Button onClick={handleCompleteService} variant="outline">
            ✅ Marcar como Completado
          </Button>
        </div>
        <ProviderChat
          conversationId={selectedQuote.id}
          providerId={selectedQuote.providerId}
          providerName={selectedQuote.providerName}
          serviceName="Servicio de Plomería"
          quotedPrice={selectedQuote.price}
          onBack={() => setChatMode(false)}
        />
      </div>
    );
  }

  // Mostrar rating si el servicio fue completado
  if (showRating && selectedQuote) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <h3 className="font-semibold text-lg mb-1">
            ✅ Servicio Completado
          </h3>
          <p className="text-sm text-gray-600">
            Servicio con {selectedQuote.providerName} • ${selectedQuote.price} USD
          </p>
        </div>
        <RatingSystem
          providerName={selectedQuote.providerName}
          onSubmit={handleRatingSubmit}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-lg mb-1">
          📊 Recibiste {quotes.length} cotización{quotes.length !== 1 ? 'es' : ''}
        </h3>
        <p className="text-sm text-gray-600">
          Compara y elige la mejor opción para ti
        </p>
      </div>

      <div className="space-y-3">
        {sortedQuotes.map((quote, index) => (
          <Card
            key={quote.id}
            className={`p-4 transition-all hover:shadow-md ${selectedQuoteId === quote.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
          >
            {/* Badge de mejor opción */}
            {index === 0 && !selectedQuoteId && (
              <Badge className="mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                ⭐ Mejor opción
              </Badge>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-lg">{quote.providerName}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{quote.providerRating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{quote.distance ? quote.distance.toFixed(1) : '0.0'} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Respondió en {quote.providerResponseTime}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ${quote.price}
                </div>
                <div className="text-xs text-gray-500">{quote.currency}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div>
                <span className="font-medium">Incluye:</span>
                <p className="text-gray-600">{quote.description}</p>
              </div>
              <div>
                <span className="font-medium">Disponibilidad:</span>
                <span className="text-gray-600 ml-1">{quote.availability}</span>
              </div>
              <div>
                <span className="font-medium">Condiciones:</span>
                <span className="text-gray-600 ml-1">{quote.conditions}</span>
              </div>
            </div>

            <Button
              className="w-full"
              variant={selectedQuoteId === quote.id ? 'default' : 'outline'}
              onClick={() => handleSelectQuote(quote.id)}
            >
              {selectedQuoteId === quote.id ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Seleccionado
                </>
              ) : (
                'Seleccionar'
              )}
            </Button>

            {/* Botón de negociación */}
            {selectedQuoteId !== quote.id && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-blue-600"
                onClick={() => handleStartNegotiation(quote.id)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Negociar precio
              </Button>
            )}
          </Card>
        ))}
      </div>

      {selectedQuoteId && (
        <div className="mt-4 space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ <strong>Cotización seleccionada.</strong> Ahora puedes chatear directamente con el proveedor para coordinar detalles.
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartChat}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Iniciar Chat con {selectedQuote?.providerName}
          </Button>
        </div>
      )}
    </div>
  );
}