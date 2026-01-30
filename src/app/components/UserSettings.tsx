import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { User, Mail, Phone, MapPin, Lock, Bell, CreditCard, Shield, Save } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { MembershipUpgradeWithLogic } from './provider/MembershipUpgrade';

interface UserSettingsProps {
  userType: 'client' | 'provider';
  currentUser: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    bio?: string;
    isPremium?: boolean;
  };
  onUpdateProfile: (data: any) => void;
  providerId?: string;
}

export function UserSettings({ userType, currentUser, onUpdateProfile, providerId }: UserSettingsProps) {

  // ... (keep state)

  // ... (keep logic)

  {
    userType === 'provider' && (
      <TabsContent value="membership" className="space-y-4 sm:space-y-6">
        <MembershipUpgradeWithLogic
          providerId={providerId || ''}
          isPremium={currentUser.isPremium || false}
        />
      </TabsContent>
    )
  }


  // Profile data
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [location, setLocation] = useState(currentUser.location || 'San Francisco');
  const [bio, setBio] = useState(currentUser.bio || '');

  // Password data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [quoteAlerts, setQuoteAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);

  // Provider specific
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [businessPhone, setBusinessPhone] = useState('');
  const [serviceRadius, setServiceRadius] = useState('10');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveProfile = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || !email) {
      setErrorMessage('Nombre y email son obligatorios');
      return;
    }

    const profileData = {
      name,
      email,
      phone,
      location,
      bio,
      ...(userType === 'provider' && { businessName, businessPhone, serviceRadius })
    };

    onUpdateProfile(profileData);
    setSuccessMessage('¡Perfil actualizado exitosamente!');

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleChangePassword = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Completa todos los campos de contraseña');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    // Mock password change
    console.log('Changing password...');
    setSuccessMessage('¡Contraseña actualizada exitosamente!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveNotifications = () => {
    console.log('Saving notification preferences...');
    setSuccessMessage('¡Preferencias de notificaciones guardadas!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm py-2">Perfil</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm py-2">Seguridad</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm py-2">Notificaciones</TabsTrigger>
          {userType === 'provider' && (
            <TabsTrigger value="membership" className="text-xs sm:text-sm py-2">Membresía</TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Información Personal
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Actualiza tu información de perfil y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="6000-0000"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm">Ubicación</Label>
                  <select
                    id="location"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="San Francisco">San Francisco</option>
                    <option value="Punta Pacífica">Punta Pacífica</option>
                    <option value="Costa del Este">Costa del Este</option>
                    <option value="El Cangrejo">El Cangrejo</option>
                    <option value="Bella Vista">Bella Vista</option>
                    <option value="Marbella">Marbella</option>
                    <option value="Obarrio">Obarrio</option>
                  </select>
                </div>
              </div>

              {userType === 'provider' && (
                <>
                  <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <h3 className="font-medium mb-3 text-sm sm:text-base">Información del Negocio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business-name" className="text-sm">Nombre del Negocio</Label>
                        <Input
                          id="business-name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Mi Empresa S.A."
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business-phone" className="text-sm">Teléfono del Negocio</Label>
                        <Input
                          id="business-phone"
                          type="tel"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="6000-0000"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service-radius" className="text-sm">Radio de Servicio (km)</Label>
                        <Input
                          id="service-radius"
                          type="number"
                          value={serviceRadius}
                          onChange={(e) => setServiceRadius(e.target.value)}
                          placeholder="10"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm">Biografía</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={userType === 'provider'
                    ? "Describe tu negocio y servicios..."
                    : "Cuéntanos un poco sobre ti..."}
                  rows={4}
                  className="text-sm"
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full sm:w-auto text-sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm"
                />
              </div>

              <Button onClick={handleChangePassword} className="w-full sm:w-auto text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Actualizar Contraseña
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Sesiones Activas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Dispositivos desde donde has iniciado sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div>
                  <p className="font-medium text-sm">Chrome - Windows</p>
                  <p className="text-xs sm:text-sm text-gray-600">Panamá, Panamá • Ahora</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Actual
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div>
                  <p className="font-medium text-sm">Safari - iPhone</p>
                  <p className="text-xs sm:text-sm text-gray-600">Panamá, Panamá • Hace 2 horas</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  Cerrar sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configura cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Notificaciones por Email</p>
                    <p className="text-xs sm:text-sm text-gray-600">Recibe actualizaciones por correo electrónico</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Notificaciones SMS</p>
                    <p className="text-xs sm:text-sm text-gray-600">Recibe alertas importantes por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Notificaciones Push</p>
                    <p className="text-xs sm:text-sm text-gray-600">Recibe notificaciones en tu navegador</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>

              <div className="border-t pt-3 sm:pt-4">
                <h3 className="font-medium mb-3 text-sm sm:text-base">Preferencias de Contenido</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Alertas de Cotizaciones</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {userType === 'provider'
                          ? 'Nuevas solicitudes de cotización'
                          : 'Nuevas cotizaciones recibidas'}
                      </p>
                    </div>
                    <Switch
                      checked={quoteAlerts}
                      onCheckedChange={setQuoteAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Promociones y Ofertas</p>
                      <p className="text-xs sm:text-sm text-gray-600">Descuentos y ofertas especiales</p>
                    </div>
                    <Switch
                      checked={promotions}
                      onCheckedChange={setPromotions}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full sm:w-auto text-sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {userType === 'provider' && (
          <TabsContent value="membership" className="space-y-4 sm:space-y-6">
            <MembershipUpgradeWithLogic
              providerId={providerId || ''}
              isPremium={currentUser.isPremium || false}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}