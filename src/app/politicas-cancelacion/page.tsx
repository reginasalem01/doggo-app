import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Políticas de Cancelación y Devolución · Doggo',
  description: 'Políticas de cancelación, devolución y entrega de Doggo — Hotdog sin dramas, Plaza Guayarte, Guayaquil.',
}

export default function PoliticasPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-4 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 text-2xl leading-none">‹</Link>
        <h1 className="text-gray-900 text-xl font-black">Políticas del servicio</h1>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">

        {/* Intro */}
        <div className="bg-doggo-yellow/10 border border-doggo-yellow/30 rounded-2xl px-4 py-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Al realizar un pedido en <strong>Doggo</strong> aceptas las siguientes políticas. Si tienes dudas, escríbenos por WhatsApp — respondemos de lunes a domingo de <strong>11:00 a 21:00</strong>.
          </p>
        </div>

        {/* 1. Cancelaciones */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">🚫 Cancelaciones</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Antes de aceptar tu pedido</p>
              <p>Puedes cancelar tu pedido sin costo alguno escribiéndonos por WhatsApp o contactándonos directamente mientras el pedido aún esté en estado <em>Nuevo</em>.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Una vez aceptado o en preparación</p>
              <p>No es posible cancelar el pedido ya que la preparación ha comenzado. Si hubo un error en tu pedido, contáctanos de inmediato — evaluaremos cada caso.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Cancelación por parte de Doggo</p>
              <p>Nos reservamos el derecho de cancelar un pedido si el producto no está disponible, si no podemos contactarte para confirmar la entrega, o si existe algún problema técnico con el pago. En este caso, el pago será revertido completamente.</p>
            </div>
          </div>
        </section>

        {/* 2. Devoluciones */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">💰 Devoluciones y reembolsos</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Productos en mal estado o incorrectos</p>
              <p>Si recibes un producto diferente al que pediste o en condiciones inaceptables, contáctanos dentro de las <strong>2 horas siguientes</strong> a la entrega con foto del producto. Coordinaremos un reemplazo o reembolso según el caso.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Reembolsos por pago en línea</p>
              <p>Los reembolsos por pago con tarjeta se procesan en un plazo de <strong>5 a 15 días hábiles</strong>, según el banco emisor de tu tarjeta. El monto se devuelve íntegramente al mismo método de pago utilizado.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Doggo Cash (estrellas)</p>
              <p>Si un pedido es cancelado antes de su preparación, las estrellas utilizadas como Doggo Cash serán devueltas a tu cuenta automáticamente.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Productos sin devolución</p>
              <p>Por razones de higiene alimentaria, no aceptamos devoluciones de productos que ya hayan sido consumidos parcialmente, salvo que presenten un problema de calidad comprobable.</p>
            </div>
          </div>
        </section>

        {/* 3. Tiempos de entrega */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">🚚 Tiempos de entrega</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Consumo en local o retiro</p>
              <p>El tiempo estimado de preparación es de <strong>10 a 20 minutos</strong> dependiendo del volumen de pedidos.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Domicilio — zona cercana</p>
              <p>Sectores aledaños a Plaza Guayarte (Urdesa, Miraflores, Los Ceibos, Kennedy): <strong>20 a 35 minutos</strong> desde la confirmación del pedido.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Domicilio — zona media</p>
              <p>Sectores como Alborada, Sauces, Samborondón: <strong>35 a 50 minutos</strong>. Los tiempos pueden variar por tráfico o condiciones climáticas.</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Retrasos</p>
              <p>Si tu pedido demora más de lo estimado, puedes seguir su estado en tiempo real desde la app. Para consultas urgentes, contáctanos por WhatsApp.</p>
            </div>
          </div>
        </section>

        {/* 4. Disponibilidad */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">✅ Disponibilidad de productos</h2>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm text-gray-600 leading-relaxed">
            <p>Garantizamos la disponibilidad de todos los productos publicados en el menú durante nuestro horario de atención. Si por alguna razón un producto no está disponible al momento de tu pedido, te contactaremos de inmediato para ofrecerte una alternativa o proceder con el reembolso correspondiente.</p>
          </div>
        </section>

        {/* 5. Horario */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">🕐 Horario de atención</h2>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm text-gray-600 leading-relaxed space-y-1">
            <p><span className="font-bold text-gray-900">Lunes a domingo:</span> 11:00 — 21:00</p>
            <p className="text-gray-400 text-xs mt-2">Los pedidos realizados fuera de este horario serán procesados al siguiente día de atención.</p>
          </div>
        </section>

        {/* 6. Contacto */}
        <section>
          <h2 className="text-gray-900 font-black text-lg mb-3">💬 Soporte al cliente</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm text-gray-600 leading-relaxed">
              <p className="font-bold text-gray-900 mb-1">Atención al cliente</p>
              <p>Disponible todos los días durante nuestro horario de operación a través de WhatsApp. Respondemos consultas, cambios de pedido y reclamaciones.</p>
            </div>
            <a
              href="https://wa.me/593XXXXXXXXX?text=Hola%2C+necesito+ayuda+con+mi+pedido+en+Doggo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 font-bold text-sm"
            >
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-black">Escribir por WhatsApp</p>
                <p className="text-green-600 font-normal text-xs">Atención de lunes a domingo · 11:00 a 21:00</p>
              </div>
            </a>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm text-gray-600">
              <p className="font-bold text-gray-900 mb-1">Ubicación</p>
              <p>Plaza Guayarte, Guayaquil, Ecuador</p>
            </div>
          </div>
        </section>

        {/* Footer legal */}
        <div className="border-t border-gray-100 pt-6 pb-4">
          <p className="text-gray-400 text-xs leading-relaxed text-center">
            Estas políticas aplican a todos los pedidos realizados a través de la plataforma digital de <strong>Doggo</strong>. Nos reservamos el derecho de actualizar estas políticas — la versión vigente siempre estará disponible en esta página. Última actualización: julio 2025.
          </p>
        </div>

      </div>
    </div>
  )
}
