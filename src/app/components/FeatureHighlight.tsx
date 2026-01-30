import { Card } from '@/app/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const clientFeatures: Feature[] = [
  {
    icon: '💬',
    title: 'Chat Inteligente',
    description: 'Describe tu problema en lenguaje natural, sin formularios complicados'
  },
  {
    icon: '⚡',
    title: '10 Minutos',
    description: 'Recibe hasta 5 cotizaciones en tiempo real'
  },
  {
    icon: '💰',
    title: 'Precios Claros',
    description: 'Compara precios, distancia y reputación al instante'
  },
  {
    icon: '⭐',
    title: 'Proveedores Verificados',
    description: 'Calificaciones reales de clientes verificados'
  }
];

const providerFeatures: Feature[] = [
  {
    icon: '🎯',
    title: 'Solicitudes Relevantes',
    description: 'Solo recibes solicitudes cercanas y de tu especialidad'
  },
  {
    icon: '📊',
    title: 'Panel Completo',
    description: 'Gestiona tu perfil, cotizaciones y estadísticas'
  },
  {
    icon: '💵',
    title: 'Desde $5/mes',
    description: '10 solicitudes gratis, luego membresía Premium'
  },
  {
    icon: '🚀',
    title: 'Crece tu Negocio',
    description: 'Accede a clientes que necesitan tus servicios ahora'
  }
];

interface FeatureHighlightProps {
  type: 'client' | 'provider';
}

export function FeatureHighlight({ type }: FeatureHighlightProps) {
  const features = type === 'client' ? clientFeatures : providerFeatures;

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {features.map((feature, index) => (
        <Card key={index} className="p-3 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">{feature.icon}</div>
          <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
          <p className="text-xs text-gray-600">{feature.description}</p>
        </Card>
      ))}
    </div>
  );
}
