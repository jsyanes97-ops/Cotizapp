import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Provider } from '@/types';
import { User, MapPin, Phone, Briefcase, CreditCard, CheckCircle, Settings } from 'lucide-react';
import { categories } from '@/data/categories';
import { providerProfileService } from '@/services';

interface ProviderProfileProps {
  provider: Provider; // Keep this prop for initial render if needed, but we fetch fresh data
}

export function ProviderProfile({ provider }: ProviderProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: provider.name,
    phone: provider.phone,
    services: provider.services.join(', '),
    coverageRadius: provider.coverageRadius,
    location: provider.location.address,
    description: '', // Add this
    district: provider.location.district // Add this
  });

  const fetchProfile = async () => {
    try {
      const { data } = await providerProfileService.getProfile();
      setProfileData({
        name: data.nombre,
        phone: data.telefono || '',
        services: data.categoria || '', // Mapping main category here mostly as placeholder or description
        description: data.descripcion || '',
        coverageRadius: data.radioCoberturaKM || 10,
        location: data.ubicacionDistrito || 'Panamá', // Simplified address
        district: data.ubicacionDistrito || 'Panamá'
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      // Send keys matching Spanish DTO
      await providerProfileService.updateProfile({
        nombre: profileData.name,
        telefono: profileData.phone,
        categoria: provider.category,
        descripcion: profileData.description,
        radioCoberturaKM: profileData.coverageRadius,
        ubicacionLat: 0, // Mock for now
        ubicacionLng: 0, // Mock for now
        ubicacionDistrito: profileData.district
      });
      alert('✅ Perfil actualizado exitosamente');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar perfil');
    }
  };

  const categoryConfig = categories.find(c => c.id === provider.category);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mi Perfil</h2>
          <p className="text-gray-600 mt-1">Gestiona tu información y configuración</p>
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Editar Perfil
            </>
          )}
        </Button>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Negocio</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoría Principal</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {categoryConfig?.icon} {categoryConfig?.name}
              </Badge>
              {isEditing && (
                <span className="text-sm text-gray-500">(Contacta soporte para cambiar)</span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="services">Descripción del Negocio</Label>
            <Textarea
              id="description"
              value={profileData.description}
              onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
              disabled={!isEditing}
              placeholder="Describe tu experiencia y servicios..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ubicación y cobertura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Ubicación y Cobertura
          </CardTitle>
          <CardDescription>
            Define tu ubicación base y el área donde ofreces servicios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="location">Ubicación Base</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              disabled={!isEditing}
              placeholder="Ej: Calle 50, Obarrio"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="radius">Radio de Cobertura (km)</Label>
            <div className="flex items-center gap-4 mt-1">
              <Input
                id="radius"
                type="number"
                value={profileData.coverageRadius}
                onChange={(e) => setProfileData({ ...profileData, coverageRadius: Number(e.target.value) })}
                disabled={!isEditing}
                className="w-32"
              />
              <span className="text-sm text-gray-600">
                Recibirás solicitudes hasta {profileData.coverageRadius} km de tu ubicación
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Aumentar tu radio de cobertura te da acceso a más solicitudes, pero considera los costos de transporte
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Membresía */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Membresía y Facturación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-lg">
                  {provider.membershipStatus === 'paid' ? 'Plan Premium' : 'Plan Gratuito'}
                </p>
                <Badge className={provider.membershipStatus === 'paid' ? 'bg-green-600' : 'bg-gray-600'}>
                  {provider.membershipStatus === 'paid' ? 'Activo' : 'Free'}
                </Badge>
              </div>
              {provider.membershipStatus === 'free' ? (
                <p className="text-sm text-gray-600">
                  {provider.requestsThisMonth}/{provider.freeRequestsLimit} solicitudes gratis usadas este mes
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Solicitudes ilimitadas • Próximo cobro: 26 de febrero
                </p>
              )}
            </div>

            {provider.membershipStatus === 'free' && (
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Actualizar a Premium - $5/mes
              </Button>
            )}
          </div>

          {provider.membershipStatus === 'paid' && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Beneficios Premium:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Solicitudes ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Prioridad en resultados</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Badge Premium visible</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Estadísticas avanzadas</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Gestiona cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nuevas solicitudes</p>
              <p className="text-sm text-gray-600">Recibir notificación inmediata</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recordatorios de solicitudes</p>
              <p className="text-sm text-gray-600">Cuando quedan 5 minutos para responder</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mensajes de clientes</p>
              <p className="text-sm text-gray-600">Cuando un cliente te envía un mensaje</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reseñas nuevas</p>
              <p className="text-sm text-gray-600">Cuando recibes una calificación</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
