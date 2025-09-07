import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(url, anon)
  const { data, error } = await supabase
    .rpc('get_traders_paged', { page: 1, page_size: 5, q: null, sort_by: 'score', order_by: 'desc' })
  if (error) {
    console.error('RPC error:', error)
    process.exit(1)
  }
  console.log('Rows:', Array.isArray(data) ? data.length : 0)
  console.log((data as any[]).map(r => ({ id: r.id, name: r.name, avatar_url: r.avatar_url })).slice(0,5))
}

main().catch(e => { console.error(e); process.exit(1) })
