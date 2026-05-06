'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

type Product = {
  id: string
  naam: string
  prijs: number
  aantal: number
  foto_url: string | null
}

export default function HomePage() {
  const [producten, setProducten] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toevoegend, setToevoegend] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function laadProducten() {
      const { data } = await supabase
        .from('producten')
        .select('id, naam, prijs, aantal, foto_url')
        .order('created_at', { ascending: false })
      setProducten(data || [])
      setLoading(false)
    }
    laadProducten()
  }, [])

  async function voegToeAanWinkelmand(productId: string) {
    setToevoegend(productId)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: winkelmand } = await supabase
      .from('winkelmand')
      .select('id')
      .eq('gebruiker_id', user.id)
      .single()

    let winkelmandId = winkelmand?.id

    if (!winkelmandId) {
      const { data: nieuw } = await supabase
        .from('winkelmand')
        .insert({ gebruiker_id: user.id })
        .select('id')
        .single()
      winkelmandId = nieuw?.id
    }

    if (!winkelmandId) {
      setToevoegend(null)
      return
    }

    const { data: bestaandItem } = await supabase
      .from('winkelmand_items')
      .select('id, aantal')
      .eq('winkelmand_id', winkelmandId)
      .eq('product_id', productId)
      .maybeSingle()

    if (bestaandItem) {
      await supabase
        .from('winkelmand_items')
        .update({ aantal: bestaandItem.aantal + 1 })
        .eq('id', bestaandItem.id)
    } else {
      await supabase
        .from('winkelmand_items')
        .insert({ winkelmand_id: winkelmandId, product_id: productId, aantal: 1 })
    }

    setToevoegend(null)
  }

  if (loading) {
    return <div className="text-[#888888] text-sm">Laden...</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-8">Producten</h1>

      {producten.length === 0 ? (
        <p className="text-[#888888] text-sm">Nog geen producten beschikbaar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {producten.map((product) => (
            <div
              key={product.id}
              className="border border-[#E5E5E5] rounded bg-white overflow-hidden"
            >
              <div className="aspect-square bg-[#F5F5F5] relative">
                {product.foto_url ? (
                  <Image
                    src={product.foto_url}
                    alt={product.naam}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#888888] text-xs">
                    Geen foto
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{product.naam}</p>
                    <p className="text-sm text-[#888888] mt-0.5">€{product.prijs.toFixed(2)}</p>
                  </div>
                  {product.aantal === 0 && (
                    <span className="text-xs text-[#888888] border border-[#E5E5E5] px-2 py-0.5 rounded-sm whitespace-nowrap">
                      Uitverkocht
                    </span>
                  )}
                </div>

                <button
                  onClick={() => voegToeAanWinkelmand(product.id)}
                  disabled={product.aantal === 0 || toevoegend === product.id}
                  className="w-full text-xs font-medium uppercase tracking-wide py-2 px-4 rounded-sm transition-colors
                    bg-[#111111] text-white hover:bg-[#333333]
                    disabled:bg-[#E5E5E5] disabled:text-[#888888] disabled:cursor-not-allowed"
                >
                  {toevoegend === product.id ? 'Bezig...' : product.aantal === 0 ? 'Uitverkocht' : 'Toevoegen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
