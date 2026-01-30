import { Provider, Quote, Location } from '@/types';

// Ubicaciones en Ciudad de Panamá
export const mockLocations: Location[] = [
  { lat: 9.0336, lng: -79.5339, address: 'Calle 50, Obarrio', district: 'Obarrio' },
  { lat: 9.0765, lng: -79.5203, address: 'Costa del Este', district: 'Costa del Este' },
  { lat: 8.9936, lng: -79.5197, address: 'San Francisco', district: 'San Francisco' },
  { lat: 8.9823, lng: -79.5199, address: 'Punta Pacífica', district: 'Punta Pacífica' },
  { lat: 9.0592, lng: -79.4594, address: 'Condado del Rey', district: 'Condado del Rey' },
];

export const mockProviders: Provider[] = [
  {
    id: 'prov-1',
    name: 'Plomería Rápida PTY',
    category: 'plomeria',
    rating: 4.8,
    totalReviews: 127,
    responseRate: 95,
    avgResponseTime: '3 min',
    location: mockLocations[0],
    coverageRadius: 10,
    profileImage: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=200&h=200&fit=crop',
    phone: '+507 6XXX-XXXX',
    services: ['Reparaciones', 'Instalaciones', 'Emergencias 24/7'],
    isPremium: true,
    requestsThisMonth: 45,
    freeRequestsLimit: 10
  },
  {
    id: 'prov-2',
    name: 'ElectroPro Panamá',
    category: 'electricidad',
    rating: 4.9,
    totalReviews: 203,
    responseRate: 98,
    avgResponseTime: '2 min',
    location: mockLocations[1],
    coverageRadius: 15,
    profileImage: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=200&h=200&fit=crop',
    phone: '+507 6XXX-XXXX',
    services: ['Instalaciones eléctricas', 'Reparaciones', 'Mantenimiento'],
    isPremium: true,
    requestsThisMonth: 62,
    freeRequestsLimit: 10
  },
  {
    id: 'prov-3',
    name: 'Clima Fresh A/C',
    category: 'aire-acondicionado',
    rating: 4.7,
    totalReviews: 156,
    responseRate: 92,
    avgResponseTime: '4 min',
    location: mockLocations[2],
    coverageRadius: 12,
    profileImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop',
    phone: '+507 6XXX-XXXX',
    services: ['Instalación', 'Reparación', 'Mantenimiento', 'Todas las marcas'],
    isPremium: true,
    requestsThisMonth: 38,
    freeRequestsLimit: 10
  },
  {
    id: 'prov-4',
    name: 'Servicios JJ Plomería',
    category: 'plomeria',
    rating: 4.6,
    totalReviews: 89,
    responseRate: 88,
    avgResponseTime: '5 min',
    location: mockLocations[3],
    coverageRadius: 8,
    profileImage: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200&h=200&fit=crop',
    phone: '+507 6XXX-XXXX',
    services: ['Reparaciones generales', 'Instalaciones'],
    isPremium: false,
    requestsThisMonth: 7,
    freeRequestsLimit: 10
  },
  {
    id: 'prov-5',
    name: 'Electricidad Total',
    category: 'electricidad',
    rating: 4.5,
    totalReviews: 74,
    responseRate: 85,
    avgResponseTime: '6 min',
    location: mockLocations[4],
    coverageRadius: 10,
    profileImage: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=200&h=200&fit=crop',
    phone: '+507 6XXX-XXXX',
    services: ['Emergencias', 'Instalaciones', 'Reparaciones'],
    isPremium: true,
    requestsThisMonth: 31,
    freeRequestsLimit: 10
  }
];

export function generateMockQuotes(requestId: string, category: string, userLocation: Location): Quote[] {
  const categoryProviders = mockProviders.filter(p => p.category === category);

  // Simular 3-5 cotizaciones
  const numQuotes = Math.min(categoryProviders.length, Math.floor(Math.random() * 3) + 3);

  return categoryProviders.slice(0, numQuotes).map((provider, index) => {
    const basePrice = category === 'plomeria' ? 50 : category === 'electricidad' ? 60 : 75;
    const price = basePrice + Math.floor(Math.random() * 100);
    const distance = Math.random() * provider.coverageRadius;
    const responseMinutes = Math.floor(Math.random() * 8) + 1;

    return {
      id: `quote-${requestId}-${provider.id}`,
      requestId,
      providerId: provider.id,
      providerName: provider.name,
      providerRating: provider.rating,
      providerResponseTime: `${responseMinutes} min`,
      price,
      currency: 'USD',
      description: index === 0
        ? 'Incluye materiales y mano de obra. Garantía de 30 días.'
        : index === 1
          ? 'Visita de diagnóstico + reparación. Materiales aparte.'
          : 'Servicio completo con garantía de 60 días.',
      availability: index === 0
        ? 'Disponible hoy mismo'
        : index === 1
          ? 'Mañana en la mañana'
          : 'Hoy en la tarde',
      conditions: 'Pago contra entrega del servicio',
      distance: Number(distance.toFixed(1)),
      status: 'pending',
      createdAt: new Date(Date.now() - responseMinutes * 60000)
    };
  });
}

// Calcular distancia entre dos puntos (fórmula haversine simplificada)
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
