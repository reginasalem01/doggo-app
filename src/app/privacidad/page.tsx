import BackButton from '@/components/ui/BackButton'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 z-10">
        <BackButton />
        <h1 className="text-gray-900 text-lg font-black">Política de Privacidad</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm text-gray-700 leading-relaxed pb-20">
        <p className="text-gray-400 text-xs">Última actualización: junio 2026 · Cumple con la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador</p>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">1. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de tus datos personales es <span className="font-semibold">Doggo</span>, con operaciones en Guayaquil, Ecuador. Puedes contactarnos en <span className="font-semibold">doggoguayarte@gmail.com</span>.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">2. Datos que recopilamos</h2>
          <p className="mb-2">Al crear una cuenta y usar la aplicación, recopilamos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-semibold">Datos de registro:</span> nombre completo, correo electrónico y contraseña (encriptada).</li>
            <li><span className="font-semibold">Datos de contacto:</span> número de teléfono (opcional).</li>
            <li><span className="font-semibold">Datos de pedidos:</span> dirección de entrega, productos pedidos, historial de compras.</li>
            <li><span className="font-semibold">Datos de fidelización:</span> puntos acumulados, premios canjeados.</li>
            <li><span className="font-semibold">Datos de reservas:</span> fecha, hora y número de personas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">3. Finalidad del tratamiento</h2>
          <p className="mb-2">Usamos tus datos para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestionar tu cuenta y permitirte iniciar sesión.</li>
            <li>Procesar tus pedidos y reservas.</li>
            <li>Administrar tu participación en el programa de fidelización.</li>
            <li>Enviarte confirmaciones de pedido por correo electrónico.</li>
            <li>Mejorar nuestros servicios y la experiencia de usuario.</li>
          </ul>
          <p className="mt-2">No utilizamos tus datos para publicidad de terceros ni los vendemos a ninguna empresa externa.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">4. Base legal del tratamiento</h2>
          <p>El tratamiento de tus datos se basa en tu consentimiento expreso otorgado al crear tu cuenta, y en la necesidad de ejecutar el servicio que nos solicitas (gestión de pedidos y reservas), conforme al Art. 7 de la LOPDP.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">5. Compartición de datos</h2>
          <p>Tus datos son tratados por los siguientes proveedores de servicios bajo estrictas condiciones de confidencialidad:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><span className="font-semibold">Supabase</span> — almacenamiento de base de datos y autenticación.</li>
            <li><span className="font-semibold">Vercel</span> — alojamiento de la aplicación.</li>
            <li><span className="font-semibold">Resend</span> — envío de correos transaccionales.</li>
          </ul>
          <p className="mt-2">No compartimos tus datos con otras empresas salvo obligación legal.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">6. Conservación de datos</h2>
          <p>Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, borraremos tus datos personales en un plazo máximo de 30 días, salvo que exista obligación legal de conservarlos.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">7. Tus derechos</h2>
          <p className="mb-2">Conforme a la LOPDP tienes derecho a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-semibold">Acceso:</span> conocer qué datos tenemos sobre ti.</li>
            <li><span className="font-semibold">Rectificación:</span> corregir datos incorrectos.</li>
            <li><span className="font-semibold">Eliminación:</span> solicitar que borremos tu cuenta y datos.</li>
            <li><span className="font-semibold">Portabilidad:</span> recibir tus datos en formato legible.</li>
            <li><span className="font-semibold">Oposición:</span> oponerte al tratamiento en casos específicos.</li>
          </ul>
          <p className="mt-2">Para ejercer cualquiera de estos derechos, escríbenos a <span className="font-semibold">doggoguayarte@gmail.com</span>.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">8. Seguridad</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo encriptación de contraseñas, acceso restringido a la base de datos y comunicaciones cifradas (HTTPS).</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">9. Cookies</h2>
          <p>Usamos cookies de sesión estrictamente necesarias para mantener tu inicio de sesión. No usamos cookies de rastreo ni publicidad.</p>
        </section>

        <section>
          <h2 className="font-black text-gray-900 text-base mb-2">10. Cambios en esta política</h2>
          <p>Podemos actualizar esta política ocasionalmente. Te notificaremos dentro de la aplicación sobre cambios significativos. La versión vigente siempre estará disponible en esta página.</p>
        </section>
      </div>
    </div>
  )
}
