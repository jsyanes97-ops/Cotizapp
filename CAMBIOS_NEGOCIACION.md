# 🆕 Nueva Funcionalidad: Negociación de Precios

## 📝 Resumen de Cambios

Hemos actualizado el marketplace para permitir **negociación de precios** entre clientes y proveedores, haciendo el sistema más flexible y realista.

---

## ✨ Características Implementadas

### 1. Para Clientes 👤

#### Botón "Negociar Precio"
- Cada cotización ahora tiene un botón **"💬 Negociar precio"**
- Permite proponer un precio diferente sin aceptar la cotización original

#### Interfaz de Negociación
- **Precio actual vs. precio original**: Visualización clara de cambios
- **Indicador de ahorro**: Muestra cuánto se ha reducido (o aumentado) el precio
- **Historial completo**: Todas las propuestas visibles
- **Chat integrado**: Mensajes de texto para explicar propuestas

#### Flujo de Negociación
1. Cliente hace clic en "Negociar precio"
2. Propone nuevo precio + mensaje opcional
3. Proveedor responde (acepta, rechaza o contraoferta)
4. Pueden intercambiar varias propuestas
5. Cuando hay acuerdo, se acepta el precio final

---

### 2. Para Proveedores 🧑‍🔧

#### Switch "Permitir Negociación"
- Al enviar cotización, el proveedor elige:
  - ✅ **Permitir negociación**: Cliente puede proponer otro precio
  - ❌ **Precio firme**: No negociable

#### Panel de Negociación
- Recibe notificaciones de propuestas del cliente
- Ve historial completo de la negociación
- Puede:
  - Aceptar la propuesta
  - Hacer contraoferta
  - Enviar mensajes explicativos
  - Rechazar si es muy baja

#### Estrategias
- Flexibilidad para ajustar precios según el cliente
- Opción de precios firmes para mantener tarifas estándar
- Historial visible ayuda a mantener transparencia

---

## 🔧 Cambios Técnicos

### Nuevos Types (TypeScript)
```typescript
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating';

export interface Quote {
  // ... campos existentes
  originalPrice?: number; // Precio original antes de negociar
  negotiationHistory?: NegotiationMessage[];
}

export interface NegotiationMessage {
  id: string;
  sender: 'client' | 'provider';
  type: 'price_proposal' | 'message' | 'acceptance' | 'rejection';
  price?: number;
  message: string;
  timestamp: Date;
}
```

### Nuevos Componentes

#### `/src/app/components/PriceNegotiation.tsx`
- Componente principal de negociación
- Gestiona propuestas, historial y aceptación
- Usado tanto por cliente como proveedor (prop `userRole`)

#### Componentes Actualizados
- **QuoteComparison.tsx**: Agregado botón "Negociar precio" y lógica
- **IncomingRequests.tsx**: Switch para permitir/denegar negociación

---

## 🎯 Beneficios del Sistema

### Para Clientes
- ✅ Mayor control sobre el presupuesto
- ✅ Posibilidad de conseguir mejores precios
- ✅ Transparencia en todo el proceso
- ✅ Pueden explicar limitaciones de presupuesto

### Para Proveedores
- ✅ Flexibilidad para ajustar según capacidad
- ✅ Pueden educar sobre costos reales
- ✅ Oportunidad de cerrar más ventas
- ✅ Control sobre si permiten negociación o no

### Para el Marketplace
- ✅ Más transacciones completadas
- ✅ Mayor satisfacción de ambas partes
- ✅ Historial de negociación como métrica
- ✅ Fomenta comunicación justa

---

## 🚀 Cómo Funciona (Ejemplos)

### Caso 1: Negociación Exitosa
```
Cliente: Necesito pintar un cuarto
Sistema: [Genera cotizaciones]
Proveedor A: $150 (permite negociación)

Cliente: "Mi presupuesto es $120"
Proveedor A: "Te puedo ofrecer $135 con materiales premium"
Cliente: ✅ Acepta $135

→ Servicio contratado, ambos satisfechos
```

### Caso 2: Precio Firme
```
Cliente: Necesito reparar A/C
Sistema: [Genera cotizaciones]
Proveedor B: $100 (NO permite negociación)

Cliente: Intenta negociar
Sistema: "Este proveedor tiene precio firme"

Cliente: ✅ Acepta $100 o elige otro proveedor
```

### Caso 3: Sin Acuerdo
```
Cliente: Solicita servicio
Proveedor C: $150 (permite negociación)

Cliente: "¿Puedes hacerlo por $80?"
Proveedor C: "No puedo bajar de $130 por los materiales"
Cliente: "Mi máximo es $90"
Proveedor C: "Lo siento, no puedo cubrir costos"

→ No hay acuerdo, cliente elige otro proveedor
```

---

## 📊 Métricas y Reputación

### Impacto en Rating
- ❌ **Negativo**: Cambios excesivos de precio (>30%)
- ✅ **Positivo**: Negociaciones justas y razonables
- ⚠️ **Neutral**: Rechazos con explicación clara

### Historial Visible
- Todos los intercambios quedan registrados
- Ayuda a la transparencia
- Protege a ambas partes

---

## 💡 Mejores Prácticas

### Para Clientes
1. 🤝 Propón precios justos basados en el mercado
2. 💬 Explica tu presupuesto o situación
3. 🔍 Respeta el trabajo del proveedor
4. ✅ Si aceptan tu precio, contrata el servicio

### Para Proveedores
1. 💰 Explica qué incluye tu servicio
2. 📋 Menciona costos de materiales
3. 🤝 Busca puntos intermedios
4. ⚡ Ofrece alternativas (menos servicios por menos precio)

---

## 🔐 Reglas de Negociación

### Límites
- ⏱️ Cotización inicial: 10 minutos
- 💬 Negociación: Sin límite de tiempo
- 🔄 Propuestas: Ilimitadas hasta llegar a acuerdo
- 📊 Historial: Permanente y visible

### Protecciones
- No se puede cambiar precio después de aceptar
- Historial inmutable una vez enviado
- Ambas partes deben confirmar acuerdo final
- Rating refleja comportamiento de negociación

---

## 🎨 UI/UX

### Elementos Visuales
- 💵 Precio actual en grande y verde
- 🔻 Precio original tachado si hay negociación
- 📉 Badge de ahorro: "$X menos que el precio original"
- 💬 Chat estilo mensajería para fluidez
- ✅ Botón destacado "Aceptar $XX" cuando hay acuerdo

### Feedback
- Notificaciones cuando hay nueva propuesta
- Colores distintivos: cliente (azul) vs proveedor (gris)
- Timestamps en cada mensaje
- Estados claros: "En negociación", "Precio aceptado"

---

## 📚 Documentación Actualizada

- ✅ README.md - Reglas actualizadas
- ✅ GUIA_DE_USO.md - Sección completa de negociación
- ✅ Ejemplos de casos de uso
- ✅ FAQ con preguntas sobre negociación

---

## 🔮 Futuro (Posibles Mejoras)

### Fase 2
- [ ] Límite de propuestas (ej: máximo 5 por negociación)
- [ ] Sugerencias de precio basadas en IA
- [ ] Alertas si precio propuesto es muy bajo/alto
- [ ] Tiempo límite para responder propuestas

### Fase 3
- [ ] Análisis de patrones de negociación
- [ ] Recomendaciones personalizadas
- [ ] Sistema de "ofertas flash" con descuento
- [ ] Negociación de paquetes de servicios

---

## ✅ Checklist de Implementación

- [x] Actualizar types en `/src/types/index.ts`
- [x] Crear componente `PriceNegotiation.tsx`
- [x] Actualizar `QuoteComparison.tsx`
- [x] Actualizar `IncomingRequests.tsx`
- [x] Agregar switch "Permitir negociación"
- [x] Implementar historial de negociación
- [x] Actualizar documentación
- [x] Agregar ejemplos de uso
- [x] Probar flujo completo cliente-proveedor

---

## 🚀 Estado: ✅ COMPLETO

La funcionalidad de negociación está **100% implementada y funcional** en el prototipo.

Los usuarios pueden probarla alternando entre roles de Cliente y Proveedor usando el botón "Cambiar rol ↻".
