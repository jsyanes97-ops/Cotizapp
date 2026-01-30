import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { User, Mail, Lock, Phone, MapPin, UserCircle2 } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (userData: RegisterData) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location: string;
  userType: 'client' | 'provider';
}

export function AuthModal({ open, onClose, onLogin, onRegister }: AuthModalProps) {
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: 'San Francisco',
    userType: 'client'
  });
  const [registerError, setRegisterError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    if (!loginEmail.includes('@')) {
      setLoginError('Email inválido');
      return;
    }

    onLogin(loginEmail, loginPassword);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Validaciones
    if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
      setRegisterError('Por favor completa todos los campos');
      return;
    }

    if (!registerData.email.includes('@')) {
      setRegisterError('Email inválido');
      return;
    }

    if (registerData.phone.length < 8) {
      setRegisterError('Teléfono inválido');
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }

    onRegister(registerData);
  };

  const handleRegisterChange = (field: keyof RegisterData, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  const handleForgotPasswordClick = () => {
    onClose();
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    // Small delay to allow the forgot password modal to close
    setTimeout(() => {
      onClose();
      // Re-open the auth modal after a brief moment
      setTimeout(() => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }, 100);
    }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-center">Bienvenido a Cotizaciones PTY</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Inicia sesión o crea una cuenta para comenzar
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="text-sm">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register" className="text-sm">Registrarse</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-3 sm:space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 text-sm"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 text-sm"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
                    {loginError}
                  </div>
                )}

                <Button type="submit" className="w-full text-sm sm:text-base" size="lg">
                  Iniciar Sesión
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-blue-600 hover:underline"
                    onClick={handleForgotPasswordClick}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-3 sm:space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de Usuario</Label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleRegisterChange('userType', 'client')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        registerData.userType === 'client'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-blue-600" />
                      <div className="font-semibold text-xs sm:text-sm">Cliente</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Buscar servicios</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterChange('userType', 'provider')}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        registerData.userType === 'provider'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-green-600" />
                      <div className="font-semibold text-xs sm:text-sm">Proveedor</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Ofrecer servicios</div>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-sm">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      className="pl-10 text-sm"
                      value={registerData.name}
                      onChange={(e) => handleRegisterChange('name', e.target.value)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 text-sm"
                      value={registerData.email}
                      onChange={(e) => handleRegisterChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-sm">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="6000-0000"
                      className="pl-10 text-sm"
                      value={registerData.phone}
                      onChange={(e) => handleRegisterChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="register-location" className="text-sm">Ubicación</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="register-location"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={registerData.location}
                      onChange={(e) => handleRegisterChange('location', e.target.value)}
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

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 text-sm"
                      value={registerData.password}
                      onChange={(e) => handleRegisterChange('password', e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-sm">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Confirma tu contraseña"
                      className="pl-10 text-sm"
                      value={registerData.confirmPassword}
                      onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>

                {registerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
                    {registerError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full text-sm sm:text-base" 
                  size="lg"
                  variant={registerData.userType === 'provider' ? 'default' : 'default'}
                >
                  Crear Cuenta
                </Button>

                <p className="text-[10px] sm:text-xs text-center text-gray-600">
                  Al registrarte, aceptas nuestros{' '}
                  <button type="button" className="text-blue-600 hover:underline">
                    Términos y Condiciones
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={handleBackToLogin}
      />
    </>
  );
}