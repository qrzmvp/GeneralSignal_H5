import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(url, serviceKey)

const localDir = path.resolve('public', 'trader-avatars-local')
const targetPrefix = 'default' // upload to trader-avatars/default/

async function main() {
  const files = fs.readdirSync(localDir).filter(f => f.endsWith('.svg') && f.startsWith('trader-'))
  if (!files.length) {
    console.error('No local SVG avatars found in', localDir)
    process.exit(1)
  }
  console.log('Uploading', files.length, 'avatars...')
  for (const f of files) {
    const key = `${targetPrefix}/${f}`
    const bytes = fs.readFileSync(path.join(localDir, f))
    const { error } = await supabase.storage.from('trader-avatars').upload(key, bytes, {
      contentType: 'image/svg+xml',
      upsert: true,
    })
    if (error) throw error
    console.log('uploaded:', key)
  }

  if (process.env.DO_UPDATE_DB) {
    // Optional: map traders named '将军 N' to default/trader-XX.svg by N
    const { data: rows, error } = await supabase.from('traders').select('id,name')
    if (error) throw error
    const updates: { id: string; avatar_key: string }[] = []
    for (const r of rows || []) {
      const m = /将军\s+(\d+)/.exec(r.name || '')
      if (m) {
        const n = String(parseInt(m[1], 10)).padStart(2, '0')
        updates.push({ id: r.id, avatar_key: `${targetPrefix}/trader-${n}.svg` })
      }
    }
    for (const u of updates) {
      const { error: upErr } = await supabase.from('traders').update({ avatar_key: u.avatar_key }).eq('id', u.id)
      if (upErr) throw upErr
      console.log('mapped:', u)
    }
  }

  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
