import BackButton from '@/components/ui/BackButton'

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 z-10">
        <BackButton />
        <h1 className="text-gray-900 text-lg font-black">Términos y Condiciones</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm text-gray-700 leading-relaxed pb-20">
        <p className="text-gray-400 text-xs">Última actualización: junio 2026</p>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">1. Sobre Doggo</h2>
          <p>Doggo es una plataforma digital de pedidos, reservas y fidelización para el restaurante Doggo, ubicado en Guayaquil, Ecuador. Al crear una cuenta y usar esta aplicación, aceptas estos términos en su totalidad.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">2. Uso de la cuenta</h2>
          <p>Debes tener al menos 18 años para crear una cuenta o contar con autorización de un adulto responsable. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">3. Pedidos</h2>
          <p>Al realizar un pedido, confirmas que la información proporcionada (dirección, teléfono) es correcta. Los pedidos están sujetos a disponibilidad. Doggo se reserva el derecho de cancelar pedidos en casos de fuerza mayor, error de precio o producto no disponible.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">4. Precios y pagos</h2>
          <p>Los precios mostrados en la aplicación incluyen impuestos aplicables. El precio final es el que aparece en el resumen del pedido al momento de confirmar. Doggo puede modificar los precios del menú en cualquier momento sin previo aviso.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">5. Programa de fidelización</h2>
          <p>Al completar pedidos pagados y entregados, acumulas puntos según la tasa vigente (actualmente $1 = 1 punto). Los puntos son personales, no transferibles y no tienen valor monetario. Doggo se reserva el derecho de modificar, suspender o cancelar el programa de puntos en cualquier momento, notificando a los usuarios con al menos 15 días de anticipación. Los puntos no redimidos pueden expirar si la cuenta permanece inactiva por más de 12 meses.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">6. Reservas</h2>
          <p>Las reservas están sujetas a disponibilidad y deben ser confirmadas por el restaurante. Una reserva solicitada no garantiza disponibilidad hasta recibir confirmación. Doggo puede cancelar reservas por causas de fuerza mayor.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">7. Conducta del usuario</h2>
          <p>Queda prohibido el uso de la aplicación para actividades fraudulentas, incluyendo la manipulación de precios, puntos o cualquier dato de la plataforma. El incumplimiento puede resultar en la suspensión permanente de la cuenta.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">8. Limitación de responsabilidad</h2>
          <p>Doggo no se hace responsable por demoras causadas por factores externos, condiciones climáticas o problemas de conectividad. La aplicación se ofrece "tal cual" y puede presentar interrupciones por mantenimiento.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">9. Modificaciones</h2>
          <p>Doggo puede actualizar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación. El uso continuado de la aplicación después de la notificación implica la aceptación de los nuevos términos.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">10. Contacto</h2>
          <p>Para cualquier consulta sobre estos términos, puedes contactarnos a través de WhatsApp o al email <span className="font-semibold">doggoguayarte@gmail.com</span>.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">11. Ley aplicable</h2>
          <p>Estos términos se rigen por las leyes de la República del Ecuador. Cualquier disputa será resuelta ante los tribunales competentes de la ciudad de Guayaquil.</p>
        </section>
      </div>
    </div>
  )
}
