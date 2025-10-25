# UI Package (Opcional)

Librería de componentes compartidos para reutilización entre dashboard web y potenciales futuras interfaces.

**⚠️ NOTA**: Este directorio NO contiene código fuente. Esta documentación describe conceptualmente un paquete opcional de componentes UI.

---

## Propósito

Centralizar componentes visuales y utilidades compartidas para mantener consistencia de diseño y evitar duplicación de código.

**Estado**: **Opcional para MVP** — Solo implementar si hay tiempo después de completar funcionalidades core.

---

## Componentes Propuestos

### 1. Button

**Props**:
- `variant`: "primary" | "secondary" | "danger"
- `size`: "sm" | "md" | "lg"
- `onClick`: Handler
- `disabled`: Boolean
- `children`: React.ReactNode

**Ejemplo de uso**:
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Resolver Alerta
</Button>
```

---

### 2. Card

**Props**:
- `title`: String
- `subtitle`: String (opcional)
- `children`: React.ReactNode
- `className`: String (opcional)

**Ejemplo de uso**:
```tsx
<Card title="Accuracy" subtitle="Último scan">
  <p className="text-3xl font-bold">92.5%</p>
</Card>
```

---

### 3. Badge

**Props**:
- `status`: "success" | "warning" | "error" | "info"
- `text`: String

**Ejemplo de uso**:
```tsx
<Badge status="success" text="Completo" />
<Badge status="error" text="Crítico" />
```

---

### 4. Spinner

**Props**:
- `size`: "sm" | "md" | "lg"
- `color`: String (hex o tailwind class)

**Ejemplo de uso**:
```tsx
<Spinner size="md" color="blue-500" />
```

---

### 5. Toast (Wrapper de react-hot-toast)

**Funciones**:
```typescript
toast.success('Scan procesado exitosamente');
toast.error('Error al procesar imagen');
toast.warning('Confianza baja en detección');
```

---

## Utilidades Propuestas

### 1. Formatters

```typescript
// formatters.ts

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatConfidence(confidence: number): string {
  return confidence.toFixed(2);
}
```

**Uso**:
```tsx
import { formatTime, formatPercentage } from '@/packages/ui/utils/formatters';

<p>Tiempo: {formatTime(450)}</p> // "7m 30s"
<p>Accuracy: {formatPercentage(0.925)}</p> // "92.5%"
```

---

### 2. Status Helpers

```typescript
// status.ts

export function getStatusColor(status: 'green' | 'yellow' | 'red'): string {
  return {
    green: 'bg-trolley-green',
    yellow: 'bg-trolley-yellow',
    red: 'bg-trolley-red'
  }[status];
}

export function getSeverityIcon(severity: 'critical' | 'warning' | 'info'): string {
  return {
    critical: '🔴',
    warning: '🟡',
    info: '🔵'
  }[severity];
}
```

---

## Configuración

### Setup como Monorepo Package

**Si se implementa, estructura recomendada**:

```
packages/ui/
├─ src/
│  ├─ components/
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ Badge.tsx
│  │  └─ index.ts
│  ├─ utils/
│  │  ├─ formatters.ts
│  │  ├─ status.ts
│  │  └─ index.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json
```

**package.json**:
```json
{
  "name": "@smart-trolley/ui",
  "version": "1.0.0",
  "main": "src/index.ts",
  "peerDependencies": {
    "react": "^18.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

---

## Uso desde Dashboard

```tsx
// apps/dashboard/pages/index.tsx
import { Button, Card, Badge } from '@smart-trolley/ui/components';
import { formatTime, getStatusColor } from '@smart-trolley/ui/utils';

export default function Dashboard() {
  return (
    <Card title="Trolley TRLLY-001">
      <Badge status="success" text="Completo" />
      <p>Tiempo: {formatTime(450)}</p>
      <Button variant="primary" onClick={handleAction}>
        Ver Detalle
      </Button>
    </Card>
  );
}
```

---

## Priorización

### Must-Have (Si se implementa)
- Button
- Card
- Formatters (formatTime, formatPercentage)

### Nice-to-Have
- Badge
- Toast wrapper
- Status helpers

### Diferido para Post-MVP
- Spinner
- Modal
- Dropdown
- Tabs

---

## Alternativa Simple (Sin Package Separado)

Para el MVP, **no crear package separado**. En su lugar:

1. Crear carpeta `components/shared` en dashboard
2. Copiar componentes necesarios directamente
3. Evitar over-engineering

**Razón**: En 36 horas, priorizar funcionalidad sobre arquitectura perfecta.

---

## Testing

### Unit Tests (si se implementa)

```typescript
// Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  const { getByText } = render(<Button>Click me</Button>);
  expect(getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  const { getByText } = render(<Button onClick={handleClick}>Click</Button>);
  
  fireEvent.click(getByText('Click'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## Decisión Final

**Para HackMTY MVP**:
- ❌ **NO implementar** package separado
- ✅ Crear componentes directamente en `apps/dashboard/components`
- ✅ Reutilizar solo si hay duplicación evidente

**Para producción futura**:
- ✅ Migrar componentes comunes a package
- ✅ Agregar Storybook para documentación
- ✅ Publicar a npm privado si hay múltiples frontends

---

## Referencias

- [Dashboard Next Setup](../../docs/setup/dashboard-next-setup.md) — Componentes del dashboard
- Tailwind CSS Docs — Para estilos de componentes
- React Component Patterns — Best practices

