import { useState, useRef, useEffect } from 'react';
import { Send, TrendingUp, CheckCircle2, XCircle, DollarSign, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { chatService, clientNegotiationService } from '@/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';

interface ProviderChatProps {
  conversationId: string;
  providerName: string;
  serviceName: string;
  quotedPrice: number;
  negotiationId?: string;
  negotiationCounter?: number;
  type?: string;
  status?: string;
  userRole?: 'cliente' | 'proveedor';
  onBack: () => void;
  onComplete?: () => void;
}

export function ProviderChat({ conversationId, providerName, serviceName, quotedPrice, negotiationId, negotiationCounter, type, status, userRole, onBack, onComplete }: ProviderChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Negotiation Action State
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'Aceptar' | 'Rechazar' | 'Contraoferta' | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Local status state to override prop when client accepts
  const [localStatus, setLocalStatus] = useState<string | undefined>(undefined);

  // Get current user and role to check permissions
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storedRole = localStorage.getItem('userRole') || '';
  const detectedRole = (userRole || storedRole || user.role || user.Role || 'cliente').toLowerCase();
  const isProvider = detectedRole === 'proveedor' || detectedRole === 'provider';

  const fetchMessages = async () => {
    try {
      const res = await chatService.getMessages(conversationId);
      // Map basic fields
      const mapped = res.data.map((m: any) => ({
        id: m.Id || m.id,
        sender: (m.EmisorId && user.id &&
          m.EmisorId.toString().toLowerCase() === user.id.toString().toLowerCase())
          ? 'user' : 'other',
        content: m.Contenido,
        timestamp: new Date(m.FechaEnvio || m.timestamp),
        type: m.Tipo || 'Texto'
      }));
      setMessages(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Mark messages as read when opening the conversation
    const markRead = async () => {
      try {
        await chatService.markAsRead(conversationId);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    };

    markRead();
    fetchMessages();

    // Set up intervals
    const msgInterval = setInterval(fetchMessages, 3000);
    const readInterval = setInterval(markRead, 5000); // Periodically mark as read while open

    return () => {
      clearInterval(msgInterval);
      clearInterval(readInterval);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || chatDisabled) return;
    try {
      await chatService.sendMessage(conversationId, inputValue);
      setInputValue('');
      fetchMessages();
    } catch (e) {
      console.error(e);
      alert('Error enviando mensaje');
    }
  };

  // Local state to hide buttons immediately after acting
  const [localActionTaken, setLocalActionTaken] = useState(false);

  // Check if we should show actions or block chat
  const getNegotiationState = () => {
    if (!negotiationId || !type) return { isPending: false, isRejected: false, isAccepted: false };

    const negRelatedMessages = messages.filter(m =>
      m.tipo === 'Negociacion' || m.tipo === 'Sistema' || m.tipo === 'Cotizacion' ||
      m.type === 'Negociacion' || m.type === 'Sistema' || m.type === 'Cotizacion'
    );
    if (negRelatedMessages.length === 0) return { isPending: false, isRejected: false, isAccepted: false };

    const lastEvent = negRelatedMessages[negRelatedMessages.length - 1];
    const content = (lastEvent.contenido || lastEvent.content || "").toLowerCase();
    const t = lastEvent.tipo || lastEvent.type || "";

    // In ProviderChat, sender is mapped to 'user' (current user) or 'other'
    const lastSender = lastEvent.sender || "";
    const isOtherSender = lastSender === 'other';

    // If the last event is a new Quote, then it's NOT rejected anymore
    const isRejected = t === 'Sistema' && content.includes('rechazado');
    const isAccepted = t === 'Sistema' && (content.includes('aceptado') || content.includes('aceptada'));

    // It's pending if the last message was a counteroffer/quote FROM THE OTHER PERSON
    // AND it hasn't been finalized yet.
    const isPending = !localActionTaken && (t === 'Negociacion' || t === 'Cotizacion') &&
      isOtherSender &&
      (content.includes('contraoferta') || content.includes('cotización'));

    return { isPending, isRejected, isAccepted };
  };

  const { isPending: isNegotiationPending, isRejected: isNegotiationRejected, isAccepted: isNegotiationAccepted } = getNegotiationState();

  // Reset localActionTaken when we get confirmation from server that it's the other person's turn
  // OR if the negotiation is accepted/rejected
  if (localActionTaken) {
    const negRelatedMessages = messages.filter(m =>
      m.tipo === 'Negociacion' || m.tipo === 'Sistema' || m.tipo === 'Cotizacion' ||
      m.type === 'Negociacion' || m.type === 'Sistema' || m.type === 'Cotizacion'
    );
    if (negRelatedMessages.length > 0) {
      const lastEvent = negRelatedMessages[negRelatedMessages.length - 1];
      const lastSender = lastEvent.sender || "";
      if (lastSender === 'user' || isNegotiationAccepted || isNegotiationRejected) {
        setLocalActionTaken(false);
      }
    }
  }

  // BLOCKING LOGIC:
  // 1. If negotiation is rejected -> Blocked for everyone
  // 2. If there's an active negotiation AND status is NOT 'Aceptada' -> Blocked for BOTH client and provider
  // 3. If no negotiation (direct purchase) OR negotiation is accepted -> Unlocked for both
  // Use localStatus if available (updated when client accepts), otherwise use prop status
  const currentStatus = localStatus || status || '';
  const statusLower = currentStatus.toLowerCase();
  const isAceptada = statusLower === 'aceptada' || statusLower === 'completada' || statusLower === 'finalizada' || isNegotiationAccepted;
  const isNegotiationActive = !!negotiationId;

  // Block chat for BOTH roles if there's an active negotiation that hasn't been accepted
  // We check the literal status from backend first for 'Rechazada' persistence
  const isRejectedState = statusLower === 'rechazada' || isNegotiationRejected;
  const chatDisabled = isRejectedState || (isNegotiationActive && !isAceptada);

  // Use the backend provided counter instead of manual counting in fractional message history
  const negotiationCount = negotiationCounter ?? 0;
  const limitReached = negotiationCount >= 3;

  const handleActionClick = (action: 'Aceptar' | 'Rechazar' | 'Contraoferta') => {
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!negotiationId || !type || !actionType) return;

    if (actionType === 'Contraoferta') {
      if (!counterOfferAmount || isNaN(parseFloat(counterOfferAmount)) || parseFloat(counterOfferAmount) <= 0) {
        alert('Por favor ingresa un monto válido para la contraoferta.');
        return;
      }
    }

    try {
      setLocalActionTaken(true); // Hide buttons IMMEDIATELY
      const response = await clientNegotiationService.respond({
        negotiationId,
        clientId: "", // Service handles this
        type,
        action: actionType,
        counterOfferAmount: actionType === 'Contraoferta' ? parseFloat(counterOfferAmount) : undefined,
        message: actionMessage
      });

      const { Status, Message } = response.data;

      if (Status === 'ERROR') {
        alert(Message || 'Error al procesar la acción');
        return;
      }

      // Action successful
      if (Message) alert(Message);

      setIsActionDialogOpen(false);
      setActionType(null);
      setCounterOfferAmount('');
      setActionMessage('');

      // Handle different actions
      if (actionType === 'Aceptar') {
        // Update local status to unlock chat immediately without leaving
        setLocalStatus('Aceptada');
        fetchMessages(); // Refresh to show acceptance message
      } else if (actionType === 'Rechazar') {
        // Go back to chat list when rejecting
        if (onBack) {
          onBack();
        }
      } else {
        // For counteroffers, just refresh messages
        fetchMessages();
      }

    } catch (error: any) {
      setLocalActionTaken(false); // Restore on error
      alert('Error: ' + (error.response?.data?.Error || error.message));
    }
  };

  const renderMessageContent = (msg: any) => {
    if (msg.type === 'Negociacion') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold border-b border-indigo-200 pb-1 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Actualización de Oferta</span>
          </div>
          <p>{msg.content}</p>
        </div>
      );
    }
    if (msg.type === 'Sistema') {
      return (
        <div className="flex items-center gap-2 italic text-gray-600">
          {msg.content.includes('aceptado') ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span>{msg.content}</span>
        </div>
      );
    }
    return msg.content;
  };

  return (
    <Card className="flex flex-col h-[600px] border-none shadow-none sm:border sm:shadow-sm relative">
      {/* Header logic ... */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h3 className="font-semibold text-lg">{providerName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{serviceName}</span>
            <Badge variant="secondary" className="font-normal">
              ${quotedPrice}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" onClick={onBack} size="sm" className="sm:hidden">
          Cerrar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 pb-32">
        {loading && <p className="text-center text-gray-400">Cargando mensajes...</p>}
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${message.type === 'Negociacion'
                ? 'bg-indigo-50 border border-indigo-100 text-indigo-900'
                : message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
                }`}
            >
              {renderMessageContent(message)}
              <p className={`text-[10px] mt-1 text-right ${message.sender === 'user' && message.type !== 'Negociacion' ? 'text-blue-100' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Negotiation Actions Overlay (Only for Client) */}
      {isNegotiationPending && !isProvider && (
        <div className="absolute bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <Card className="bg-indigo-50 border-indigo-200 shadow-lg p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-2 mb-3 text-indigo-800 font-medium text-sm">
              <TrendingUp className="w-5 h-5" />
              El proveedor ha enviado una contraoferta. Responde para continuar el chat.
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleActionClick('Aceptar')}>
                Aceptar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleActionClick('Contraoferta')}
                disabled={limitReached}
              >
                {limitReached ? 'Límite Alcanzado' : 'Contraofertar'}
              </Button>
              <Button className="flex-1 bg-red-100 hover:bg-red-200 text-red-700" variant="ghost" onClick={() => handleActionClick('Rechazar')}>
                Rechazar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t px-4 py-4 z-20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !chatDisabled && handleSend()}
            placeholder={
              isNegotiationRejected
                ? "Chat cerrado (oferta rechazada)"
                : isProvider && isNegotiationActive && !isAceptada
                  ? (isNegotiationPending
                    ? "Responde a la oferta en 'Negociaciones' para chatear..."
                    : "Esperando a que el cliente acepte la oferta para chatear...")
                  : isNegotiationPending
                    ? "Resuelve la oferta para chatear..."
                    : "Escribe un mensaje..."
            }
            className="flex-1"
            disabled={chatDisabled}
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || chatDisabled} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'Aceptar' && 'Confirmar Aceptación'}
              {actionType === 'Rechazar' && 'Confirmar Rechazo'}
              {actionType === 'Contraoferta' && 'Enviar Contraoferta'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'Aceptar' && 'Estás a punto de aceptar la oferta del proveedor. ¿Confirmas?'}
              {actionType === 'Rechazar' && 'Estás a punto de rechazar la oferta. Esto podría finalizar la negociación. ¿Confirmas?'}
              {actionType === 'Contraoferta' && 'Ingresa tu nueva oferta. Recuerda que tienes un límite de 10 contraofertas.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'Contraoferta' && (
              <div className="space-y-2">
                <Label>Monto de tu oferta ($)</Label>
                <Input
                  type="number"
                  value={counterOfferAmount}
                  onChange={(e) => setCounterOfferAmount(e.target.value)}
                  // startIcon={<DollarSign className="w-4 h-4" />} // Removing unsupported prop
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Mensaje (Opcional)</Label>
              <Input
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Añade un comentario..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={submitAction}
              className={actionType === 'Rechazar' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
}
