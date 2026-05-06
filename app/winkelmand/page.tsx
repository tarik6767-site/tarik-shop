'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type WinkelmandItem = {
  id: string
  aantal: number
  product: {
    id: string
    naam: string
    prijs: number
    foto_url: string | null
  }
}

export default function WinkelmandPage() {
  const [items, setItems] = useState<WinkelmandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [bevestiging, setBevestiging] = useState('')
  const supabase = createClient()

  useEffect(() => {
    laadWinkelmand()
  }, [])

  async function laadWinkelmand() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: winkelmand } = await supabase
      .from('winkelmand')
      .select('id')
      .eq('gebruiker_id', user.id)
      .maybeSingle()

    if (!winkelmand) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('winkelmand_items')
      .select('id, aantal, product:producten(id, naam, prijs, foto_url)')
      .eq('winkelmand_id', winkelmand.id)

    setItems((data as unknown as WinkelmandItem[]) || [])
    setLoading(false)
  }

  async function updateAantal(itemId: string, nieuwAantal: number) {
    if (nieuwAantal < 1) {
      await supabase.from('winkelmand_items').delete().eq('id', itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      return
    }

    await supabase.from('winkelmand_items').update({ aantal: nieuwAantal }).eq('id', itemId)
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, aantal: nieuwAantal } : i))
    )
  }

  async function plaatsBestelling() {
    setBezig(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: gebruiker } = await supabase
      .from('gebruiker')
      .select('naam, email')
      .eq('id', user.id)
      .single()

    const { data: bestelling } = await supabase
      .from('bestellingen')
      .insert({ gebruiker_id: user.id, status: 'in_behandeling' })
      .select('id')
      .single()

    if (!bestelling) { setBezig(false); return }

    const bestellingItems = items.map((item) => ({
      bestelling_id: bestelling.id,
      product_id: item.product.id,
      aantal: item.aantal,
      prijs_per_stuk: item.product.prijs,
    }))

    await supabase.from('bestelling_items').insert(bestellingItems)

    for (const item of items) {
      const { data: product } = await supabase
        .from('producten')
        .select('aantal')
        .eq('id', item.product.id)
        .single()

      if (product) {
        await supabase
          .from('producten')
          .update({ aantal: Math.max(0, product.aantal - item.aantal) })
          .eq('id', item.product.id)
      }
    }

    const { data: winkelmand } = await supabase
      .from('winkelmand')
      .select('id')
      .eq('gebruiker_id', user.id)
      .single()

    if (winkelmand) {
      await supabase.from('winkelmand_items').delete().eq('winkelmand_id', winkelmand.id)
    }

    await supabase.functions.invoke('stuur-mail', {
      body: {
        naar: gebruiker?.email,
        onderwerp: 'Bedankt voor je bestelling',
        body: `<p>Hoi ${gebruiker?.naam}, bedankt voor je bestelling bij tarik-shop.<br>We gaan er zo snel mogelijk mee aan de slag.</p>`,
      },
    })

    setItems([])
    setBevestiging('Je bestelling is geplaatst. Check je e-mail voor de bevestiging.')
    setBezig(false)
  }

  const totaal = items.reduce((sum, item) => sum + item.product.prijs * item.aantal, 0)

  if (loading) return <div className="text-[#888888] text-sm">Laden...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-medium mb-8">Winkelmand</h1>

      {bevestiging && (
        <div className="border border-[#E5E5E5] rounded-sm p-4 mb-6 text-sm text-[#111111] bg-white">
          {bevestiging}
        </div>
      )}

      {items.length === 0 && !bevestiging ? (
        <p className="text-[#888888] text-sm">Je winkelmand is leeg.</p>
      ) : items.length > 0 ? (
        <div>
          <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-sm bg-white">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-[#F5F5F5] rounded-sm flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.product.naam}</p>
                  <p className="text-xs text-[#888888] mt-0.5">€{item.product.prijs.toFixed(2)} per stuk</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateAantal(item.id, item.aantal - 1)}
                    className="w-7 h-7 border border-[#E5E5E5] rounded-sm text-sm text-[#111111] hover:border-[#111111] transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-sm w-6 text-center">{item.aantal}</span>
                  <button
                    onClick={() => updateAantal(item.id, item.aantal + 1)}
                    className="w-7 h-7 border border-[#E5E5E5] rounded-sm text-sm text-[#111111] hover:border-[#111111] transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-medium w-16 text-right">
                  €{(item.product.prijs * item.aantal).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-wide">Totaal</p>
              <p className="text-lg font-medium text-[#111111]">€{totaal.toFixed(2)}</p>
            </div>
            <button
              onClick={plaatsBestelling}
              disabled={bezig}
              className="bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
                px-6 py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              {bezig ? 'Bezig...' : 'Bestelling plaatsen'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
