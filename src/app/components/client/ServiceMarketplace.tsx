import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { ServiceListing, ServiceCategory, ProactiveProposal } from '@/types';
import {
  Search,
  Star,
  MapPin,
  DollarSign,
  Filter,
  ShoppingBag,
  Zap,
  MessageSquare,
  Bell
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { marketplaceService } from '@/services';

const categoryNames: Record<ServiceCategory, string> = {
  'plomeria': 'Plomería',
  'electricidad': 'Electricidad',
  'aire-acondicionado': 'Aire Acondicionado',
  'cerrajeria': 'Cerrajería',
  'limpieza': 'Limpieza',
  'electrodomesticos': 'Electrodomésticos',
  'pintura': 'Pintura',
  'carpinteria': 'Carpintería'
};

const getCategoryIcon = (category: ServiceCategory) => {
  const icons: Record<ServiceCategory, string> = {
    'plomeria': '🔧',
    'electricidad': '⚡',
    'aire-acondicionado': '❄️',
    'cerrajeria': '🔑',
    'limpieza': '🧹',
    'electrodomesticos': '🔌',
    'pintura': '🎨',
    'carpinteria': '🪚'
  };
  return icons[category];
};

export function ServiceMarketplace() {
  /* import { Label } from '@/app/components/ui/label'; */ // Assuming Label is needed, checking imports first.
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');

  // Negotiation Logic
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [negotiationOffer, setNegotiationOffer] = useState('');
  const [negotiationMessage, setNegotiationMessage] = useState('');

  const handleSubmitNegotiation = async () => {
    if (!selectedService) {
      alert("Error: No service selected");
      return;
    }
    if (!negotiationOffer) {
      alert("Por favor ingresa un monto para tu oferta.");
      return;
    }

    try {
      // Show explicit loading feedback (simple alert for now or just proceed)
      // alert('Enviando oferta...'); 

      await marketplaceService.negotiateService(
        selectedService.id,
        parseFloat(negotiationOffer),
        negotiationMessage || 'Oferta inicial'
      );
      alert('¡Oferta enviada con éxito! El proveedor la revisará.');
      setIsNegotiationOpen(false);
      setNegotiationOffer('');
      setNegotiationMessage('');
    } catch (error: any) {
      console.error('Negotiation Error:', error);
      let msg = 'Error al enviar oferta';

      const data = error.response?.data;
      if (data) {
        if (data.Error) msg = data.Error;
        else if (data.error) msg = data.error; // Catch lowercase error
        else if (data.message) msg = data.message;
        else if (data.errors) {
          const vals = Object.values(data.errors);
          if (vals.length > 0) msg = String(vals[0]);
        }
      }
      console.log('Full Error:', error.response?.data);
      alert(`Debug Error: ${JSON.stringify(error.response?.data || error.message)}`);
      // alert(`Atención: ${msg}`);
    }
  };

  // State for services
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await import('@/services').then(m => m.marketplaceService.getActiveServices());
        // Map API DTO to ServiceListing
        // Map API DTO to ServiceListing
        const mappedServices: ServiceListing[] = data.map((s: any) => {
          let parsedTags: string[] = [];
          try {
            // Try parsing as JSON first
            if (s.etiquetas && (s.etiquetas.startsWith('[') || s.etiquetas.startsWith('{'))) {
              parsedTags = JSON.parse(s.etiquetas);
            } else if (s.etiquetas) {
              parsedTags = s.etiquetas.split(',').map((t: string) => t.trim());
            }
            if (!Array.isArray(parsedTags)) parsedTags = [String(s.etiquetas)];
          } catch (e) {
            parsedTags = s.etiquetas ? [String(s.etiquetas)] : [];
          }

          let parsedCoverage: string[] = [];
          try {
            if (s.coberturaArea && (s.coberturaArea.startsWith('[') || s.coberturaArea.startsWith('{'))) {
              parsedCoverage = JSON.parse(s.coberturaArea);
            } else if (s.coberturaArea) {
              parsedCoverage = s.coberturaArea.split(',').map((t: string) => t.trim());
            }
            if (!Array.isArray(parsedCoverage)) parsedCoverage = [String(s.coberturaArea)];
          } catch (e) {
            parsedCoverage = s.coberturaArea ? [String(s.coberturaArea)] : [];
          }

          return {
            id: s.id,
            providerId: s.proveedorId,
            providerName: s.proveedorNombre || 'Proveedor',
            providerRating: s.proveedorRating === null ? 5.0 : s.proveedorRating,
            providerReviews: 0,
            category: s.categoria,
            title: s.titulo,
            description: s.descripcion,
            price: s.precio,
            priceType: s.precioTipo,
            images: [],
            tags: parsedTags,
            isActive: s.activo,
            location: {
              district: s.ubicacionDistrito || 'Panamá',
              coverageArea: parsedCoverage
            },
            createdAt: new Date(),
            allowNegotiation: s.permitirNegociacion,
            minNegotiablePrice: s.precioMinimo
          };
        });
        setServices(mappedServices);
      } catch (error) {
        console.error("Failed to load marketplace services", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Mock data - propuestas proactivas
  const [proposals] = useState<ProactiveProposal[]>([
    {
      id: 'prop-1',
      providerId: 'prov-2',
      providerName: 'Mario Plomería Rápida',
      providerRating: 4.9,
      serviceListingId: 'serv-3',
      category: 'plomeria',
      title: '🔥 Oferta Especial: Destape de Tuberías',
      description: '¡Aprovecha! Destape de tuberías con 20% de descuento. Solo esta semana.',
      price: 36,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      status: 'pending',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'prop-2',
      providerId: 'prov-3',
      providerName: 'Limpieza Express PTY',
      providerRating: 4.8,
      category: 'limpieza',
      title: '✨ Paquete de Limpieza con Descuento',
      description: '2 limpiezas profundas al mes con 15% de descuento. Ideal para mantener tu hogar siempre limpio.',
      price: 102,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      status: 'pending',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    }
  ]);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriceTypeLabel = (type: ServiceListing['priceType']) => {
    switch (type) {
      case 'fixed': return 'Precio fijo';
      case 'starting-from': return 'Desde';
      case 'per-hour': return 'Por hora';
    }
  };

  const handleContactProvider = async (service: ServiceListing) => {
    try {
      // Use requestService to create a direct request
      await import('@/services').then(m => m.requestService.create({
        category: service.category,
        description: `Solicitud de servicio: ${service.title}`,
        serviceId: service.id,
        providerId: service.providerId,
        location: {
          lat: 0, // Should be replaced with real user location if available
          lng: 0,
          address: 'Ubicación del cliente',
          district: service.location.district
        }
      }));

      alert(`✅ Solicitud enviada a ${service.providerName}!\n\nEl proveedor ha recibido tu solicitud y podrás verla en tu historial.`);
      setSelectedService(null);
    } catch (error) {
      console.error(error);
      alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
    }
  };

  const formatTimeRemaining = (date: Date) => {
    const now = Date.now();
    const diff = date.getTime() - now;
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);
    const hours = Math.floor((diff / 1000 / 60 / 60) % 24);

    if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Expira pronto';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Catálogo de Servicios
          </CardTitle>
          <p className="text-sm text-gray-600">
            Explora servicios disponibles y recibe propuestas de proveedores
          </p>
        </CardHeader>
      </Card>

      {/* Propuestas Proactivas */}
      {proposals.filter(p => p.status === 'pending').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-lg">Propuestas para Ti</h3>
            <Badge className="bg-orange-100 text-orange-800">
              {proposals.filter(p => p.status === 'pending').length} nueva{proposals.filter(p => p.status === 'pending').length > 1 ? 's' : ''}
            </Badge>
          </div>
          {proposals.filter(p => p.status === 'pending').map((proposal) => (
            <Card key={proposal.id} className="border-2 border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">{proposal.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{proposal.providerName}</span>
                        <div className="flex items-center gap-1 ml-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{proposal.providerRating}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Válido por {formatTimeRemaining(proposal.validUntil)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      ${proposal.price}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Aceptar
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ServiceCategory | 'all')}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categoryNames).map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {getCategoryIcon(key as ServiceCategory)} {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedService(service)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl">{getCategoryIcon(service.category)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{service.title}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">{service.providerName}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{service.providerRating}</span>
                      <span className="text-xs text-gray-500">({service.providerReviews})</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{service.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {service.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {service.location.district}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ${service.price}
                      </p>
                      <p className="text-xs text-gray-500">{getPriceTypeLabel(service.priceType)}</p>
                      {service.allowNegotiation && (
                        <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                          Negociable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {
        filteredServices.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No se encontraron servicios</p>
              <p className="text-sm text-gray-400">
                Intenta con otros términos de búsqueda o cambia el filtro
              </p>
            </CardContent>
          </Card>
        )
      }

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiationOpen} onOpenChange={setIsNegotiationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Negociar Precio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Precio de Lista</p>
              <p className="text-xl font-bold">${selectedService?.price}</p>
            </div>

            <div className="space-y-2">
              <Label>Tu Oferta (USD)</Label>
              <Input
                type="number"
                placeholder="Ej. 80"
                value={negotiationOffer}
                onChange={(e) => setNegotiationOffer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensaje Inicial</Label>
              <Input
                placeholder="Hola, me interesa pero..."
                value={negotiationMessage}
                onChange={(e) => setNegotiationMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiationOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitNegotiation}>Enviar Oferta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Detail Dialog */}
      <Dialog open={selectedService !== null && !isNegotiationOpen} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-3xl">{getCategoryIcon(selectedService.category)}</span>
                  {selectedService.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Provider Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{selectedService.providerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedService.providerRating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({selectedService.providerReviews} reseñas)
                      </span>
                    </div>
                  </div>
                  <Badge>{categoryNames[selectedService.category]}</Badge>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-gray-600">{selectedService.description}</p>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-semibold mb-2">Características</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Coverage */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Áreas de Cobertura
                  </h4>
                  <p className="text-gray-600">
                    {selectedService.location.coverageArea.join(', ')}
                  </p>
                </div>

                {/* Price */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{getPriceTypeLabel(selectedService.priceType)}</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${selectedService.price}
                      </p>
                      {selectedService.allowNegotiation && (
                        <Badge variant="outline" className="mt-1 bg-white">
                          Precio Mínimo: ${selectedService.minNegotiablePrice || '?'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedService.allowNegotiation && (
                        <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => setIsNegotiationOpen(true)}>
                          <DollarSign className="w-5 h-5 mr-2" />
                          Negociar
                        </Button>
                      )}
                      <Button size="lg" onClick={() => handleContactProvider(selectedService)}>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Solicitar Servicio
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
