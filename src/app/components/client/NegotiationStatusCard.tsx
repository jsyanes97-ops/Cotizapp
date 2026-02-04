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
    esNegociable?: boolean;
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

    // Standardize properties to handle both PascalCase (backend) and camelCase (frontend)
    const neg = negotiation as any;
    const estado = (neg.Estado ?? neg.estado ?? "").toString().trim();
    const ultimoEmisorId = neg.UltimoEmisorId ?? neg.ultimoEmisorId;
    const normalizedLastSender = ultimoEmisorId?.toLowerCase();
    const normalizedCurrentUser = currentUserId?.toLowerCase();

    // Client turn logic: 
    // 1. It's the client's turn if they are NOT the last person who sent an offer/quote.
    // 2. AND the state is 'Pendiente' (first offer) or 'Contraoferta' (provider counter-offer).
    // Note: We use .toLowerCase() and .trim() to avoid any string mismatch issues.
    const isClientTurn =
        normalizedCurrentUser &&
        normalizedLastSender &&
        normalizedLastSender !== normalizedCurrentUser &&
        (estado.toLowerCase() === 'contraoferta' || estado.toLowerCase() === 'pendiente');

    // Check both camelCase and PascalCase to be safe with Dapper/JSON serialization
    const count = neg.ContadorContraofertas ?? neg.contadorContraofertas ?? 0;
    const limitReached = count >= 10;
    const isNegotiable = neg.EsNegociable ?? neg.esNegociable ?? true;

    console.log('[NegotiationStatusCard] Render details:', {
        estado,
        ultimoEmisorId,
        currentUserId,
        isClientTurn,
        isNegotiable
    });

    // Status Display Logic
    const getStatusBadge = () => {
        const est = estado.toLowerCase();
        if (est === 'aceptada') return <Badge className="bg-green-500">Oferta Aceptada</Badge>;
        if (est === 'rechazada') return <Badge variant="destructive">Oferta Rechazada</Badge>;
        if (est === 'contraoferta') return <Badge className="bg-orange-500">Contraoferta</Badge>;
        if (est === 'pendiente') return <Badge variant="secondary">Pendiente</Badge>;
        return <Badge variant="outline">{estado}</Badge>;
    };

    const handleAction = async (action: 'Aceptar' | 'Rechazar' | 'Contraoferta') => {
        if (action === 'Contraoferta' && limitReached) {
            alert('Límite de contraofertas alcanzado.');
            return;
        }
        setLoading(true);
        try {
            await clientNegotiationService.respond({
                negotiationId: neg.NegociacionId ?? neg.negociacionId,
                clientId: currentUserId,
                type: neg.Tipo ?? neg.tipo,
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

    if (estado.toLowerCase() === 'aceptada') {
        return (
            <Card className="bg-green-50 border-green-200 mb-4">
                <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="bg-green-100 p-3 rounded-full">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">¡Trato Cerrado!</h3>
                    <p className="text-green-700">Has acordado un precio de <span className="font-bold">${neg.OfertaActual ?? neg.ofertaActual}</span></p>
                </CardContent>
            </Card>
        );
    }

    if (estado.toLowerCase() === 'rechazada') {
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
                            Negociando: {neg.Titulo ?? neg.titulo}
                        </CardTitle>
                        <p className="text-sm text-blue-600 mt-1">Precio Original: ${neg.PrecioOriginal ?? neg.precioOriginal}</p>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-sm text-gray-500">Oferta Actual</span>
                    <span className="text-xl font-bold text-blue-700">${neg.OfertaActual ?? neg.ofertaActual}</span>
                </div>

                {normalizedLastSender !== normalizedCurrentUser && (estado.toLowerCase() === 'contraoferta' || estado.toLowerCase() === 'pendiente') && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                        📣 El proveedor te ha enviado esta cotización/oferta. {limitReached ? 'El límite de ofertas ha sido alcanzado.' : '¿Qué deseas hacer?'}
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
                <CardFooter className="flex flex-col gap-1 pt-2">
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

                            {isNegotiable ? (
                                limitReached ? (
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
                                )
                            ) : null}

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
