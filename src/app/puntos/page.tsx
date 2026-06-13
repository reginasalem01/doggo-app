import { redirect } from 'next/navigation'

// /puntos muestra todo en /perfil
export default function PuntosPage() {
  redirect('/perfil')
}
