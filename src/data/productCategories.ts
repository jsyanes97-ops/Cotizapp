import { ProductCategory, GuidedQuestion } from '@/types';

export interface ProductCategoryConfig {
  id: ProductCategory;
  name: string;
  icon: string;
  keywords: string[];
  guidedQuestions: GuidedQuestion[];
}

export const productCategories: ProductCategoryConfig[] = [
  {
    id: 'videojuegos',
    name: 'Videojuegos',
    icon: '🎮',
    keywords: [
      'ps5', 'ps4', 'playstation', 'xbox', 'nintendo', 'switch', 
      'control', 'controles', 'dualsense', 'joystick', 'mando', 'mandos',
      'fifa', 'gta', 'call of duty', 'juego', 'videojuego', 'consola',
      'headset', 'auriculares gaming'
    ],
    guidedQuestions: [
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto aproximado? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'electronica',
    name: 'Electrónica',
    icon: '📱',
    keywords: [
      'celular', 'telefono', 'smartphone', 'iphone', 'samsung', 'android',
      'tablet', 'ipad', 
      'audifonos', 'auriculares', 'airpods', 'earbuds',
      'cargador', 'cable', 'usb', 'hdmi',
      'bocina', 'parlante', 'speaker', 'bluetooth',
      'smartwatch', 'reloj inteligente'
    ],
    guidedQuestions: [
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto aproximado? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'computadoras',
    name: 'Computadoras',
    icon: '💻',
    keywords: [
      'laptop', 'computadora', 'pc', 'desktop', 'macbook', 'imac',
      'mouse', 'raton', 'teclado', 'keyboard',
      'monitor', 'pantalla', 'webcam', 'camara web',
      'disco duro', 'ssd', 'ram', 'memoria',
      'impresora', 'escaner'
    ],
    guidedQuestions: [
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto aproximado? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'hogar',
    name: 'Hogar',
    icon: '🏠',
    keywords: [
      'refrigerador', 'nevera', 'refrigeradora',
      'lavadora', 'secadora',
      'microondas', 'horno',
      'licuadora', 'batidora',
      'cafetera', 'tostadora',
      'plancha', 'aspiradora',
      'ventilador', 'abanico'
    ],
    guidedQuestions: [
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'herramientas',
    name: 'Herramientas',
    icon: '🔧',
    keywords: [
      'taladro', 'destornillador', 'martillo',
      'sierra', 'llave', 'alicate', 'pinza',
      'nivel', 'cinta metrica', 'metro',
      'escalera', 'compresor', 'soldador',
      'multimetro', 'tester'
    ],
    guidedQuestions: [
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'construccion',
    name: 'Construcción',
    icon: '🏗️',
    keywords: [
      'cemento', 'arena', 'piedra', 'grava',
      'ladrillo', 'bloque', 'varilla', 'hierro',
      'pintura', 'rodillo', 'brocha',
      'tubo', 'tuberia', 'pvc',
      'cable electrico', 'alambre'
    ],
    guidedQuestions: [
      {
        id: 'product-quantity',
        question: '¿Cuánto necesitas?',
        type: 'text',
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto? (USD)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'automotriz',
    name: 'Automotriz',
    icon: '🚗',
    keywords: [
      'llanta', 'neumatico', 'goma', 'rin',
      'bateria', 'acumulador',
      'aceite', 'lubricante',
      'filtro', 'bujia', 'faro', 'bombillo',
      'repuesto', 'pieza'
    ],
    guidedQuestions: [
      {
        id: 'product-vehicle',
        question: '¿Para qué vehículo?',
        type: 'text',
        required: true
      },
      {
        id: 'product-condition',
        question: '¿Prefieres nuevo o usado?',
        type: 'choice',
        options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Cualquiera'],
        required: true
      }
    ]
  },
  {
    id: 'jardineria',
    name: 'Jardinería',
    icon: '🌱',
    keywords: [
      'planta', 'semilla', 'arbol', 'flor',
      'maceta', 'matera', 'tierra', 'abono',
      'manguera', 'regadera', 'podadora',
      'cortadora cesped', 'jardin'
    ],
    guidedQuestions: [
      {
        id: 'product-type',
        question: '¿Qué tipo de producto buscas?',
        type: 'text',
        required: true
      },
      {
        id: 'product-budget',
        question: '¿Cuál es tu presupuesto? (USD)',
        type: 'text',
        required: false
      }
    ]
  }
];

export function detectProductCategory(text: string): ProductCategory | null {
  const lowerText = text.toLowerCase();
  
  for (const category of productCategories) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword)) {
        return category.id;
      }
    }
  }
  
  return null;
}

export function getProductCategoryConfig(categoryId: ProductCategory): ProductCategoryConfig | undefined {
  return productCategories.find(c => c.id === categoryId);
}