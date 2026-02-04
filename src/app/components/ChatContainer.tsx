import { useState, useEffect } from 'react';
import { ChatSidebar, ChatHistory } from './ChatSidebar';
import { ClientChat } from './ClientChat';
import { chatService } from '@/services';
import { NewRequestDialog } from './client/NewRequestDialog';

export function ChatContainer() {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      // The API returns DTOs, we need to map them to ChatHistory interface
      // Expected DTO based on sp_ObtenerConversacionesUsuario:
      // { Id, InterviewerName, LastMessage, LastMessageTime, UnreadCount, ServiceCategory, Status, TipoRelacion, ... }

      const mappedChats: ChatHistory[] = res.data.map((c: any) => ({
        id: c.Id, // Ensures we use the GUID
        title: c.InterviewerName || 'Usuario Desconocido',
        preview: c.LastMessage || 'Sin mensajes',
        timestamp: c.LastMessageTime ? new Date(c.LastMessageTime) : new Date(),
        type: c.TipoRelacion === 'Producto' ? 'product' : 'service',
        category: c.ServiceCategory,
        unread: c.UnreadCount > 0
      }));

      setChats(mappedChats);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  const handleNewChat = () => {
    setIsNewRequestOpen(true);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
    setChatKey(prev => prev + 1);
  };

  const handleChatUpdate = (chatId: string, title: string, preview: string, type: 'service' | 'product', category?: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? { ...chat, title, preview, type, category, timestamp: new Date() }
          : chat
      )
    );
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ClientChat
            key={chatKey}
            chatId={activeChat}
            onChatUpdate={handleChatUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">Bienvenido a Cotizaciones PTY</h2>
              <p className="text-gray-600 mb-6">Selecciona un chat o inicia una nueva conversación</p>
            </div>
          </div>
        )}
      </div>

      <NewRequestDialog
        open={isNewRequestOpen}
        onOpenChange={setIsNewRequestOpen}
        onSuccess={() => {
          // Maybe show a success toast?
          fetchConversations();
        }}
      />
    </div >
  );
}

