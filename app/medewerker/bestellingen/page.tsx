'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type BestellingItem = {
  id: string
  aantal: number
  prijs_per_stuk: number
  product: { naam: string }
}

type Bestelling = {
  id: string
  status: string
  created_at: string
  gebruiker: { naam: string; email: string }
  bestelling_items: BestellingItem[]
}

export default function MedewerkerBestellingenPage() {
  const [bestellingen, setBestellingen] = useState<Bestelling[]>([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkMedewerker() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('medewerker')
        .select('id')
        .eq('gebruiker_id', user.id)
        .maybeSingle()

      if (!data) { router.push('/'); return }

      laadBestellingen()
    }
    checkMedewerker()
  }, [])

  async function laadBestellingen() {
    const { data } = await supabase
      .from('bestellingen')
      .select(`
        id, status, created_at,
        gebruiker:gebruiker(naam, email),
        bestelling_items(id, aantal, prijs_per_stuk, product:producten(naam))
      `)
      .order('created_at', { ascending: false })

    setBestellingen((data as unknown as Bestelling[]) || [])
    setLoading(false)
  }

  async function updateStatus(bestelling: Bestelling, nieuweStatus: string) {
    setBezig(bestelling.id)

    await supabase
      .from('bestellingen')
      .update({ status: nieuweStatus })
      .eq('id', bestelling.id)

    if (nieuweStatus === 'geannuleerd') {
      for (const item of bestelling.bestelling_items) {
        const { data: product } = await supabase
          .from('producten')
          .select('aantal, naam')
          .eq('naam', item.product.naam)
          .single()

        if (product) {
          await supabase
            .from('producten')
            .update({ aantal: product.aantal + item.aantal })
            .eq('naam', item.product.naam)
        }
      }
    }

    const mailBody = nieuweStatus === 'goedgekeurd'
      ? `<p>Hoi ${bestelling.gebruiker.naam}, je bestelling is goedgekeurd en komt eraan.</p>`
      : `<p>Hoi ${bestelling.gebruiker.naam}, helaas is je bestelling geannuleerd.</p>`

    const onderwerp = nieuweStatus === 'goedgekeurd'
      ? 'Je bestelling is goedgekeurd'
      : 'Je bestelling is geannuleerd'

    await supabase.functions.invoke('stuur-mail', {
      body: { naar: bestelling.gebruiker.email, onderwerp, body: mailBody },
    })

    setBestellingen((prev) =>
      prev.map((b) => b.id === bestelling.id ? { ...b, status: nieuweStatus } : b)
    )
    setBezig(null)
  }

  const statusLabel: Record<string, string> = {
    in_behandeling: 'In behandeling',
    goedgekeurd: 'Goedgekeurd',
    geannuleerd: 'Geannuleerd',
  }

  const statusKleur: Record<string, string> = {
    in_behandeling: 'text-[#888888]',
    goedgekeurd: 'text-green-600',
    geannuleerd: 'text-red-500',
  }

  if (loading) return <div className="text-[#888888] text-sm">Laden...</div>

  return (
    <div>
      <h1 className="text-lg font-medium mb-8">Bestellingen</h1>

      {bestellingen.length === 0 ? (
        <p className="text-[#888888] text-sm">Nog geen bestellingen.</p>
      ) : (
        <div className="space-y-3">
          {bestellingen.map((bestelling) => (
            <div key={bestelling.id} className="border border-[#E5E5E5] rounded-sm bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-[#111111]">{bestelling.gebruiker.naam}</p>
                  <p className="text-xs text-[#888888] mt-0.5">{bestelling.gebruiker.email}</p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    {new Date(bestelling.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusKleur[bestelling.status] || 'text-[#888888]'}`}>
                  {statusLabel[bestelling.status] || bestelling.status}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                {bestelling.bestelling_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-[#888888]">
                    <span>{item.product.naam} × {item.aantal}</span>
                    <span>€{(item.prijs_per_stuk * item.aantal).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium text-[#111111] pt-1 border-t border-[#F0F0F0]">
                  <span>Totaal</span>
                  <span>€{bestelling.bestelling_items.reduce((s, i) => s + i.prijs_per_stuk * i.aantal, 0).toFixed(2)}</span>
                </div>
              </div>

              {bestelling.status === 'in_behandeling' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(bestelling, 'goedgekeurd')}
                    disabled={bezig === bestelling.id}
                    className="text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-sm bg-[#111111] text-white
                      hover:bg-[#333333] transition-colors disabled:opacity-50"
                  >
                    Goedkeuren
                  </button>
                  <button
                    onClick={() => updateStatus(bestelling, 'geannuleerd')}
                    disabled={bezig === bestelling.id}
                    className="text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-sm border border-[#E5E5E5]
                      text-[#888888] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    Annuleren
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
