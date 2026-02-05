import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@/app/components/ui/separator';
import { Send, Upload, X, ArrowLeft, MoreHorizontal, Bot, User, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestService } from '@/services';

interface RequestCreationChatProps {
    onBack: () => void;
    onSuccess: () => void;
}

type MessageSender = 'bot' | 'user';

interface Message {
    id: string;
    sender: MessageSender;
    text: string;
    type?: 'text' | 'options' | 'upload' | 'summary';
    options?: string[];
    image?: string;
    timestamp: Date;
}

type ChatStep = 'GREETING' | 'DESCRIPTION' | 'CATEGORY' | 'TITLE' | 'PRIORITY' | 'PHOTOS' | 'CONFIRMATION' | 'SUBMITTING';

const CATEGORIES = [
    "Plomería", "Electricidad", "Limpieza", "Jardinería", "Construcción",
    "Pintura", "Carpintería", "Cerrajería", "Mudanza", "Tecnología",
    "Mecánica", "Belleza", "Educación", "Eventos", "Otros"
];

const PRIORITIES = [
    { value: 'Normal', label: 'Normal (Días)' },
    { value: 'Alta', label: 'Alta (Horas)' },
    { value: 'Urgente', label: 'Urgente (Inmediato)' }
];

export function RequestCreationChat({ onBack, onSuccess }: RequestCreationChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentStep, setCurrentStep] = useState<ChatStep>('GREETING');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Data to collect
    const [formData, setFormData] = useState({
        description: '',
        category: '',
        title: '',
        priority: 'Normal',
        location: { lat: 0, lng: 0, address: 'Ciudad de Panamá', district: 'Centro' },
        photos: [] as string[]
    });

    const addMessage = (text: string, sender: MessageSender, type: Message['type'] = 'text', options?: string[], image?: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender,
            type,
            options,
            image,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const simulateBotResponse = async (step: ChatStep, delay = 1000) => {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, delay));

        switch (step) {
            case 'GREETING':
                addMessage("¡Hola! 👋 Soy tu asistente de Cotizapp. Cuéntame, ¿qué problema necesitas resolver hoy?", 'bot');
                setCurrentStep('DESCRIPTION');
                break;

            case 'CATEGORY':
                addMessage("Entiendo. Para encontrar al mejor profesional, ¿en qué categoría encaja mejor tu solicitud?", 'bot', 'options', CATEGORIES);
                break;

            case 'TITLE':
                addMessage("Perfecto. ¿Podrías darme un título corto para tu solicitud? (Ej: 'Fuga de agua en cocina')", 'bot');
                break;

            case 'PRIORITY':
                addMessage("¿Qué tan urgente es este trabajo?", 'bot', 'options', PRIORITIES.map(p => p.label));
                break;

            case 'PHOTOS':
                addMessage("¿Tienes alguna foto del problema? Ayudará a los proveedores a darte un mejor precio. (Opcional)", 'bot', 'upload');
                break;

            case 'CONFIRMATION':
                addMessage("¡Genial! Aquí tienes un resumen de tu solicitud:", 'bot');
                // Summary message logic handled separately or via special type
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: 'summary-' + Date.now(),
                        sender: 'bot',
                        text: 'Resumen',
                        type: 'summary',
                        timestamp: new Date()
                    }]);
                    setCurrentStep('SUBMITTING');
                }, 500);
                break;
        }
        setIsTyping(false);
    };

    useEffect(() => {
        // Initial Greeting
        simulateBotResponse('GREETING', 500);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        addMessage(text, 'user');
        setInputValue('');
        processUserInput(text);
    };

    const processUserInput = (text: string) => {
        switch (currentStep) {
            case 'DESCRIPTION':
                setFormData(prev => ({ ...prev, description: text }));
                // Simple heuristic to guess category or just verify
                // For now, let's just ask category to be safe
                simulateBotResponse('CATEGORY');
                setCurrentStep('CATEGORY');
                break;

            case 'CATEGORY':
                // Check if text matches a category
                const content = text.trim();
                const validCategory = CATEGORIES.find(c => c.toLowerCase() === content.toLowerCase());

                if (validCategory) {
                    setFormData(prev => ({ ...prev, category: validCategory }));
                    simulateBotResponse('TITLE');
                    setCurrentStep('TITLE');
                } else {
                    // Fuzzy match or just accept it if logic allows, 
                    // but for 'options' step usually we enforce selection
                    // Let's assume user typed a custom valid one or clicked a chip
                    setFormData(prev => ({ ...prev, category: content })); // Allow flexibility
                    simulateBotResponse('TITLE');
                    setCurrentStep('TITLE');
                }
                break;

            case 'TITLE':
                setFormData(prev => ({ ...prev, title: text }));
                simulateBotResponse('PRIORITY');
                setCurrentStep('PRIORITY');
                break;

            case 'PRIORITY':
                const priorityLabel = text; // e.g., "Alta (Horas)"
                const priorityValue = PRIORITIES.find(p => p.label === priorityLabel)?.value || 'Normal';

                setFormData(prev => ({ ...prev, priority: priorityValue }));
                simulateBotResponse('PHOTOS');
                setCurrentStep('PHOTOS');
                break;

            case 'PHOTOS':
                if (text.toLowerCase().includes('no') || text.toLowerCase().includes('omitir')) {
                    simulateBotResponse('CONFIRMATION');
                    setCurrentStep('CONFIRMATION');
                } else {
                    // Usually photo flow handles via upload button, but if they type something
                    simulateBotResponse('CONFIRMATION');
                    setCurrentStep('CONFIRMATION');
                }
                break;
        }
    };

    const handleOptionClick = (option: string) => {
        handleSendMessage(option);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageSrc = event.target?.result as string;
                addMessage("He subido esta foto", 'user', 'text', undefined, imageSrc);
                setFormData(prev => ({ ...prev, photos: [...prev.photos, imageSrc] }));

                // After photo, ask if they want more or finish
                // For simplicity, let's finish or user types "listo"
                // Or automatically move to confirmation after upload? 
                // Let's prompt
                setTimeout(() => {
                    addMessage("Imagen recibida. ¿Quieres subir otra o podemos continuar?", 'bot', 'options', ['Continuar']);
                }, 1000);
            };
            reader.readAsDataURL(file);
        }
    };

    const submitRequest = async () => {
        setIsTyping(true);
        try {
            await requestService.create({
                providerId: undefined,
                serviceId: undefined,
                category: formData.category as any,
                description: formData.description,
                title: formData.title,
                priority: formData.priority as any,
                location: formData.location,
                photos: formData.photos
            });

            addMessage("¡Tu solicitud ha sido publicada! 🎉 Los proveedores te contactarán pronto.", 'bot');
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (error) {
            console.error(error);
            addMessage("Hubo un error al crear la solicitud. Intenta de nuevo.", 'bot');
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-gray-50 rounded-lg overflow-hidden border shadow-inner">
            {/* Header */}
            <div className="bg-white p-4 items-center flex justify-between border-b shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-green-500 absolute bottom-0 right-0 border border-white"></div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                <Bot className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Asistente Cotizapp</h3>
                            <p className="text-xs text-green-600 font-medium">En línea para ayudarte</p>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-5 h-5 text-blue-600" />
                                </div>
                            )}

                            <div className="max-w-[80%] space-y-2">
                                {msg.image && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={msg.image} alt="Upload" className="max-w-full h-auto" />
                                    </div>
                                )}

                                {msg.type === 'summary' ? (
                                    <Card className="w-full bg-white shadow-sm border-blue-100">
                                        <CardHeader className="pb-2 bg-blue-50/50">
                                            <CardTitle className="text-sm font-bold text-blue-800">Resumen de Solicitud</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 text-sm space-y-3">
                                            <div>
                                                <span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Título</span>
                                                <span className="text-gray-900 font-medium">{formData.title}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Categoría</span>
                                                <span className="text-gray-900">{formData.category}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Descripción</span>
                                                <span className="text-gray-900">{formData.description}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide">Prioridad</span>
                                                <Badge variant={formData.priority === 'Urgente' ? 'destructive' : 'default'} className="mt-1">
                                                    {formData.priority}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-gray-50 p-3 pt-3">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={submitRequest}>
                                                Publicar Solicitud <Send className="w-4 h-4 ml-2" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ) : (
                                    <div className={`p-3.5 rounded-2xl shadow-sm text-sm ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                )}

                                {/* Interaction Buttons (Options or Upload) */}
                                {msg.sender === 'bot' && (
                                    <div>
                                        {msg.type === 'options' && msg.options && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {msg.options.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleOptionClick(opt)}
                                                        className="px-4 py-2 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {msg.type === 'upload' && (
                                            <div className="mt-2 flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-full border-dashed border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-50"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Subir foto
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="rounded-full text-gray-500 hover:text-gray-700"
                                                    onClick={() => handleOptionClick('Omitir')}
                                                >
                                                    Omitir
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex gap-1 bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm w-16 items-center justify-center h-10">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            {currentStep !== 'SUBMITTING' && (
                <div className="p-4 bg-white border-t">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Input
                            placeholder="Escribe tu respuesta..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                            className="rounded-full bg-gray-50 border-gray-200 focus-visible:ring-blue-500 focus-visible:ring-1"
                            disabled={isTyping}
                            autoFocus
                        />
                        <Button
                            size="icon"
                            className="rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0 shadow-md"
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isTyping}
                        >
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
