import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { CreditCard, Loader2, CheckCircle, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    onSuccess: () => void;
    providerName?: string;
    itemName?: string;
    itemType?: 'Producto' | 'Servicio';
}

export function PaymentModal({ open, onOpenChange, amount, onSuccess, providerName, itemName, itemType }: PaymentModalProps) {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setStep('form');
            setCardData({ number: '', expiry: '', cvv: '', name: '' });
        }
    }, [open]);

    const savePaymentToHistory = () => {
        try {
            const existingPayments = JSON.parse(localStorage.getItem('user_payments') || '[]');
            const newPayment = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                amount,
                providerName: providerName || 'Proveedor',
                itemName: itemName || 'Concepto General',
                itemType: itemType || 'Servicio',
                status: 'Retenido',
                logs: [
                    { date: new Date().toISOString(), action: 'Pago Realizado', message: 'Fondos retenidos en garantía' }
                ]
            };
            localStorage.setItem('user_payments', JSON.stringify([newPayment, ...existingPayments]));
        } catch (e) {
            console.error('Error saving payment to history:', e);
        }
    };

    const handleProcessPayment = () => {
        // Basic validation simulation
        if (!cardData.number || !cardData.cvv || !cardData.name) {
            return;
        }

        setStep('processing');

        // Simulate API call delay
        setTimeout(() => {
            savePaymentToHistory();
            setStep('success');

            // Close after showing success for a moment
            setTimeout(() => {
                onSuccess();
                onOpenChange(false);
            }, 1500);
        }, 2500);
    };

    const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        val = val.substring(0, 16);
        val = val.replace(/(\d{4})/g, '$1 ').trim();
        setCardData({ ...cardData, number: val });
    };

    const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setCardData({ ...cardData, expiry: val });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <AnimatePresence mode="wait">
                    {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DialogHeader>
                                <div className="mx-auto bg-blue-100 p-3 rounded-full mb-2">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <DialogTitle className="text-center">Confirmar Pago</DialogTitle>
                                <DialogDescription className="text-center">
                                    Estás a punto de pagar <span className="font-bold text-gray-900">${amount.toFixed(2)}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre en la tarjeta</Label>
                                    <Input
                                        id="name"
                                        placeholder="Juan Pérez"
                                        value={cardData.name}
                                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="number">Número de tarjeta</Label>
                                    <div className="relative">
                                        <Input
                                            id="number"
                                            placeholder="0000 0000 0000 0000"
                                            className="pl-10"
                                            value={cardData.number}
                                            onChange={handleFormatCardNumber}
                                            maxLength={19}
                                        />
                                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="expiry">Expiración</Label>
                                        <Input
                                            id="expiry"
                                            placeholder="MM/YY"
                                            value={cardData.expiry}
                                            onChange={handleFormatExpiry}
                                            maxLength={5}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cvv">CVV</Label>
                                        <div className="relative">
                                            <Input
                                                id="cvv"
                                                type="password"
                                                placeholder="123"
                                                className="pl-8"
                                                value={cardData.cvv}
                                                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                                                maxLength={4}
                                            />
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                <span>Pagos seguros y encriptados. No guardamos tu tarjeta.</span>
                            </div>

                            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                                <Button onClick={handleProcessPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Pagar ${amount.toFixed(2)}
                                </Button>
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                                    Cancelar
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-10 text-center"
                        >
                            <div className="flex justify-center mb-4">
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Procesando Pago...</h3>
                            <p className="text-gray-500 text-sm">Por favor no cierres esta ventana</p>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-10 text-center"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-green-700 mb-1">¡Pago Exitoso!</h3>
                            <p className="text-gray-500 text-sm">Tu servicio ha sido confirmado.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
