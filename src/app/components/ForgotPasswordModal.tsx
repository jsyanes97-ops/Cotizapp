import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

type Step = 'email' | 'success';

export function ForgotPasswordModal({ open, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setIsLoading(true);

    // Mock API call - en producción esto enviaría un email real
    setTimeout(() => {
      console.log('Sending password reset email to:', email);
      setIsLoading(false);
      setStep('success');
    }, 1500);
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setError('');
    onClose();
  };

  const handleBackToLogin = () => {
    handleClose();
    onBackToLogin();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'email' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Recuperar Contraseña</DialogTitle>
              <DialogDescription className="text-sm">
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full text-sm sm:text-base" size="lg" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Iniciar Sesión
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-xl sm:text-2xl text-center">¡Email Enviado!</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Hemos enviado las instrucciones de recuperación a:
                <div className="font-medium text-gray-900 mt-2 break-all">{email}</div>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg text-xs sm:text-sm text-blue-800">
                <p className="font-medium mb-1">Revisa tu bandeja de entrada</p>
                <p>El email puede tardar unos minutos en llegar. Si no lo ves, revisa tu carpeta de spam.</p>
              </div>

              <Button
                className="w-full text-sm sm:text-base"
                size="lg"
                onClick={handleBackToLogin}
              >
                Volver a Iniciar Sesión
              </Button>

              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setStep('email')}
              >
                Intentar con otro email
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}