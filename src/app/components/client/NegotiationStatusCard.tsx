import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Check, X, RefreshCw, DollarSign } from 'lucide-react';
import { clientNegotiationService } from '@/services';

interface NegotiationContext {
    negociacionId: string;
    tipo: 'Servicio' | 'Producto';
    titulo: string;
    precioOriginal: number;
    ofertaActual: number;
    ultimoEmisorId: string;
    estado: string;
    proveedorId: string;
    clienteId: string;
    contadorContraofertas?: number;
}

interface NegotiationStatusCardProps {
    negotiation: NegotiationContext;
    currentUserId: string;
    onUpdate: () => void;
}

export function NegotiationStatusCard({ negotiation, currentUserId, onUpdate }: NegotiationStatusCardProps) {
    const [isCountering, setIsCountering] = useState(false);
    const [counterAmount, setCounterAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const normalizedLastSender = negotiation.ultimoEmisorId?.toLowerCase();
    const normalizedCurrentUser = currentUserId?.toLowerCase();

    const isClientTurn = normalizedLastSender !== normalizedCurrentUser && negotiation.estado === 'Contraoferta';

    // Check both camelCase and PascalCase to be safe with Dapper/JSON serialization
    const count = (negotiation as any).ContadorContraofertas ?? negotiation.contadorContraofertas ?? 0;
    const limitReached = count >= 3;

    // Status Display Logic
    const getStatusBadge = () => {
        switch (negotiation.estado) {
            case 'Aceptada': return <Badge className="bg-green-500">Oferta Aceptada</Badge>;
            case 'Rechazada': return <Badge variant="destructive">Oferta Rechazada</Badge>;
            case 'Contraoferta': return <Badge className="bg-orange-500">Contraoferta</Badge>;
            case 'Pendiente': return <Badge variant="secondary">Pendiente</Badge>;
            default: return <Badge variant="outline">{negotiation.estado}</Badge>;
        }
    };

    const handleAction = async (action: 'Aceptar' | 'Rechazar' | 'Contraoferta') => {
        if (action === 'Contraoferta' && limitReached) {
            alert('Límite de contraofertas alcanzado.');
            return;
        }
        setLoading(true);
        try {
            await clientNegotiationService.respond({
                negotiationId: negotiation.negociacionId,
                clientId: currentUserId,
                type: negotiation.tipo,
                action: action,
                counterOfferAmount: action === 'Contraoferta' ? parseFloat(counterAmount) : undefined,
                message: action === 'Contraoferta' ? 'Contraoferta enviada desde el chat' : undefined
            });
            setIsCountering(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Error al procesar la acción');
        } finally {
            setLoading(false);
        }
    };

    if (negotiation.estado === 'Aceptada') {
        return (
            <Card className="bg-green-50 border-green-200 mb-4">
                <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="bg-green-100 p-3 rounded-full">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">¡Trato Cerrado!</h3>
                    <p className="text-green-700">Has acordado un precio de <span className="font-bold">${negotiation.ofertaActual}</span></p>
                </CardContent>
            </Card>
        );
    }

    if (negotiation.estado === 'Rechazada') {
        return (
            <Card className="bg-red-50 border-red-200 mb-4">
                <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="bg-red-100 p-3 rounded-full">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800">Negociación Cancelada</h3>
                    <p className="text-red-700">La oferta ha sido rechazada.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-4 border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-semibold text-blue-900">
                            Negociando: {negotiation.titulo}
                        </CardTitle>
                        <p className="text-sm text-blue-600 mt-1">Precio Original: ${negotiation.precioOriginal}</p>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-sm text-gray-500">Oferta Actual</span>
                    <span className="text-xl font-bold text-blue-700">${negotiation.ofertaActual}</span>
                </div>

                {normalizedLastSender !== normalizedCurrentUser && negotiation.estado === 'Contraoferta' && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                        📣 El proveedor te ha enviado esta contraoferta. {limitReached ? 'El límite de ofertas ha sido alcanzado.' : '¿Qué deseas hacer?'}
                    </p>
                )}
                {normalizedLastSender === normalizedCurrentUser && (
                    <p className="text-xs text-gray-500 mt-2">
                        ⏳ Esperando respuesta del proveedor...
                    </p>
                )}
            </CardContent>

            {/* Actions for Client */}
            {isClientTurn && (
                <CardFooter className="flex flex-col gap-2 pt-2">
                    {!isCountering ? (
                        <div className="flex gap-2 w-full">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                                onClick={() => handleAction('Aceptar')}
                                disabled={loading}
                            >
                                <Check className="w-4 h-4 mr-1" /> Aceptar
                            </Button>

                            {limitReached ? (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-200 text-gray-500 cursor-not-allowed"
                                    size="sm"
                                    disabled={true}
                                >
                                    <X className="w-4 h-4 mr-1" /> Límite Alcanzado
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                    size="sm"
                                    onClick={() => setIsCountering(true)}
                                    disabled={loading}
                                >
                                    <RefreshCw className="w-4 h-4 mr-1" /> Contraofertar
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                className="px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
                                size="sm"
                                onClick={() => handleAction('Rechazar')}
                                disabled={loading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full space-y-2 bg-white p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Tu Contraoferta:</span>
                                <div className="relative flex-1">
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        placeholder="Monto"
                                        className="pl-8 h-9"
                                        value={counterAmount}
                                        onChange={(e) => setCounterAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => setIsCountering(false)}>Cancelar</Button>
                                <Button
                                    size="sm"
                                    className="bg-blue-600"
                                    onClick={() => handleAction('Contraoferta')}
                                    disabled={!counterAmount || loading}
                                >
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
