# Club Pacífico Tenis — Sistema de Reservas

MVP funcional para reservar canchas de tenis con Next.js + Supabase.

---

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Supabase** (PostgreSQL + RLS)

---

## Setup en 5 pasos

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Copiar **Project URL** y **anon public key** desde Project Settings → API

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

### 4. Ejecutar el schema SQL

En el **SQL Editor** de Supabase, pegar y ejecutar el contenido de `schema.sql`.

Esto crea:
- Tabla `courts` con las 6 canchas ya insertadas
- Tabla `bookings` con constraint de no-overlap
- Índices y políticas RLS

### 5. Correr el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
pacifico-tenis/
├── app/
│   ├── api/
│   │   ├── availability/route.ts   # GET /api/availability?date=YYYY-MM-DD
│   │   └── book/route.ts           # POST /api/book
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Página principal
├── components/
│   ├── PacificoMap.tsx             # Mapa interactivo con las 6 canchas
│   ├── BookingPanel.tsx            # Panel lateral de reserva
│   └── DatePicker.tsx              # Selector de fecha (14 días)
├── lib/
│   ├── supabase.ts                 # Cliente Supabase singleton
│   ├── schedule.ts                 # Lógica de negocio (slots, overlap, validaciones)
│   └── api-client.ts               # getAvailability() / createBooking()
├── types/
│   └── index.ts                    # Tipos TypeScript compartidos
└── schema.sql                      # Schema + seed data para Supabase
```

---

## API Reference

### GET /api/availability

```
GET /api/availability?date=2025-01-15
```

**Response:**
```json
{
  "date": "2025-01-15",
  "courts": [
    {
      "court": { "id": "...", "name": "Cancha 1", "type": "outdoor" },
      "slots": [
        { "time_start": "08:00", "time_end": "09:00", "available": true },
        { "time_start": "09:00", "time_end": "10:00", "available": false, "booking": { "id": "...", "client_name": "Juan" } }
      ]
    }
  ]
}
```

### POST /api/book

```json
{
  "courtId": "uuid",
  "date": "2025-01-15",
  "timeStart": "10:00",
  "timeEnd": "11:00",
  "name": "Juan García",
  "phone": "+54 9 11 1234-5678"
}
```

**Response (201):**
```json
{
  "success": true,
  "booking": { "id": "uuid", "status": "confirmed", ... }
}
```

**Error (409 — conflicto):**
```json
{
  "success": false,
  "error": "El horario seleccionado ya está ocupado"
}
```

---

## Extensiones futuras

### WhatsApp (Twilio / Meta API)
Los endpoints ya están preparados. El bot usaría exactamente las mismas funciones:

```ts
import { getAvailability, createBooking } from '@/lib/api-client'
```

### Autenticación
Agregar `@supabase/auth-helpers-nextjs` y ajustar las RLS policies en Supabase para requerir sesión.

### Notificaciones
Al confirmar en `POST /api/book`, agregar llamada a Twilio SMS o email con Resend.

### Cancelaciones
Agregar `PATCH /api/book/[id]` que setee `status = 'cancelled'`.

---

## Canchas configuradas

| Cancha | Tipo | ID |
|--------|------|----|
| Cancha 1 | Outdoor (descubierta) | `11111111-...-0001` |
| Cancha 2 | Outdoor (descubierta) | `11111111-...-0002` |
| Cancha 3 | Outdoor (descubierta) | `11111111-...-0003` |
| Cancha 4 | Outdoor (descubierta) | `11111111-...-0004` |
| Cancha 5 (Cubierta) | Indoor | `11111111-...-0005` |
| Cancha 6 (Cubierta) | Indoor | `11111111-...-0006` |

Horario del club: **08:00 – 22:00**, turnos de **1 hora**.
