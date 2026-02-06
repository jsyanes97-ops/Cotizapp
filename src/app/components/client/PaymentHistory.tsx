import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { CreditCard, Calendar, User, Package, Hammer, CheckCircle2, AlertTriangle, MessageSquare, History as HistoryIcon, Clock } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentLog {
    date: string;
    action: string;
    message?: string;
}

interface PaymentRecord {
    id: string;
    date: string;
    amount: number;
    providerName: string;
    itemName: string;
    itemType: 'Producto' | 'Servicio';
    status: string;
    logs?: PaymentLog[];
}

export function PaymentHistory() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');

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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Retenido':
                return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'En Garantía (Retenido)' };
            case 'Entregado':
                return { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Entregado (Pendiente Liberar)' };
            case 'Liberado':
                return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Pago Liberado' };
            case 'En Disputa':
                return { color: 'bg-red-50 text-red-700 border-red-200', label: 'En Disputa' };
            default:
                return { color: 'bg-gray-50 text-gray-700 border-gray-200', label: status };
        }
    };

    const openDispute = () => {
        if (!selectedPayment || !disputeReason) return;

        try {
            const stored = localStorage.getItem('user_payments');
            if (stored) {
                const all: PaymentRecord[] = JSON.parse(stored);
                const updated = all.map(p =>
                    p.id === selectedPayment ? {
                        ...p,
                        status: 'En Disputa',
                        logs: [...(p.logs || []), {
                            date: new Date().toISOString(),
                            action: 'Disputa Abierta',
                            message: `Motivo: ${disputeReason}`
                        }]
                    } : p
                );
                localStorage.setItem('user_payments', JSON.stringify(updated));
                setPayments(updated);
                window.dispatchEvent(new Event('storage'));
                setDisputeOpen(false);
                setDisputeReason('');
            }
        } catch (e) {
            console.error('Error opening dispute:', e);
        }
    };

    const releaseFunds = (paymentId: string) => {
        try {
            const stored = localStorage.getItem('user_payments');
            if (stored) {
                const allPayments: PaymentRecord[] = JSON.parse(stored);
                const updated = allPayments.map(p =>
                    p.id === paymentId ? {
                        ...p,
                        status: 'Liberado',
                        logs: [...(p.logs || []), { date: new Date().toISOString(), action: 'Fondos Liberados', message: 'El cliente confirmó la recepción' }]
                    } : p
                );
                localStorage.setItem('user_payments', JSON.stringify(updated));
                setPayments(updated);
                // Trigger storage event for other components
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Error releasing funds:', e);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Historial de Pagos y Escrow
                    </CardTitle>
                    <p className="text-sm text-blue-600">
                        Los fondos se retienen hasta que confirmes la recepción del pedido.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 italic text-xs text-blue-800">
                        Sistema de Protección: El vendedor solo recibe el dinero cuando liberas los fondos.
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {payments.map((payment) => {
                    const statusCfg = getStatusConfig(payment.status);
                    return (
                        <Card key={payment.id} className="hover:shadow-md transition-shadow">
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
                                    <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                                        <p className="text-2xl font-bold text-gray-900">
                                            ${payment.amount.toFixed(2)}
                                        </p>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                                            {payment.status === 'Liberado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            <span>{statusCfg.label}</span>
                                        </div>
                                        {payment.status === 'Entregado' && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                                onClick={() => releaseFunds(payment.id)}
                                            >
                                                Liberar Fondos
                                            </Button>
                                        )}
                                        {payment.status !== 'Liberado' && payment.status !== 'En Disputa' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px]"
                                                onClick={() => {
                                                    setSelectedPayment(payment.id);
                                                    setDisputeOpen(true);
                                                }}
                                            >
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Reportar Problema
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline / Audit Log */}
                                {payment.logs && payment.logs.length > 0 && (
                                    <div className="mt-6 border-t pt-4">
                                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <HistoryIcon className="w-3.5 h-3.5" />
                                            Registro de Auditoría
                                        </div>
                                        <div className="space-y-4">
                                            {payment.logs.map((log, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === payment.logs!.length - 1 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-300'}`} />
                                                        {idx !== payment.logs!.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-1" />}
                                                    </div>
                                                    <div className="pb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-900">{log.action}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {format(new Date(log.date), "HH:mm'h' - d MMM", { locale: es })}
                                                            </span>
                                                        </div>
                                                        {log.message && <p className="text-xs text-gray-500 mt-0.5">{log.message}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Reportar problema con el servicio
                        </DialogTitle>
                        <DialogDescription>
                            Si tienes algún problema con el servicio o producto recibido, puedes abrir una disputa. Los fondos permanecerán retenidos hasta que se resuelva.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Motivo del reporte</Label>
                            <Textarea
                                id="reason"
                                placeholder="Describe el problema detalladamente..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg flex gap-3">
                            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <p className="text-xs text-amber-800">
                                Nuestro equipo de soporte revisará el caso si no llegas a un acuerdo con el proveedor en las próximas 48 horas.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={openDispute} disabled={!disputeReason}>
                            Abrir Disputa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
