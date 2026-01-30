import { Plus, MessageSquare, Clock, Package2, Wrench } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';

export interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  type: 'service' | 'product';
  category?: string;
  unread?: boolean;
}

interface ChatSidebarProps {
  chats: ChatHistory[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ chats, activeChat, onSelectChat, onNewChat }: ChatSidebarProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days}d`;
    
    return date.toLocaleDateString('es-PA', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Mis Chats</h2>
          <Button 
            size="sm" 
            onClick={onNewChat}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          {chats.length} {chats.length === 1 ? 'conversación' : 'conversaciones'}
        </p>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No tienes conversaciones aún</p>
              <Button onClick={onNewChat} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Iniciar nueva conversación
              </Button>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-3 rounded-lg mb-2 text-left transition-colors hover:bg-gray-50 ${
                  activeChat === chat.id 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    chat.type === 'product' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {chat.type === 'product' ? (
                      <Package2 className="w-5 h-5" />
                    ) : (
                      <Wrench className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {chat.title}
                      </h3>
                      {chat.unread && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {chat.preview}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(chat.timestamp)}
                      </div>
                      {chat.category && (
                        <Badge variant="outline" className="text-xs">
                          {chat.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
