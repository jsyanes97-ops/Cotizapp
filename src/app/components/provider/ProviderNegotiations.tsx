import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { providerNegotiationService } from '@/services';
import { MessageSquare, Check, X, ArrowRightLeft, DollarSign } from 'lucide-react';

interface NegotiationItem {
    tipoRelacion: 'Servicio' | 'Producto';
    id: string;
    itemId: string;
    itemTitulo: string;
    clienteNombre: string;
    precioOriginal: number;
    ofertaActual: number;
    ultimoEmisorId: string;
    estado: string; // 'Pendiente', 'Contraoferta', 'Aceptada', 'Rechazada', 'Negociando'
    contadorContraofertas: number;
    fechaActualizacion: string;
}

export function ProviderNegotiations() {
    const [negotiations, setNegotiations] = useState<NegotiationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Counter Offer State
    const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [counterMessage, setCounterMessage] = useState('');

    const fetchNegotiations = async () => {
        try {
            setIsLoading(true);
            const res = await providerNegotiationService.getAll();
            setNegotiations(res.data);
        } catch (error) {
            console.error("Error fetching negotiations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNegotiations();
    }, []);

    const handleRespond = async (negotiation: NegotiationItem, action: 'Aceptar' | 'Rechazar' | 'Contraoferta') => {
        try {
            if (action === 'Contraoferta' && !counterAmount) {
                alert('Por favor ingresa un monto para la contraoferta');
                return;
            }

            const payload = {
                negotiationId: negotiation.id,
                providerId: '', // Filled in service
                type: negotiation.tipoRelacion,
                action: action,
                counterOfferAmount: action === 'Contraoferta' ? parseFloat(counterAmount) : undefined,
                message: action === 'Contraoferta' ? counterMessage : undefined
            };

            await providerNegotiationService.respond(payload);

            alert(`Acción "${action}" realizada exitosamente.`);
            setCounterOfferId(null);
            setCounterAmount('');
            setCounterMessage('');
            fetchNegotiations(); // Refresh list

        } catch (error: any) {
            console.error("Error responding:", error);
            const msg = error.response?.data?.Error || 'Error al procesar la acción';
            alert(`Error: ${msg}`);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando negociaciones...</div>;

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                        <MessageSquare className="w-6 h-6" />
                        Centro de Negociaciones
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                        Gestiona las ofertas de tus clientes. Recuerda que tienes un límite de 2 contraofertas por negociación.
                    </p>
                </CardHeader>
            </Card>

            {negotiations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg custom-dashed-border">
                    <p className="text-gray-500">No tienes negociaciones pendientes.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {negotiations.map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Info Section */}
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.tipoRelacion === 'Servicio' ? 'default' : 'secondary'}>
                                                {item.tipoRelacion}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.fechaActualizacion).toLocaleDateString()}
                                            </span>
                                            <StatusBadge status={item.estado} />
                                        </div>
                                        <h3 className="font-bold text-lg">{item.itemTitulo}</h3>
                                        <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{item.clienteNombre}</span></p>

                                        <div className="flex items-center gap-4 mt-2 bg-gray-50 p-3 rounded-md max-w-md">
                                            <div>
                                                <p className="text-xs text-gray-500">Precio Original</p>
                                                <p className="font-semibold text-gray-400 line-through">${item.precioOriginal}</p>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <ArrowRightLeft className="w-4 h-4 mx-auto text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Oferta del Cliente</p>
                                                <p className="font-bold text-xl text-green-600">${item.ofertaActual}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="flex flex-col justify-center gap-2 min-w-[200px]">
                                        {['Aceptada', 'Rechazada'].includes(item.estado) ? (
                                            <div className="text-center p-2 bg-gray-100 rounded">
                                                <p className="text-sm font-medium text-gray-600">Negociación Finalizada</p>
                                            </div>
                                        ) : (
                                            <>
                                                {counterOfferId === item.id ? (
                                                    <div className="bg-blue-50 p-3 rounded-md space-y-2 animate-in fade-in zoom-in-95">
                                                        <p className="text-sm font-semibold">Tu Contraoferta ({item.contadorContraofertas}/2)</p>
                                                        <Input
                                                            type="number"
                                                            placeholder="Monto"
                                                            value={counterAmount}
                                                            onChange={(e) => setCounterAmount(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <Input
                                                            placeholder="Mensaje (opcional)"
                                                            value={counterMessage}
                                                            onChange={(e) => setCounterMessage(e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => setCounterOfferId(null)}>Cancelar</Button>
                                                            <Button size="sm" onClick={() => handleRespond(item, 'Contraoferta')}>Enviar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleRespond(item, 'Aceptar')}>
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Aceptar Oferta
                                                        </Button>

                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (item.contadorContraofertas >= 2) {
                                                                    alert('Has alcanzado el límite de contraofertas.');
                                                                    return;
                                                                }
                                                                setCounterOfferId(item.id);
                                                                setCounterAmount(''); // Reset
                                                            }}
                                                            disabled={item.contadorContraofertas >= 2}
                                                        >
                                                            <DollarSign className="w-4 h-4 mr-2" />
                                                            Contraoferta {item.contadorContraofertas >= 2 && '(Max)'}
                                                        </Button>

                                                        <Button className="w-full" variant="ghost" onClick={() => handleRespond(item, 'Rechazar')}>
                                                            <X className="w-4 h-4 mr-2" />
                                                            Rechazar
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'Pendiente': 'bg-yellow-100 text-yellow-800',
        'Negociando': 'bg-blue-100 text-blue-800',
        'Contraoferta': 'bg-purple-100 text-purple-800',
        'Aceptada': 'bg-green-100 text-green-800',
        'Rechazada': 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}
