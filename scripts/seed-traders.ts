/*
  Seed sample traders using provided external avatar URLs (no storage).
  Requirements:
  - Set NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY (service role) in env when running this script.

  Run: npx tsx scripts/seed-traders.ts
*/
import dotenv from 'dotenv'
// Load .env.local first if present, then fallback to .env
dotenv.config({ path: '.env.local' })
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Prefer new Secret API Key if provided, fallback to legacy SERVICE_ROLE_KEY (JWT)
const serviceKey = process.env.SUPABASE_SERVICE_API_KEY || process.env.SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_API_KEY or SERVICE_ROLE_KEY)')
  process.exit(1)
}

// Validate that the service role key belongs to the same project as the URL
function parseJwtNoVerify(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

try {
  const host = new URL(url).host // e.g. kgh...supabase.co
  const projectRefFromUrl = host.split('.')[0]
  console.log(`Supabase project ref (from URL): ${projectRefFromUrl}`)
  // Only attempt JWT parsing if it looks like a JWT (has two dots)
  if (serviceKey.split('.').length === 3) {
    const payload = parseJwtNoVerify(serviceKey)
    const ref = payload?.ref
    const rolesClaim = payload?.['https://supabase.io/roles']
    const role = payload?.role || payload?.roles || rolesClaim // loose checks
    if (ref) console.log(`SERVICE_ROLE_KEY ref: ${ref}`)
    if (role) console.log(`SERVICE_ROLE_KEY role: ${Array.isArray(role) ? role.join(',') : role}`)
    if (!ref) {
      console.warn('SERVICE_ROLE_KEY appears malformed: cannot read ref (legacy JWT).')
    } else if (ref !== projectRefFromUrl) {
      console.error(`SERVICE_ROLE_KEY project ref mismatch. Key ref="${ref}" but URL ref="${projectRefFromUrl}". Use a key from the same Supabase project.`)
      process.exit(1)
    }
  } else {
    console.log('Using new Secret API Key (non-JWT). Skipping JWT ref validation.')
  }
} catch (e) {
  console.warn('Could not validate SERVICE_ROLE_KEY against URL:', e)
}
const supabase = createClient(url, serviceKey)

// Optional: quick sanity check call to surface early 401s
async function sanityCheck() {
  try {
    const { data, error, status } = await supabase.from('traders').select('id').limit(1)
    if (error) {
      console.error('Sanity check failed:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        status
      })
      process.exit(1)
    } else {
      console.log('Sanity check OK (can access traders).')
    }
  } catch (e) {
    console.error('Sanity check exception:', e)
    process.exit(1)
  }
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

async function upsertTrader(t: any) {
  // Manual upsert by name to avoid requiring a DB unique constraint
  const { data: rows, error: qErr } = await supabase
    .from('traders')
    .select('id')
    .eq('name', t.name)
    .limit(1)

  if (qErr) throw qErr

  const payload = {
    name: t.name,
    description: t.description,
    yield_rate: t.yield_rate,
    win_rate: t.win_rate,
    profit_loss_ratio: t.profit_loss_ratio,
    total_signals: t.total_signals,
    tags: t.tags,
    avatar_url: t.avatar_url,
  }

  if (rows && rows.length > 0) {
    const id = rows[0].id
    const { error: updErr } = await supabase
      .from('traders')
      .update(payload)
      .eq('id', id)
    if (updErr) throw updErr
  } else {
    const { error: insErr } = await supabase
      .from('traders')
      .insert(payload)
    if (insErr) throw insErr
  }
}

async function main() {
  await sanityCheck()
  const samples = [
    { name: 'WWG-Woods', avatar_url: 'https://i.pravatar.cc/150?u=wwg-woods' },
    { name: 'WWG-Jonh', avatar_url: 'https://i.pravatar.cc/150?u=jonh' },
    { name: 'WWG-Hbj', avatar_url: 'https://i.pravatar.cc/150?u=hbj' },
    { name: '量化大师', avatar_url: 'https://i.pravatar.cc/150?u=quant' },
    { name: '趋势猎人', avatar_url: 'https://i.pravatar.cc/150?u=hunter' },
    { name: '波段之王', avatar_url: 'https://i.pravatar.cc/150?u=swing' },
    { name: '合约常胜军', avatar_url: 'https://i.pravatar.cc/150?u=futures' },
    { name: 'BTC信仰者', avatar_url: 'https://i.pravatar.cc/150?u=btc' },
    { name: '短线快枪手', avatar_url: 'https://i.pravatar.cc/150?u=quick' },
    { name: 'ETH布道者', avatar_url: 'https://i.pravatar.cc/150?u=eth' },
    { name: 'Alpha Seeker', avatar_url: 'https://i.pravatar.cc/150?u=alpha' },
    { name: '狙击涨停板', avatar_url: 'https://i.pravatar.cc/150?u=limit-up' },
    { name: '抄底王', avatar_url: 'https://i.pravatar.cc/150?u=dip' },
    { name: '币圈巴菲特', avatar_url: 'https://i.pravatar.cc/150?u=buffett' },
  ].map((s, i) => {
    const yieldRate = Math.round(rand(20, 300) * 100) / 100
    const winRate = Math.round(rand(50, 98) * 100) / 100
    const plr = Math.round(rand(1.5, 10.0) * 100) / 100
    const total = Math.floor(rand(80, 1500))
    const desc = `资深交易员，偏好趋势/波段/风控，示例 #${i + 1}`
    return {
      ...s,
      description: desc,
      yield_rate: yieldRate,
      win_rate: winRate,
      profit_loss_ratio: plr,
      total_signals: total,
      tags: ['趋势', '风控', i % 2 ? '波段' : '动量'],
    }
  })

  for (const t of samples) {
    await upsertTrader(t)
    console.log('upserted:', t.name)
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
