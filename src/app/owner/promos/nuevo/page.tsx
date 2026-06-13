import Link from 'next/link'
import PromoForm from '../PromoForm'

export default function NuevaPromoPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/promos" className="text-gray-400 hover:text-white text-sm">← Promos</Link>
        <h1 className="text-white text-2xl font-black">Nueva promo</h1>
      </div>
      <PromoForm />
    </div>
  )
}
