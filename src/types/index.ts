// Types para el marketplace de cotizaciones

export type UserRole = 'cliente' | 'proveedor';

export type RequestType = 'service' | 'product';

export type ServiceCategory =
  | 'plomeria'
  | 'electricidad'
  | 'aire-acondicionado'
  | 'cerrajeria'
  | 'limpieza'
  | 'electrodomesticos'
  | 'pintura'
  | 'carpinteria';

export type RequestStatus =
  | 'describing' // Cliente describiendo el problema
  | 'guided-questions' // Preguntas guiadas
  | 'pending' // Esperando cotizaciones
  | 'received-quotes' // Cotizaciones recibidas
  | 'in-chat' // Chateando con proveedor
  | 'completed'; // Servicio completado

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  district: string; // Corregimiento en Panamá
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  category: ServiceCategory | null;
  description: string;
  photos: string[];
  location: Location | null;
  status: RequestStatus;
  guidedAnswers: Record<string, string>;
  createdAt: Date;
  expiresAt: Date; // 10 minutos después
}

export interface Quote {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerResponseTime: string; // "2 min"
  price: number;
  originalPrice?: number; // Precio original antes de negociar
  currency: string;
  description: string;
  availability: string;
  conditions: string;
  distance: number; // km
  status: QuoteStatus;
  createdAt: Date;
  negotiationHistory?: NegotiationMessage[];
}

export interface Provider {
  id: string;
  name: string;
  rating: number;
  totalReviews: number;
  reviewCount: number;
  responseRate: number; // Added
  avgResponseTime: string; // Added
  category: ServiceCategory;
  phone: string;
  location: Location;
  coverageRadius: number; // km
  isPremium: boolean;
  membershipStatus: 'free' | 'paid';
  responseTime: string; // Maintain both if needed or unify
  services: string[];
  requestsThisMonth: number;
  freeRequestsLimit: number;
  profileImage?: string;
}

export interface ChatConversation {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'completed' | 'cancelled';
  serviceCategory: string;
  quotedPrice: number;
}

export interface ServiceRequestHistory {
  id: string;
  category: ServiceCategory;
  description: string;
  createdAt: Date;
  status: 'completed' | 'cancelled' | 'in_progress';
  quotesReceived: number;
  selectedProvider?: {
    name: string;
    price: number;
    rating: number;
  };
  finalPrice?: number;
  clientRating?: number;
  clientReview?: string;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerReviews: number;
  category: ServiceCategory;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'starting-from' | 'per-hour';
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  location: {
    district: string;
    coverageArea: string[];
  };
  allowNegotiation?: boolean;
  minNegotiablePrice?: number;
}

export interface ProactiveProposal {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  serviceListingId?: string;
  category: ServiceCategory;
  title: string;
  description: string;
  price: number;
  validUntil: Date;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected';
  sentAt: Date;
}

export type ProductCategory =
  | 'electronica'
  | 'computadoras'
  | 'videojuegos'
  | 'hogar'
  | 'construccion'
  | 'herramientas'
  | 'jardineria'
  | 'automotriz'
  | 'otros';

export type ProductCondition = 'nuevo' | 'usado-como-nuevo' | 'usado-bueno' | 'usado-aceptable';

export interface ProductListing {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerReviews: number;
  category: ProductCategory;
  title: string;
  description: string;
  price: number;
  originalPrice?: number; // Para mostrar descuentos
  condition: ProductCondition;
  images: string[];
  tags: string[];
  stock: number;
  isActive: boolean;
  allowNegotiation: boolean;
  minNegotiablePrice?: number;
  createdAt: Date;
  location: {
    district: string;
  };
  specifications?: Record<string, string>;
}

export interface ProductNegotiation {
  id: string;
  productId: string;
  productTitle: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  originalPrice: number;
  currentOffer: number;
  status: 'pending' | 'counter-offered' | 'accepted' | 'rejected' | 'completed';
  messages: NegotiationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NegotiationMessage {
  id: string;
  sender: 'client' | 'provider' | 'cliente' | 'proveedor';
  type: 'offer' | 'counter-offer' | 'message' | 'acceptance' | 'rejection' | 'price_proposal';
  amount?: number;
  price?: number; // Used in PriceNegotiation.tsx
  message: string;
  createdAt: Date;
  timestamp: Date; // Used in PriceNegotiation.tsx (mapping to createdAt)
}

export interface ProductOrder {
  id: string;
  productId: string;
  productTitle: string;
  clientId: string;
  providerId: string;
  providerName: string;
  finalPrice: number;
  quantity: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  wasNegotiated: boolean;
  negotiationId?: string;
  createdAt: Date;
  deliveryAddress?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'provider';
  providerId?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'quote' | 'question' | 'photo';
  metadata?: any;
}

export interface Rating {
  id: string;
  requestId: string;
  providerId: string;
  clientId: string;
  score: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface GuidedQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'photo' | 'location';
  options?: string[];
  required: boolean;
}