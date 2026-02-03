import api from './api';
import type { ServiceRequest, Quote } from '@/types';

export const authService = {
    login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        return res.data;
    },
    register: async (data: any) => {
        return api.post('/auth/register', data);
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export const requestService = {
    create: async (data: Partial<ServiceRequest>) => {
        return api.post('/requests/create', {
            clienteId: JSON.parse(localStorage.getItem('user') || '{}').id,
            categoria: data.category,
            descripcion: data.description,
            fotosJson: JSON.stringify(data.photos || []),
            respuestasGuiadasJson: JSON.stringify(data.guidedAnswers || {}),
            ubicacionLat: data.location?.lat,
            ubicacionLng: data.location?.lng,
            ubicacionDireccion: data.location?.address
        });
    },
    getNearby: async (lat: number, lng: number, category: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get('/requests/nearby', {
            params: { providerId: user.id, lat, lng, category }
        });
    },
    submitQuote: async (quote: Partial<Quote>) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/requests/quote', {
            solicitudId: quote.requestId,
            proveedorId: user.id,
            precio: quote.price,
            mensaje: quote.description,
            tiempoEstimado: quote.availability // mapping availability to tiempoEstimado
        });
    }
};

export const providerService = {
    getAll: async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get(`/services/provider/${user.id}`);
    },
    save: async (service: any) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/services/manage', { ...service, proveedorId: user.id });
    },
    delete: async (id: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post(`/services/delete/${id}?providerId=${user.id}`);
    },
    toggle: async (id: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post(`/services/toggle/${id}?providerId=${user.id}`);
    },
    upgradeMembership: async (providerId: string, paymentMethod: string) => {
        return api.post('/payments/upgrade', { providerId, paymentMethod });
    }
};

export const marketplaceService = {
    getActiveServices: async () => {
        return api.get('/services/active');
    },
    getActiveProducts: async () => {
        return api.get('/products/active');
    },
    negotiateService: async (serviceId: string, offerAmount: number, message: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/services/negotiate', {
            serviceId,
            clientId: user.id,
            offerAmount,
            message
        });
    },
    negotiateProduct: async (productId: string, offerAmount: number, message: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/products/negotiate', {
            productId,
            clientId: user.id,
            offerAmount,
            message
        });
    },
    purchaseProduct: async (productId: string, quantity: number, message?: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/products/purchase', {
            productId,
            clientId: user.id,
            quantity,
            message
        });
    }
};

export const productService = {
    getAll: async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get(`/products/provider/${user.id}`);
    },
    save: async (product: any) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/products/manage', { ...product, proveedorId: user.id });
    },
    delete: async (id: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post(`/products/delete/${id}?providerId=${user.id}`);
    },
    toggle: async (id: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post(`/products/toggle/${id}?providerId=${user.id}`);
    }
};

export const providerProfileService = {
    getProfile: async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get(`/providers/${user.id}`);
    },
    updateProfile: async (profile: any) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/providers/update', { ...profile, id: user.id });
    }
};

export const providerNegotiationService = {
    getAll: async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get(`/negotiations/provider/${user.id}`);
    },
    respond: async (data: { negotiationId: string, providerId: string, type: string, action: string, counterOfferAmount?: number, message?: string }) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/negotiations/respond', { ...data, providerId: user.id });
    }
};

export const clientNegotiationService = {
    respond: async (data: { negotiationId: string, clientId: string, type: string, action: string, counterOfferAmount?: number, message?: string }) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/negotiations/respond/client', { ...data, clientId: user.id });
    }
};

export const chatService = {
    getConversations: async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.get(`/chat/user/${user.id}`);
    },
    getMessages: async (conversationId: string) => {
        return api.get(`/chat/${conversationId}/messages`);
    },
    sendMessage: async (conversationId: string, content: string, type: string = 'Texto') => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post('/chat/send', {
            conversacionId: conversationId,
            emisorId: user.id,
            contenido: content,
            tipo: type
        });
    },
    getContext: async (conversationId: string) => {
        return api.get(`/chat/${conversationId}/context`);
    },
    deleteConversation: async (conversationId: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.delete(`/chat/delete/${conversationId}/${user.id}`);
    },
    markAsRead: async (conversationId: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return api.post(`/chat/mark-read/${conversationId}/${user.id}`);
    }
};
