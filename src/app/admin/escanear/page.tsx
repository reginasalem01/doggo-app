import QRScanner from './QRScanner'

export default function EscanearPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-gray-900 text-lg font-black">Escanear cliente</h1>
        <p className="text-gray-400 text-xs mt-0.5">Sumar puntos o canjear premio</p>
      </div>
      <div className="px-4 py-6">
        <QRScanner />
      </div>
    </div>
  )
}
