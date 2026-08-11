import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export const WHATSAPP_NUMBER = '593XXXXXXXXX' // reemplazar con número real

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  accepted: 'Aceptado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

// Labels para el cliente (app)
export const DELIVERY_LABELS: Record<string, string> = {
  delivery: '🛵 A domicilio',
  pickup:   '🏃 Retirar pedido',
  dine_in:  '🪑 Consumo en local',
}

// Labels para el staff (admin/owner) — indica qué hacer con el pedido
export const DELIVERY_LABELS_STAFF: Record<string, string> = {
  delivery: '🛵 Para llevar (motorizado)',
  pickup:   '🏃 Para llevar (cliente recoge)',
  dine_in:  '🍽️ Servir en el local',
}
