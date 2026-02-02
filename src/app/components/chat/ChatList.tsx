import { useState, useEffect } from 'react'; // Shared Chat List
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ChatConversation } from '@/types';
import { MessageSquare, Star, DollarSign, CheckCircle2, XCircle, MessageCircle, Trash2 } from 'lucide-react';
import { ProviderChat } from '../ProviderChat';
import { ChatDrawer } from './ChatDrawer';
import { chatService } from '@/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';

interface ChatListProps {
    onBack?: () => void;
    userRole?: 'cliente' | 'proveedor';
}

export function ChatList({ onBack, userRole }: ChatListProps) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [chats, setChats] = useState<ChatConversation[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchChats = async () => {
        try {
            const response = await chatService.getConversations();
            const mappedChats: ChatConversation[] = response.data.map((c: any) => {
                let frontendStatus: 'active' | 'completed' | 'cancelled' = 'active';

                const backendStatus = (c.Status || '').toLowerCase();
                if (backendStatus === 'rechazada') {
                    frontendStatus = 'cancelled';
                }
                // 'aceptada' stays as 'active' frontend status 
                // until the provider manually marks it as completed

                return {
                    id: c.Id,
                    providerId: c.ProveedorId,
                    providerName: c.InterviewerName || 'Usuario',
                    providerRating: 5.0,
                    lastMessage: c.LastMessage || 'Inicio de conversación',
                    lastMessageTime: new Date(c.LastMessageTime || Date.now()),
                    unreadCount: c.UnreadCount || 0,
                    status: frontendStatus,
                    rawStatus: backendStatus,
                    serviceCategory: c.ServiceCategory || 'General',
                    quotedPrice: c.QuotedPrice || 0,
                    negotiationId: c.NegotiationId,
                    negotiationCounter: c.NegotiationCounter,
                    type: c.TipoRelacion
                };
            });
            setChats(mappedChats);
        } catch (error) {
            console.error("Error loading chats", error);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    // Refresh when returning from a chat
    useEffect(() => {
        if (selectedChatId === null) {
            // Small delay to ensure any markAsRead from children finished
            const timer = setTimeout(() => {
                fetchChats();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [selectedChatId]);

    const handleDeleteChat = async () => {
        if (!chatToDelete) return;
        setDeleting(true);
        try {
            await chatService.deleteConversation(chatToDelete);
            setIsDeleteDialogOpen(false);
            setChatToDelete(null);
            fetchChats();
        } catch (error) {
            alert('Error al eliminar la conversación');
            console.error(error);
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: ChatConversation['status']) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">Cancelado</Badge>;
        }
    };

    const formatTime = (date: Date) => {
        const now = Date.now();
        const diff = now - date.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days === 1) return 'Ayer';
        return `Hace ${days} días`;
    };

    const activeChats = chats.filter(c => c.status === 'active');
    const completedChats = chats.filter(c => c.status === 'completed');
    const cancelledChats = chats.filter(c => c.status === 'cancelled');

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        setIsMobileDrawerOpen(false);
    };

    const totalUnreadCount = chats.reduce((sum, c) => sum + c.unreadCount, 0);

    // If a chat is selected, show the conversation
    if (selectedChatId) {
        const selectedChat = chats.find(c => c.id === selectedChatId);
        if (selectedChat) {
            return (
                <div className="h-full flex flex-col">
                    {/* Mobile: Back button at top */}
                    <div className="sm:hidden border-b bg-white p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChatId(null)}
                            className="w-full"
                        >
                            ← Volver a Mis Mensajes
                        </Button>
                    </div>

                    {/* Desktop: Back button above chat */}
                    <div className="hidden sm:block mb-4">
                        <Button variant="outline" onClick={() => setSelectedChatId(null)}>
                            ← Volver a Mis Mensajes
                        </Button>
                    </div>

                    {/* Chat Container */}
                    <div className="flex-1 overflow-hidden">
                        <ProviderChat
                            conversationId={selectedChat.id}
                            providerName={selectedChat.providerName}
                            serviceName={selectedChat.serviceCategory}
                            quotedPrice={selectedChat.quotedPrice}
                            negotiationId={selectedChat.negotiationId}
                            negotiationCounter={selectedChat.negotiationCounter}
                            type={selectedChat.type}
                            status={selectedChat.rawStatus}
                            userRole={userRole}
                            onBack={() => setSelectedChatId(null)}
                            onComplete={() => {
                                alert('✅ Servicio marcado como completado');
                                setSelectedChatId(null);
                            }}
                        />
                    </div>
                </div>
            );
        }
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6" />
                            Mis Mensajes
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Tus conversaciones activas en un solo lugar
                        </p>
                    </CardHeader>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{activeChats.length}</p>
                                <p className="text-sm text-gray-600 mt-1">Activos</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">{completedChats.length}</p>
                                <p className="text-sm text-gray-600 mt-1">Completados</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-orange-600">
                                    {totalUnreadCount}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">No leídos</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Chats */}
                {activeChats.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            Conversaciones Activas
                        </h3>
                        {activeChats.map((chat) => (
                            <Card
                                key={chat.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                                onClick={() => setSelectedChatId(chat.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {chat.providerName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold">{chat.providerName}</h4>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm font-medium">{chat.providerRating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{chat.serviceCategory}</p>
                                                <p className="text-sm text-gray-700 line-clamp-1">{chat.lastMessage}</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-xs text-gray-500 mb-2">{formatTime(chat.lastMessageTime)}</p>
                                            {chat.unreadCount > 0 && (
                                                <Badge className="bg-red-500 text-white">
                                                    {chat.unreadCount} nuevo{chat.unreadCount > 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-red-500 mt-2"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setChatToDelete(chat.id);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <div className="flex items-center gap-1 text-sm">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="font-semibold">${chat.quotedPrice}</span>
                                        </div>
                                        {getStatusBadge(chat.status)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Completed Chats */}
                {completedChats.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            Servicios Completados
                        </h3>
                        {completedChats.map((chat) => (
                            <Card
                                key={chat.id}
                                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 opacity-80"
                                onClick={() => setSelectedChatId(chat.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {chat.providerName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold">{chat.providerName}</h4>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm font-medium">{chat.providerRating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{chat.serviceCategory}</p>
                                                <p className="text-sm text-gray-500 line-clamp-1">{chat.lastMessage}</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-xs text-gray-500 mb-2">{formatTime(chat.lastMessageTime)}</p>
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(chat.status)}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-300 hover:text-red-500"
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        setChatToDelete(chat.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm pt-3 border-t mt-3">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-semibold">${chat.quotedPrice}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Cancelled Chats */}
                {cancelledChats.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-600">
                            <XCircle className="w-5 h-5" />
                            Cancelados
                        </h3>
                        {cancelledChats.map((chat) => (
                            <Card
                                key={chat.id}
                                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-gray-300 opacity-60"
                                onClick={() => setSelectedChatId(chat.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {chat.providerName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-700">{chat.providerName}</h4>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-1">{chat.serviceCategory}</p>
                                                <p className="text-sm text-gray-400 line-clamp-1">{chat.lastMessage}</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-xs text-gray-500 mb-2">{formatTime(chat.lastMessageTime)}</p>
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(chat.status)}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-300 hover:text-red-500"
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        setChatToDelete(chat.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {chats.length === 0 && (
                    <Card className="border-2 border-dashed">
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-2">No tienes conversaciones aún</p>
                            <p className="text-sm text-gray-400">
                                Tus chats aparecerán aquí cuando haya una interacción activa
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Mobile View Toggle (Simplified for shared use) */}
            <div className="sm:hidden flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 relative">
                    <MessageCircle className="w-10 h-10 text-white" />
                    {totalUnreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{totalUnreadCount}</span>
                        </div>
                    )}
                </div>

                <h2 className="text-xl font-bold mb-2">Mis Mensajes</h2>
                <Button
                    size="lg"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Ver Mis Mensajes
                </Button>
            </div>

            {/* Mobile Drawer */}
            <ChatDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                onSelectChat={handleSelectChat}
                chats={chats}
                onDeleteChat={(id: string) => {
                    setChatToDelete(id);
                    setIsDeleteDialogOpen(true);
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar conversación?</DialogTitle>
                        <DialogDescription>
                            Esta acción quitará el chat de tu lista. El otro participante aún podrá ver la conversación.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteChat} disabled={deleting}>
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
