# Cotizaciones PTY - Prototipo Funcional

Marketplace de cotizaciones en tiempo real para servicios en Ciudad de Panamá.

## 🎯 Descripción

Aplicación web tipo chat donde los usuarios describen un problema o necesidad, y proveedores cercanos envían cotizaciones **obligatorias** en tiempo real para que el usuario elija la mejor opción según precio, cercanía, reputación y tiempo de respuesta.

## ✨ Características Principales

### Para Clientes 👤
- **Chat conversacional** tipo ChatGPT (sin formularios largos)
- **Flujo híbrido inteligente**: descripción libre + preguntas guiadas según categoría
- Upload de fotos
- Geolocalización para encontrar proveedores cercanos
- Recepción de hasta **5 cotizaciones en 10 minutos**
- Comparación automática de cotizaciones
- Chat directo con el proveedor seleccionado
- Sistema de calificación post-servicio

### Para Proveedores 🧑‍🔧
- **Panel administrativo completo**
- Gestión de perfil y servicios
- Recepción de solicitudes relevantes según ubicación y categoría
- Envío de cotizaciones con **precio obligatorio**
- Límite de tiempo: **10 minutos para responder**
- Estadísticas y métricas de desempeño
- Sistema de membresía: 10 solicitudes gratis, luego $5/mes

## 📋 Reglas del Marketplace

### Cotizaciones
✅ **Precio obligatorio** en la cotización inicial  
✅ **Negociación permitida**: Cliente y proveedor pueden negociar el precio  
✅ Debe incluir: precio, disponibilidad y condiciones  
⚠️ Proveedores pueden elegir si permiten negociación o precio firme  
⚠️ Cambios excesivos de precio pueden afectar el rating

### Tiempo
⏱️ **10 minutos** para que proveedores respondan  
⛔ No responder afecta métricas de desempeño
💬 Negociación puede extenderse después de la cotización inicial

### Volumen
- Cliente recibe **máximo 5 cotizaciones**
- Proveedor envía **1 cotización por solicitud**
- Negociación 1-a-1 con cada proveedor

### Confianza
- Solo se puede calificar si el cliente eligió al proveedor
- Historial de negociación visible para transparencia
- Negociaciones justas mejoran la reputación

## 🗂️ Categorías de Servicio

1. 🔧 **Plomería** - Fugas, instalaciones, reparaciones
2. ⚡ **Electricidad** - Instalaciones, reparaciones, emergencias
3. ❄️ **Aire Acondicionado** - Mantenimiento, reparaciones
4. 🔑 **Cerrajería** - Emergencias, cambios de cerradura
5. 🧹 **Limpieza** - Regular, profunda, post-mudanza
6. 🔌 **Electrodomésticos** - Reparación de nevera, lavadora, etc.
7. 🎨 **Pintura** - Interiores, exteriores
8. 🪚 **Carpintería** - Muebles, reparaciones

## 🏗️ Arquitectura del Proyecto

```
/src
  /app
    /components
      /provider          # Componentes del panel de proveedor
        - IncomingRequests.tsx
        - ProviderProfile.tsx
        - ProviderStats.tsx
        - MembershipUpgrade.tsx
      - ClientChat.tsx   # Chat del cliente
      - ProviderPanel.tsx
      - QuoteComparison.tsx
      - ProviderChat.tsx
      - RatingSystem.tsx
  /data
    - categories.ts      # Configuración de categorías y preguntas guiadas
    - mockData.ts        # Data mock para desarrollo
  /types
    - index.ts           # TypeScript types
```

## 🚀 Flujo de Usuario

### Cliente
1. Describe el problema en lenguaje natural
2. Sistema detecta categoría automáticamente
3. Responde preguntas guiadas (opcional, puede saltar)
4. Comparte ubicación
5. Recibe cotizaciones en tiempo real (hasta 10 min)
6. Compara y selecciona la mejor opción
7. Chatea con el proveedor
8. Califica el servicio

### Proveedor
1. Recibe notificación de solicitud cercana
2. Revisa detalles (descripción, ubicación, urgencia)
3. Envía cotización con precio obligatorio (máx 10 min)
4. Si es seleccionado, chatea con cliente
5. Completa el servicio
6. Recibe calificación

## 📊 Sistema de Membresía

### Plan Gratuito
- 10 solicitudes por mes
- Perfil básico
- Notificaciones estándar

### Plan Premium ($5/mes)
- ✨ Solicitudes ilimitadas
- ⚡ Prioridad en resultados
- ⭐ Badge Premium visible
- 📈 Estadísticas avanzadas
- 🛡️ Soporte prioritario

## 🎨 Stack Tecnológico

- **Frontend**: React + TypeScript
- **UI**: Tailwind CSS v4 + Radix UI
- **Iconos**: Lucide React
- **Estado**: React Hooks
- **Build**: Vite

## 💡 Próximos Pasos (Roadmap)

### MVP Actual ✅
- [x] Chat cliente conversacional
- [x] Panel proveedor
- [x] Sistema de cotizaciones
- [x] Matching por categoría y cercanía
- [x] Chat cliente-proveedor
- [x] Sistema de ratings
- [x] Membresía básica

### Fase 2 (Post-MVP)
- [ ] Integración con backend real (Supabase)
- [ ] Geolocalización real
- [ ] Notificaciones push
- [ ] Pasarela de pagos
- [ ] Verificación de proveedores
- [ ] Historial de servicios
- [ ] Expansión a otras ciudades

## 🔐 Nota de Seguridad

Esta es una versión de prototipo con data mock. **NO** está diseñada para:
- Recolectar información personal identificable (PII)
- Procesar pagos reales
- Uso en producción sin implementar:
  - Autenticación y autorización
  - Encriptación de datos
  - Validación de proveedores
  - Sistema de pagos seguro

## 📝 Licencia

Prototipo para validación de producto - Ciudad de Panamá