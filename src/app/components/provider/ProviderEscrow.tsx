import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Package, Hammer, CheckCircle2, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EscrowPayment {
    id: string;
    date: string;
    amount: number;
    providerName: string;
    itemName: string;
    itemType: 'Producto' | 'Servicio';
    status: string;
}

export function ProviderEscrow() {
    const [payments, setPayments] = useState<EscrowPayment[]>([]);

    useEffect(() => {
        const loadPayments = () => {
            try {
                const stored = localStorage.getItem('user_payments');
                if (stored) {
                    setPayments(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Error loading escrow payments:', e);
            }
        };

        loadPayments();
        window.addEventListener('storage', loadPayments);
        return () => window.removeEventListener('storage', loadPayments);
    }, []);

    const markAsDelivered = (paymentId: string) => {
        try {
            const stored = localStorage.getItem('user_payments');
            if (stored) {
                const all: EscrowPayment[] = JSON.parse(stored);
                const updated = all.map(p =>
                    p.id === paymentId ? { ...p, status: 'Entregado' } : p
                );
                localStorage.setItem('user_payments', JSON.stringify(updated));
                setPayments(updated);
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Error marking as delivered:', e);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Retenido':
                return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Fondos Retenidos', icon: <Clock className="w-4 h-4" /> };
            case 'Entregado':
                return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Esperando Confirmación Cliente', icon: <Package className="w-4 h-4" /> };
            case 'Liberado':
                return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Pago Acreditado', icon: <DollarSign className="w-4 h-4" /> };
            default:
                return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status, icon: null };
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-none">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">Garantía y Pagos (Escrow)</CardTitle>
                    </div>
                    <p className="text-indigo-100 text-sm">
                        Gestiona tus ventas y entregas. Los fondos se liberan cuando el cliente confirma la recepción.
                    </p>
                </CardHeader>
            </Card>

            <div className="grid gap-4">
                {payments.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-12 text-center text-gray-500">
                            No tienes ventas registradas bajo el sistema de garantía aún.
                        </CardContent>
                    </Card>
                ) : (
                    payments.map((payment) => {
                        const info = getStatusInfo(payment.status);
                        return (
                            <Card key={payment.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.itemType === 'Producto' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {payment.itemType === 'Producto' ? <Package className="w-6 h-6" /> : <Hammer className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{payment.itemName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] py-0">{payment.itemType}</Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(payment.date), "d MMM, HH:mm", { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">${payment.amount.toFixed(2)}</p>
                                                <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.color}`}>
                                                    {info.icon}
                                                    {info.label}
                                                </div>
                                            </div>

                                            {payment.status === 'Retenido' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    onClick={() => markAsDelivered(payment.id)}
                                                >
                                                    Marcar como Entregado
                                                </Button>
                                            )}
                                            {payment.status === 'Liberado' && (
                                                <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Saldo disponible en cuenta
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
