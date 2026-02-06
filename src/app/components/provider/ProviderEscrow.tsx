import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Package, Hammer, CheckCircle2, DollarSign, Clock, ShieldCheck, History as HistoryIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/services/api';

interface PaymentLog {
    id?: string;
    pagoId?: string;
    accion: string;
    mensaje?: string;
    fechaCreacion: string;
}

interface EscrowPayment {
    id: string;
    clienteId: string;
    proveedorId: string;
    monto: number;
    itemName: string;
    itemType: 'Producto' | 'Servicio';
    status: string;
    fechaCreacion: string;
    providerName?: string;
    clientName?: string;
    logs?: PaymentLog[];
}

export function ProviderEscrow() {
    const [payments, setPayments] = useState<EscrowPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const providerId = user?.id || '';

            if (!providerId) {
                const stored = localStorage.getItem('user_payments');
                if (stored) setPayments(JSON.parse(stored));
                setLoading(false);
                return;
            }

            const res = await api.get(`/Payments/provider/${providerId}`);
            const data = Array.isArray(res.data) ? res.data : [];
            const backendPayments = data.map((p: any) => ({
                id: p.id,
                clienteId: p.clienteId,
                proveedorId: p.proveedorId,
                monto: p.monto,
                itemName: p.itemName,
                itemType: p.itemType,
                status: p.status,
                fechaCreacion: p.fechaCreacion,
                clientName: p.clientName
            }));

            const paymentsWithLogs = await Promise.all(
                backendPayments.map(async (p: any) => {
                    try {
                        const logsRes = await api.get(`/Payments/${p.id}/logs`);
                        return { ...p, logs: logsRes.data };
                    } catch (e) {
                        return p;
                    }
                })
            );

            setPayments(paymentsWithLogs);
        } catch (e) {
            console.error('Error loading provider payments:', e);
            const stored = localStorage.getItem('user_payments');
            if (stored) setPayments(JSON.parse(stored));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
        window.addEventListener('storage', loadPayments);
        return () => window.removeEventListener('storage', loadPayments);
    }, []);

    const updatePaymentStatus = async (paymentId: string, newStatus: string, action: string, message?: string) => {
        try {
            setActionLoading(paymentId);
            await api.patch(`/Payments/${paymentId}/status`, {
                NuevoEstado: newStatus,
                Accion: action,
                Mensaje: message
            });
            await loadPayments();
        } catch (e) {
            console.error('Error updating status:', e);
            alert('Error al actualizar el estado');
        } finally {
            setActionLoading(null);
        }
    };

    const markAsDelivered = async (paymentId: string) => {
        await updatePaymentStatus(paymentId, 'Entregado', 'Entregado', 'El proveedor marcó el pedido como enviado/completado');
    };

    const resolveDispute = async (paymentId: string, newStatus: string, message: string) => {
        await updatePaymentStatus(paymentId, newStatus, 'Fallo Arbitraje', message);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Retenido':
                return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Fondos Retenidos', icon: <Clock className="w-4 h-4" /> };
            case 'Entregado':
                return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Esperando Confirmación Cliente', icon: <Package className="w-4 h-4" /> };
            case 'Liberado':
                return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Pago Acreditado', icon: <DollarSign className="w-4 h-4" /> };
            case 'En Disputa':
                return { color: 'bg-red-100 text-red-800 border-red-200', label: 'En Disputa (Bloqueado)', icon: <AlertTriangle className="w-4 h-4" /> };
            case 'Devuelto':
                return { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Reembolsado', icon: <AlertTriangle className="w-4 h-4" /> };
            default:
                return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status, icon: null };
        }
    };

    const safeFormatDate = (dateStr: string, formatStr: string) => {
        try {
            if (!dateStr) return 'Fecha pendiente';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return format(date, formatStr, { locale: es });
        } catch (e) {
            return 'Error en fecha';
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
                {loading ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Cargando ventas...</p>
                        </CardContent>
                    </Card>
                ) : payments.length === 0 ? (
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
                                                        {safeFormatDate(payment.fechaCreacion, "d MMM, HH:mm")}
                                                    </span>
                                                    {payment.clientName && (
                                                        <span className="text-xs text-indigo-600 font-medium ml-2">
                                                            Cliente: {payment.clientName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">${Number(payment.monto).toFixed(2)}</p>
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
                                            {payment.status === 'En Disputa' && (
                                                <div className="flex flex-col gap-2">
                                                    <Badge variant="destructive" className="justify-center">Pago Bloqueado</Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                                                        onClick={() => resolveDispute(payment.id, 'Liberado', 'Resolución Admin: Fondos liberados al proveedor')}
                                                    >
                                                        Simular Resolución Admin (Liberar)
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs border-gray-200 text-gray-700"
                                                        onClick={() => resolveDispute(payment.id, 'Devuelto', 'Resolución Admin: Reembolso al cliente')}
                                                    >
                                                        Simular Resolución Admin (Reembolso)
                                                    </Button>
                                                </div>
                                            )}
                                            {payment.status === 'Liberado' && (
                                                <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Saldo disponible en cuenta
                                                </div>
                                            )}
                                            {payment.status === 'Devuelto' && (
                                                <div className="text-xs text-red-600 flex items-center gap-1 font-medium">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Fondos Reembolsados
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {payment.status === 'En Disputa' && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs">
                                            <p className="font-bold text-red-800 flex items-center gap-1 mb-1">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Detalles de la Disputa:
                                            </p>
                                            <p className="text-red-700 italic">
                                                "{payment.logs?.find(l => l.accion === 'Disputa Abierta')?.mensaje || 'Sin detalles adicionales'}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Timeline / Audit Log */}
                                    {payment.logs && payment.logs.length > 0 && (
                                        <div className="mt-6 border-t pt-4">
                                            <div className="flex items-center gap-2 mb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                <HistoryIcon className="w-3.5 h-3.5" />
                                                Historial de la Transacción
                                            </div>
                                            <div className="space-y-4">
                                                {payment.logs.map((log, idx) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === payment.logs!.length - 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                                            {idx !== payment.logs!.length - 1 && <div className="w-0.5 h-full bg-gray-50 mt-1" />}
                                                        </div>
                                                        <div className="pb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-800">{log.accion}</span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {safeFormatDate(log.fechaCreacion, "HH:mm'h' - d MMM")}
                                                                </span>
                                                            </div>
                                                            {log.mensaje && <p className="text-[10px] text-gray-500 mt-0.5">{log.mensaje}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
