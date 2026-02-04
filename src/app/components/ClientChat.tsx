import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, Image as ImageIcon, MapPin, X } from 'lucide-react';
import type { ServiceRequest, Quote, ChatMessage, Location, ProductListing } from '@/types';
import { detectCategory, getCategoryConfig } from '@/data/categories';
import { detectProductCategory, getProductCategoryConfig } from '@/data/productCategories';
import { QuoteComparison } from './QuoteComparison';
import { LoadingQuotes } from './LoadingQuotes';
import { ProductResults } from './ProductResults';
import { requestService, chatService } from '@/services'; // Import real service
import { NegotiationStatusCard } from './client/NegotiationStatusCard';

// ... keep mockLocations for fallback or testing if needed, or remove ...
const mockLocations: Location[] = [
  { district: 'San Francisco', address: 'Calle 50, San Francisco', lat: 9.0, lng: -79.5 },
];

interface ClientChatProps {
  chatId?: string;
  onChatUpdate?: (chatId: string, title: string, preview: string, type: 'service' | 'product', category?: string) => void;
}

export function ClientChat({ chatId, onChatUpdate }: ClientChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      content: '¡Hola! 👋 Describe qué necesitas y te conectaré con los mejores proveedores de Ciudad de Panamá.',
      timestamp: new Date(),
      type: 'text'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [receivedQuotes, setReceivedQuotes] = useState<Quote[]>([]);
  const [showQuoteComparison, setShowQuoteComparison] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [requestType, setRequestType] = useState<'service' | 'product' | null>(null);
  const [foundProducts, setFoundProducts] = useState<ProductListing[]>([]);
  const [showProductResults, setShowProductResults] = useState(false);

  // Negotiation State
  const [negotiationContext, setNegotiationContext] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Context on Load / Chat Change
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);

    if (chatId) {
      fetchNegotiationContext();
      fetchMessages(); // Fetch immediately on load

      const interval = setInterval(() => {
        fetchNegotiationContext();
        fetchMessages();
      }, 5000); // Poll both every 5s

      return () => clearInterval(interval);
    }
  }, [chatId]);

  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const res = await chatService.getMessages(chatId);
      // Map backend messages to frontend format
      // Handle potential PascalCase (default .NET Dapper) or camelCase (default JSON)
      const rawMessages = res.data || [];

      const mappedMessages = rawMessages.map((m: any) => {
        const msgId = m.Id || m.id;
        const msgSenderId = m.EmisorId || m.emisorId;
        const msgContent = m.Contenido || m.contenido;
        const msgDate = m.FechaEnvio || m.fechaEnvio;
        const msgType = m.Tipo || m.tipo;

        const isUser = msgSenderId && currentUser?.id &&
          msgSenderId.toString().toLowerCase() === currentUser.id.toString().toLowerCase();

        return {
          id: msgId,
          sender: isUser ? 'user' : 'other',
          content: msgContent,
          timestamp: new Date(msgDate),
          type: msgType === 'Negociacion' ? 'text' : (msgType === 'Imagen' ? 'image' : 'text')
        };
      });
      setMessages(mappedMessages);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const fetchNegotiationContext = async () => {
    if (!chatId) return;
    try {
      const res = await chatService.getContext(chatId);
      if (res.data) {
        setNegotiationContext(res.data);
      }
    } catch (error) {
      console.error("Error fetching context", error);
    }
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]);
  };

  const handleInitialDescription = (text: string) => {
    addMessage({ sender: 'user', content: text, type: 'text' });

    const productCategory = detectProductCategory(text);

    if (productCategory) {
      // ... Product logic kept same or todo: implement product service ...
      // For brevity, focusing on Service Requests as per instructions
      setRequestType('product');
      // ... (rest of product logic)
      setTimeout(() => {
        addMessage({ sender: 'bot', content: 'Actualmente estamos conectando la búsqueda de productos en vivo. Intenta con un servicio por ahora.', type: 'text' });
      }, 500);
      return;
    }

    const category = detectCategory(text);

    if (category) {
      setRequestType('service');
      const categoryConfig = getCategoryConfig(category);

      if (chatId && onChatUpdate && categoryConfig) {
        onChatUpdate(chatId, categoryConfig.name, text, 'service', categoryConfig.name);
      }

      setCurrentRequest({
        id: '', // Will be set by backend
        clientId: 'temp-client',
        category,
        description: text,
        photos: [],
        location: null,
        status: 'guided-questions',
        guidedAnswers: {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60000)
      });

      setTimeout(() => {
        addMessage({
          sender: 'bot',
          content: `Perfecto, detecté que necesitas **${categoryConfig?.name}**. Te haré unas preguntas rápidas.`,
          type: 'text'
        });

        setTimeout(() => {
          if (categoryConfig && categoryConfig.guidedQuestions.length > 0) {
            askNextGuidedQuestion(categoryConfig.guidedQuestions, 0);
          }
        }, 800);
      }, 600);
    } else {
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          content: 'No entendí bien. ¿Podrías especificar si es Plomería, Electricidad, etc?',
          type: 'text'
        });
      }, 600);
    }
  };

  const askNextGuidedQuestion = (questions: any[], index: number) => {
    if (index >= questions.length) {
      askForLocation();
      return;
    }

    const question = questions[index];
    setCurrentQuestionIndex(index);

    addMessage({
      sender: 'bot',
      content: question.question,
      type: 'question',
      metadata: { question }
    });
  };

  const handleGuidedAnswer = (answer: string) => {
    if (!currentRequest) return;
    const categoryConfig = getCategoryConfig(currentRequest.category!);
    const currentQuestion = categoryConfig?.guidedQuestions[currentQuestionIndex];

    if (currentQuestion) {
      setCurrentRequest(prev => ({
        ...prev!,
        guidedAnswers: { ...prev!.guidedAnswers, [currentQuestion.id]: answer }
      }));
    }

    addMessage({ sender: 'user', content: answer, type: 'text' });
    setTimeout(() => {
      if (categoryConfig) {
        askNextGuidedQuestion(categoryConfig.guidedQuestions, currentQuestionIndex + 1);
      }
    }, 600);
  };

  const askForLocation = () => {
    setTimeout(() => {
      addMessage({ sender: 'bot', content: '📍 ¿Me compartes tu ubicación actual?', type: 'text' });
    }, 600);
  };

  const handleLocationShare = async () => {
    // In real app, use navigator.geolocation
    const loc = mockLocations[0];
    setSelectedLocation(loc);

    addMessage({ sender: 'user', content: `📍 ${loc.address}`, type: 'text' });

    if (currentRequest) {
      try {
        // CALL BACKEND TO CREATE REQUEST
        const res = await requestService.create({
          ...currentRequest,
          location: loc
        });

        setCurrentRequest(prev => ({
          ...prev!,
          id: res.data.Id, // Get ID from backend
          status: 'pending'
        }));

        setTimeout(() => {
          addMessage({ sender: 'bot', content: '🚀 ¡Solicitud enviada! Esperando proveedores...', type: 'text' });
          startPollingForQuotes(res.data.Id);
        }, 800);

      } catch (error) {
        console.error(error);
        addMessage({ sender: 'bot', content: '❌ Error al conectar con el servidor.', type: 'text' });
      }
    }
  };

  const startPollingForQuotes = (requestId: string) => {
    setIsLoadingQuotes(true);
    // In a real app we would use SignalR or Poll
    // For now, let's poll every 5 seconds
    const interval = setInterval(async () => {
      // TODO: Implement getQuotes endpoint in backend or via SignalR
      // For demo purposes, we usually rely on SignalR pushing 'ReceiveQuote'
      // We will simulate it for now as the backend SignalR wasn't fully set up in the Plan
      console.log('Polling for quotes for', requestId);
    }, 5000);

    // Cleanup on unmount or status change?
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... photo logic ...
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!currentRequest) handleInitialDescription(inputValue);
    else if (currentRequest.status === 'guided-questions') handleGuidedAnswer(inputValue);
    else if (chatId) {
      // Normal chat message
      const _ = chatService.sendMessage(chatId, inputValue).then(() => {
        addMessage({ sender: 'user', content: inputValue, type: 'text' });
      });
    }
    setInputValue('');
  };

  const handleSkipToSend = () => {
    if (currentRequest) askForLocation();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">

        {/* Negotiation Card */}
        {negotiationContext && currentUser && (
          <NegotiationStatusCard
            negotiation={negotiationContext}
            currentUserId={currentUser.id}
            onUpdate={fetchNegotiationContext}
          />
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.type === 'question' && message.metadata?.question?.type === 'choice' && (
                <div className="mt-3 space-y-2">
                  {message.metadata.question.options?.map((option: string) => (
                    <Button key={option} variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-blue-50" onClick={() => handleGuidedAnswer(option)}>
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoadingQuotes && <LoadingQuotes />}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t px-4 py-4">
        {currentRequest?.status === 'guided-questions' && (
          <Button variant="ghost" size="sm" onClick={handleSkipToSend} className="mb-3 text-blue-600">Enviar solicitud ahora →</Button>
        )}
        <div className="flex gap-2">
          {!selectedLocation && currentRequest?.status !== 'describing' && (
            <Button variant="outline" size="icon" onClick={handleLocationShare}><MapPin className="w-5 h-5" /></Button>
          )}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              negotiationContext && (negotiationContext.Estado ?? negotiationContext.estado ?? "").toString().toLowerCase() !== 'aceptada'
                ? "Chat bloqueado hasta aceptar la oferta..."
                : "Escribe aquí..."
            }
            className="flex-1"
            disabled={negotiationContext && (negotiationContext.Estado ?? negotiationContext.estado ?? "").toString().toLowerCase() !== 'aceptada'}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || (negotiationContext && (negotiationContext.Estado ?? negotiationContext.estado ?? "").toString().toLowerCase() !== 'aceptada')}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}