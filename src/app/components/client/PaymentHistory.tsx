import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CreditCard, Calendar, User, Package, Hammer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentRecord {
    id: string;
    date: string;
    amount: number;
    providerName: string;
    itemName: string;
    itemType: 'Producto' | 'Servicio';
    status: string;
}

export function PaymentHistory() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);

    useEffect(() => {
        const loadPayments = () => {
            try {
                const stored = localStorage.getItem('user_payments');
                if (stored) {
                    setPayments(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Error loading payments:', e);
            }
        };

        loadPayments();
        // Add event listener to refresh when localStorage changes (in case modal is in another component)
        window.addEventListener('storage', loadPayments);
        return () => window.removeEventListener('storage', loadPayments);
    }, []);

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border-2 border-dashed">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <CreditCard className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No hay pagos registrados</h3>
                <p className="text-gray-500 max-w-sm mt-2">
                    Aquí aparecerá el historial de tus compras y servicios pagados a través de la plataforma.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Historial de Pagos
                    </CardTitle>
                    <p className="text-sm text-blue-600">
                        Gestiona y revisa todas tus transacciones realizadas.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 italic text-xs text-blue-800">
                        Nota: Esta es una simulación de pagos persistida localmente.
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {payments.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow transition-transform hover:-translate-y-1">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.itemType === 'Producto' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {payment.itemType === 'Producto' ? <Package className="w-6 h-6" /> : <Hammer className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-900">{payment.itemName}</h4>
                                            <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                {payment.itemType}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-gray-600 gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{payment.providerName}</span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-400 gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{format(new Date(payment.date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:justify-start gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${payment.amount.toFixed(2)}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{payment.status}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
