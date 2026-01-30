import { ServiceCategory, GuidedQuestion } from '@/types';

export interface CategoryConfig {
  id: ServiceCategory;
  name: string;
  icon: string;
  keywords: string[];
  guidedQuestions: GuidedQuestion[];
}

export const categories: CategoryConfig[] = [
  {
    id: 'plomeria',
    name: 'Plomería',
    icon: '🔧',
    keywords: ['fuga', 'tuberia', 'agua', 'lavaplatos', 'inodoro', 'ducha', 'cañeria', 'desague', 'plomero'],
    guidedQuestions: [
      {
        id: 'plumbing-type',
        question: '¿Qué tipo de problema es?',
        type: 'choice',
        options: ['Fuga de agua', 'Instalación nueva', 'Reparación', 'Desatasco', 'Otro'],
        required: true
      },
      {
        id: 'plumbing-urgency',
        question: '¿Es una emergencia?',
        type: 'choice',
        options: ['Sí, es urgente', 'No es urgente'],
        required: true
      },
      {
        id: 'plumbing-photo',
        question: '¿Puedes compartir una foto del problema?',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    id: 'electricidad',
    name: 'Electricidad',
    icon: '⚡',
    keywords: ['luz', 'corte', 'interruptor', 'enchufe', 'lampara', 'cable', 'electricista', 'breaker', 'apagon'],
    guidedQuestions: [
      {
        id: 'electric-type',
        question: '¿Qué necesitas?',
        type: 'choice',
        options: ['Reparación', 'Instalación', 'Revisión/Diagnóstico', 'Emergencia'],
        required: true
      },
      {
        id: 'electric-urgency',
        question: '¿Hay corte de luz o riesgo eléctrico?',
        type: 'choice',
        options: ['Sí, sin luz', 'Hay chispas/olor quemado', 'No, funciona pero necesito ayuda'],
        required: true
      },
      {
        id: 'electric-photo',
        question: 'Foto del problema (opcional)',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    id: 'aire-acondicionado',
    name: 'Aire Acondicionado',
    icon: '❄️',
    keywords: ['ac', 'aire', 'acondicionado', 'frio', 'calor', 'clima', 'split', 'ventana', 'mantenimiento'],
    guidedQuestions: [
      {
        id: 'ac-issue',
        question: '¿Qué pasa con el aire?',
        type: 'choice',
        options: ['No enfría', 'No enciende', 'Gotea agua', 'Hace ruido', 'Mantenimiento preventivo'],
        required: true
      },
      {
        id: 'ac-brand',
        question: '¿Sabes la marca/modelo?',
        type: 'text',
        required: false
      },
      {
        id: 'ac-photo',
        question: 'Foto del equipo (opcional)',
        type: 'photo',
        required: false
      }
    ]
  },
  {
    id: 'cerrajeria',
    name: 'Cerrajería',
    icon: '🔑',
    keywords: ['llave', 'cerradura', 'puerta', 'cerrado', 'abierto', 'cerrajero', 'candado', 'trancado'],
    guidedQuestions: [
      {
        id: 'locksmith-issue',
        question: '¿Qué necesitas?',
        type: 'choice',
        options: ['Quedé afuera (emergencia)', 'Cambio de cerradura', 'Llave adicional', 'Reparación'],
        required: true
      },
      {
        id: 'locksmith-location-type',
        question: '¿Dónde está?',
        type: 'choice',
        options: ['Casa', 'Apartamento', 'Oficina', 'Carro'],
        required: true
      }
    ]
  },
  {
    id: 'limpieza',
    name: 'Limpieza',
    icon: '🧹',
    keywords: ['limpieza', 'limpiar', 'aseo', 'deep cleaning', 'casa', 'oficina', 'mudanza'],
    guidedQuestions: [
      {
        id: 'cleaning-type',
        question: '¿Qué tipo de limpieza necesitas?',
        type: 'choice',
        options: ['Limpieza regular', 'Limpieza profunda', 'Post-mudanza', 'Oficina'],
        required: true
      },
      {
        id: 'cleaning-size',
        question: '¿Qué tamaño tiene el espacio?',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'electrodomesticos',
    name: 'Reparación de Electrodomésticos',
    icon: '🔌',
    keywords: ['nevera', 'refrigerador', 'lavadora', 'secadora', 'microondas', 'estufa', 'horno', 'lavavajillas'],
    guidedQuestions: [
      {
        id: 'appliance-type',
        question: '¿Qué electrodoméstico?',
        type: 'choice',
        options: ['Nevera/Refrigerador', 'Lavadora', 'Secadora', 'Estufa/Horno', 'Microondas', 'Otro'],
        required: true
      },
      {
        id: 'appliance-issue',
        question: '¿Qué problema tiene?',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'pintura',
    name: 'Pintura',
    icon: '🎨',
    keywords: ['pintar', 'pintura', 'pared', 'color', 'repintar', 'pintado'],
    guidedQuestions: [
      {
        id: 'painting-scope',
        question: '¿Qué quieres pintar?',
        type: 'choice',
        options: ['Cuarto', 'Apartamento completo', 'Casa completa', 'Oficina', 'Solo una pared'],
        required: true
      },
      {
        id: 'painting-area',
        question: '¿Aproximadamente cuántos m²?',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'carpinteria',
    name: 'Carpintería',
    icon: '🪚',
    keywords: ['madera', 'mueble', 'puerta', 'carpintero', 'closet', 'gabinete', 'mesa', 'silla'],
    guidedQuestions: [
      {
        id: 'carpentry-type',
        question: '¿Qué necesitas?',
        type: 'choice',
        options: ['Reparación', 'Mueble nuevo', 'Instalación', 'Modificación'],
        required: true
      },
      {
        id: 'carpentry-details',
        question: 'Describe qué necesitas',
        type: 'text',
        required: true
      }
    ]
  }
];

export function detectCategory(text: string): ServiceCategory | null {
  const lowerText = text.toLowerCase();
  
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword)) {
        return category.id;
      }
    }
  }
  
  return null;
}

export function getCategoryConfig(categoryId: ServiceCategory): CategoryConfig | undefined {
  return categories.find(c => c.id === categoryId);
}
