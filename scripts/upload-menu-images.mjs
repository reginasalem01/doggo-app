/**
 * Sube las fotos del menú a Supabase Storage y actualiza image_url en cada producto.
 * Uso: node scripts/upload-menu-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { resolve, extname, basename } from 'path'

const SUPABASE_URL = 'https://rasmalxjusrwpwbtoavs.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc21hbHhqdXNyd3B3YnRvYXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwNDEzNSwiZXhwIjoyMTAwNDgwMTM1fQ.Mko_rZ6Qe7oim4v9NHzlFk6qVEnQCAOKgaAnC7egRlY'
const BUCKET      = 'images'
const IMAGES_DIR  = resolve('../../menu pics')

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Mapa explícito: nombre de archivo (sin extensión) → nombre del producto en DB ──
// Ajusta si el nombre en la BD es diferente
const MANUAL_MAP = {
  'CHILLI '                  : 'Chili',
  'CLÁSICO'                  : 'Clásico',
  'COMBO CON COLA'           : 'Combo Doggo + Cola',
  'COMBO_'                   : 'Combo Clásico',
  'DOGGITO ACCIÓN'           : 'Doggito',
  'DOGGITO CON PAPAS'        : 'Doggito',
  'DOGGITO EN COMBO CON COLA': 'Combo Doggito',
  'DOGGO '                   : 'Doggo',
  'DOGGO CLOSE UP'           : 'Doggo',       // el extname() quita ". png" completo
  'DOGGO PERFIL'             : 'Doggo',
  'HAWAIANO'                 : 'Hawaiano',
  'PAPAS FRITAS'             : 'Papas Fritas',
  'SALCHICHEDDAR ACCIÓN'     : 'Salchicheddar',
  'SALCHICHEDDAR'            : 'Salchicheddar',
  'SALCHICHILLI'             : 'Salchichili',
  'SWEET DOGGO '             : 'Sweetdoggo',
  'Salchipapa sencilla'      : 'Salchipapas Clásicas',
}

// Quita acentos y chars especiales para el path en Storage
function sanitizeStorageName(name) {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function norm(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

async function main() {
  const { data: products, error } = await sb
    .from('products').select('id, name, image_url').order('name')

  if (error) { console.error('Error leyendo productos:', error.message); process.exit(1) }
  console.log(`\n✅ ${products.length} productos en la BD`)
  console.log('Productos:', products.map(p => p.name).join(', '), '\n')

  const files = readdirSync(IMAGES_DIR).filter(f => {
    const ext = extname(f).toLowerCase().trim()
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)
  })
  console.log(`📁 ${files.length} imágenes encontradas\n`)

  const results = { ok: [], skipped: [], error: [] }

  for (const file of files) {
    const filePath   = resolve(IMAGES_DIR, file)
    const ext        = extname(file).toLowerCase().trim()
    const fileBase   = basename(file, extname(file))    // nombre sin extensión

    // Buscar producto: primero en el mapa manual, luego por nombre normalizado
    const mappedName = MANUAL_MAP[fileBase]
    let match = mappedName
      ? products.find(p => norm(p.name) === norm(mappedName))
      : products.find(p => norm(p.name) === norm(fileBase))
        ?? products.find(p => norm(p.name).includes(norm(fileBase)) || norm(fileBase).includes(norm(p.name)))

    if (!match) {
      console.warn(`⚠️  Sin match: "${file}" (buscaba: "${mappedName ?? fileBase}")`)
      results.skipped.push(file)
      continue
    }

    // Sanitizar path para Storage
    const safeBase    = sanitizeStorageName(fileBase)
    const storagePath = `menu/${safeBase}${ext}`
    const fileBuffer  = readFileSync(filePath)
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'

    const { error: upErr } = await sb.storage
      .from(BUCKET).upload(storagePath, fileBuffer, { contentType, upsert: true })

    if (upErr) {
      console.error(`❌ Error subiendo "${file}": ${upErr.message}`)
      results.error.push(file)
      continue
    }

    const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(storagePath)
    await sb.from('products').update({ image_url: publicUrl }).eq('id', match.id)

    console.log(`✅  "${file}"  →  ${match.name}`)
    results.ok.push({ file, product: match.name })
  }

  console.log(`\n─────────────────────────────────────`)
  console.log(`✅ Subidos y actualizados : ${results.ok.length}`)
  console.log(`⚠️  Sin match             : ${results.skipped.length}`)
  console.log(`❌ Errores                : ${results.error.length}`)
  if (results.skipped.length) results.skipped.forEach(f => console.log(`   ⚠️  ${f}`))
  if (results.error.length)   results.error.forEach(f => console.log(`   ❌  ${f}`))
  console.log('─────────────────────────────────────\n')
}

main().catch(console.error)
