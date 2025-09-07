import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function ExampleTraderRedirect({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const idParam = searchParams?.id || ''
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // 1) If a valid id is provided, redirect immediately
  if (uuidRe.test(idParam)) {
    redirect(`/trader/${idParam}`)
  }

  // 2) Try to find the first trader via RPC
  try {
    const { data } = await supabase.rpc('get_traders_paged', {
      page: 1,
      page_size: 1,
      q: null,
      sort_by: 'score',
      order_by: 'desc',
    })
    const first = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (first?.id) redirect(`/trader/${first.id}`)
  } catch {}

  // 3) Fallback to a known sample UUID
  redirect('/trader/549d9ac8-e8f6-43b0-9a65-20e3c813fa3e')
}
