import Link from 'next/link'
import RewardForm from '../RewardForm'

export default function NuevoPremioPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/fidelizacion" className="text-gray-400 hover:text-white text-sm">← Fidelización</Link>
        <h1 className="text-white text-2xl font-black">Nuevo premio</h1>
      </div>
      <RewardForm />
    </div>
  )
}
