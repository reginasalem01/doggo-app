# Doggo 🌭

PWA de pedidos, reservas y fidelización para Doggo · Plaza Guayarte, Guayaquil.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / PWA | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS 3 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Estado del carrito | Zustand (persist) |
| Deploy | Vercel |

## Estructura

```
src/
├── app/                  # Rutas (App Router)
│   ├── page.tsx          # Home
│   ├── menu/             # Menú con filtros por categoría
│   ├── carrito/          # Carrito de compras
│   ├── checkout/         # Formulario de pedido
│   ├── pedido/[id]/      # Confirmación de pedido
│   ├── reservas/         # Reservar mesa
│   ├── puntos/           # Fidelización
│   └── perfil/           # Perfil del cliente
├── components/
│   └── ui/               # BottomNav, CartIcon, etc.
├── hooks/                # useHydration
├── lib/
│   ├── supabase/         # client.ts + server.ts
│   └── utils.ts          # helpers, formatPrice, WhatsApp
├── store/
│   └── cart.ts           # Zustand store
└── types/
    └── index.ts          # Tipos TypeScript de toda la app
```

## Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # ⚠️ nunca al repo
```

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:3000
```

## Base de datos

El archivo `supabase-setup.sql` contiene todas las tablas, datos de prueba y políticas RLS.
Pégalo en Supabase → SQL Editor → Run.

## Pendiente (próximas semanas)

- [ ] Página de reservas funcional
- [ ] Login / perfil del cliente
- [ ] Programa de puntos
- [ ] Panel admin
- [ ] Integración de pagos (PayPhone / Datafast)
- [ ] Deploy en Vercel
