import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ChatConversation } from '@/types';
import { MessageSquare, Star, DollarSign, X, CheckCircle2, XCircle, ArrowLeft, Trash2 } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  chats: ChatConversation[];
  onDeleteChat?: (chatId: string) => void;
}

export function ChatDrawer({ isOpen, onClose, onSelectChat, chats, onDeleteChat }: ChatDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getStatusBadge = (status: ChatConversation['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="text-xs">Cancelado</Badge>;
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

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  const activeChats = chats.filter(c => c.status === 'active');
  const completedChats = chats.filter(c => c.status === 'completed');
  const cancelledChats = chats.filter(c => c.status === 'cancelled');

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Mis Chats</h2>
              <p className="text-xs text-white/90">{chats.length} conversaciones</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-green-600">{activeChats.length}</p>
            <p className="text-xs text-gray-600">Activos</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-blue-600">{completedChats.length}</p>
            <p className="text-xs text-gray-600">Completados</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-orange-600">
              {chats.reduce((sum, c) => sum + c.unreadCount, 0)}
            </p>
            <p className="text-xs text-gray-600">No leídos</p>
          </div>
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto h-[calc(100vh-200px)] p-3 space-y-4">
          {/* Active Chats */}
          {activeChats.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 px-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                Conversaciones Activas
              </h3>
              {activeChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500 active:scale-98"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {chat.providerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{chat.providerName}</h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{chat.providerRating}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{chat.serviceCategory}</p>
                        <p className="text-xs text-gray-700 line-clamp-2">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-semibold">${chat.quotedPrice}</span>
                        </div>
                        <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                          {chat.unreadCount}
                        </Badge>
                      )}
                      {onDeleteChat && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Chats */}
          {completedChats.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700 px-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Servicios Completados
              </h3>
              {completedChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 opacity-80 active:scale-98"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {chat.providerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{chat.providerName}</h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{chat.providerRating}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{chat.serviceCategory}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-semibold">${chat.quotedPrice}</span>
                        </div>
                        <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(chat.status)}
                        {onDeleteChat && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Cancelled Chats */}
          {cancelledChats.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-600 px-2">
                <XCircle className="w-4 h-4" />
                Cancelados
              </h3>
              {cancelledChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-gray-300 opacity-60 active:scale-98"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {chat.providerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-700 truncate">{chat.providerName}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{chat.serviceCategory}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{chat.lastMessage}</p>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(chat.status)}
                            {onDeleteChat && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
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
          {chats.length === 0 && (
            <div className="py-16 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No tienes conversaciones aún</p>
              <p className="text-sm text-gray-400">
                Cuando selecciones un proveedor, podrás chatear aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
