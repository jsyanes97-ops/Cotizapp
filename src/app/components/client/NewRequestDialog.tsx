import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { requestService } from '@/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface NewRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    "Plomería", "Electricidad", "Limpieza", "Jardinería", "Construcción",
    "Pintura", "Carpintería", "Cerrajería", "Mudanza", "Tecnología",
    "Mecánica", "Belleza", "Educación", "Eventos", "Otros"
];

const PRIORITIES = [
    { value: 'Normal', label: 'Normal' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Urgente', label: 'Urgente' }
];

export function NewRequestDialog({ open, onOpenChange, onSuccess }: NewRequestDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        priority: 'Normal',
        location: { lat: 0, lng: 0, address: 'Ciudad de Panamá', district: 'Centro' }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await requestService.create({
                providerId: undefined, // Broadcast request
                serviceId: undefined,
                category: formData.category as any,
                description: formData.description,
                title: formData.title,
                priority: formData.priority as any,
                location: formData.location
            });
            onSuccess();
            onOpenChange(false);
            // Reset form
            setFormData({
                title: '',
                category: '',
                description: '',
                priority: 'Normal',
                location: { lat: 0, lng: 0, address: 'Ciudad de Panamá', district: 'Centro' }
            });
        } catch (error) {
            console.error('Failed to create request', error);
            // Ideally show toast error here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Solicitud de Servicio</DialogTitle>
                    <DialogDescription>
                        Publica tu solicitud para que todos los proveedores disponibles puedan verla.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            placeholder="Ej: Reparación de tubería en cocina"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción detallada</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe el problema o lo que necesitas..."
                            className="min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? 'Publicando...' : 'Publicar Solicitud'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
