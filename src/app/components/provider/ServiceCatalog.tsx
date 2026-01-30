import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { providerService } from '@/services';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { ServiceListing, ServiceCategory } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';

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

export function ServiceCatalog() {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const { data } = await providerService.getAll();
      console.log('Services from backend:', data); // Debug log
      // Map backend fields to frontend interface if needed
      // Assuming backend returns matching fields or close enough
      const mapped = data.map((s: any) => ({
        id: s.id,
        category: s.categoria,
        title: s.titulo,
        description: s.descripcion,
        price: s.precio,
        priceType: s.precioTipo,
        tags: s.etiquetas ? s.etiquetas.split(',') : [],
        isActive: s.activo,
        allowNegotiation: s.permitirNegociacion,
        minNegotiablePrice: s.precioMinimo,
        createdAt: s.fechaCreacion,
        providerId: s.proveedorId,
        location: {
          district: 'Panamá',
          coverageArea: s.coberturaArea ? s.coberturaArea.split(',') : []
        }
      }));
      setServices(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useState(() => {
    fetchServices();
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);
  const [formData, setFormData] = useState({
    category: 'electricidad' as ServiceCategory,
    title: '',
    description: '',
    price: '',
    priceType: 'fixed' as ServiceListing['priceType'],
    tags: '',
    coverageArea: '',
    allowNegotiation: false,
    minNegotiablePrice: ''
  });

  const activeServices = services.filter(s => s.isActive);
  const inactiveServices = services.filter(s => !s.isActive);

  const handleToggleActive = async (serviceId: string) => {
    try {
      await providerService.toggle(serviceId);
      fetchServices();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      try {
        await providerService.delete(serviceId);
        fetchServices();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleEdit = (service: ServiceListing) => {
    setEditingService(service);
    setFormData({
      category: service.category,
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      priceType: service.priceType,
      tags: service.tags.join(', '),
      coverageArea: service.location.coverageArea.join(', '),
      allowNegotiation: service.allowNegotiation || false,
      minNegotiablePrice: service.minNegotiablePrice?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await providerService.save({
        id: editingService?.id, // undefined for new
        categoria: formData.category,
        titulo: formData.title,
        descripcion: formData.description,
        precio: parseFloat(formData.price),
        precioTipo: formData.priceType,
        etiquetas: formData.tags,
        coberturaArea: formData.coverageArea,
        permitirNegociacion: formData.allowNegotiation,
        precioMinimo: formData.minNegotiablePrice ? parseFloat(formData.minNegotiablePrice) : null
      });

      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({
        category: 'electricidad',
        title: '',
        description: '',
        price: '',
        priceType: 'fixed',
        tags: '',
        coverageArea: '',
        allowNegotiation: false,
        minNegotiablePrice: ''
      });
      fetchServices();
      alert('Servicio guardado exitosamente');

    } catch (error) {
      console.error(error);
      alert('Error al guardar el servicio');
    }
  };

  const getPriceTypeLabel = (type: ServiceListing['priceType']) => {
    switch (type) {
      case 'fixed': return 'Precio fijo';
      case 'starting-from': return 'Desde';
      case 'per-hour': return 'Por hora';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-6 h-6" />
                Mi Catálogo de Servicios
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los servicios que ofreces a tus clientes
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingService(null);
                    setFormData({
                      category: 'electricidad',
                      title: '',
                      description: '',
                      price: '',
                      priceType: 'fixed',
                      tags: '',
                      coverageArea: '',
                      allowNegotiation: false,
                      minNegotiablePrice: ''
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryNames).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {getCategoryIcon(key as ServiceCategory)} {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Título del Servicio *</Label>
                    <Input
                      placeholder="Ej: Instalación de Breakers y Tableros"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Textarea
                      placeholder="Describe detalladamente tu servicio..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio (USD) *</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Precio *</Label>
                      <Select
                        value={formData.priceType}
                        onValueChange={(value) => setFormData({ ...formData, priceType: value as ServiceListing['priceType'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Precio Fijo</SelectItem>
                          <SelectItem value="starting-from">Desde</SelectItem>
                          <SelectItem value="per-hour">Por Hora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                    <input
                      type="checkbox"
                      id="negotiation"
                      checked={formData.allowNegotiation}
                      onChange={(e) => setFormData({ ...formData, allowNegotiation: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="negotiation" className="flex-1 cursor-pointer">
                      Permitir Negociación
                      <p className="text-xs text-gray-500 font-normal">
                        Los clientes podrán ofertar un precio
                      </p>
                    </Label>
                  </div>

                  {formData.allowNegotiation && (
                    <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                      <Label>Precio Mínimo Aceptable (Auto-rechazar ofertas menores)</Label>
                      <Input
                        type="number"
                        placeholder="45"
                        value={formData.minNegotiablePrice}
                        onChange={(e) => setFormData({ ...formData, minNegotiablePrice: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Etiquetas (separadas por coma)</Label>
                    <Input
                      placeholder="Instalación, Breakers, Certificado"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Áreas de Cobertura (separadas por coma)</Label>
                    <Input
                      placeholder="San Francisco, Punta Pacífica, Obarrio"
                      value={formData.coverageArea}
                      onChange={(e) => setFormData({ ...formData, coverageArea: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{services.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{activeServices.length}</p>
              <p className="text-sm text-gray-600 mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{inactiveServices.length}</p>
              <p className="text-sm text-gray-600 mt-1">Inactivos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Servicios Activos
          </h3>
          {activeServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{getCategoryIcon(service.category)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{service.title}</h4>
                        <Badge variant="secondary" className="mb-2">
                          {categoryNames[service.category]}
                        </Badge>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {service.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          📍 Cobertura: {service.location.coverageArea.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-green-600">
                        ${service.price}
                      </p>
                      <p className="text-xs text-gray-500">{getPriceTypeLabel(service.priceType)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(service.id)}
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Desactivar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-600">
            <XCircle className="w-5 h-5" />
            Servicios Inactivos
          </h3>
          {inactiveServices.map((service) => (
            <Card key={service.id} className="opacity-60 hover:shadow-md transition-shadow border-l-4 border-l-gray-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{getCategoryIcon(service.category)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 text-gray-700">{service.title}</h4>
                        <Badge variant="secondary" className="mb-2">
                          {categoryNames[service.category]}
                        </Badge>
                        <p className="text-gray-500 text-sm">{service.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-3">
                      <p className="text-xl font-bold text-gray-600">
                        ${service.price}
                      </p>
                      <p className="text-xs text-gray-500">{getPriceTypeLabel(service.priceType)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(service.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Activar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
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
      {services.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No tienes servicios publicados</p>
            <p className="text-sm text-gray-400 mb-4">
              Crea tu primer servicio para que los clientes puedan encontrarte
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Servicio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
