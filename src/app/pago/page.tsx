import { redirect } from 'next/navigation'

// /pago no se usa directamente — el flujo de pago vive en /checkout
export default function PagoPage() {
  redirect('/checkout')
}
