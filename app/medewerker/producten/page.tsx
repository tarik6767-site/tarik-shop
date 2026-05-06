'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Product = {
  id: string
  naam: string
  prijs: number
  aantal: number
  foto_url: string | null
}

export default function MedewerkerProductenPage() {
  const [producten, setProducten] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [verwijderBevestiging, setVerwijderBevestiging] = useState<string | null>(null)
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

      laadProducten()
    }
    checkMedewerker()
  }, [])

  async function laadProducten() {
    const { data } = await supabase
      .from('producten')
      .select('id, naam, prijs, aantal, foto_url')
      .order('created_at', { ascending: false })
    setProducten(data || [])
    setLoading(false)
  }

  async function verwijder(id: string) {
    await supabase.from('producten').delete().eq('id', id)
    setProducten((prev) => prev.filter((p) => p.id !== id))
    setVerwijderBevestiging(null)
  }

  if (loading) return <div className="text-[#888888] text-sm">Laden...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-medium">Producten beheren</h1>
        <Link
          href="/medewerker/producten/nieuw"
          className="bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
            px-4 py-2 rounded-sm hover:bg-[#333333] transition-colors"
        >
          + Toevoegen
        </Link>
      </div>

      {producten.length === 0 ? (
        <p className="text-[#888888] text-sm">Nog geen producten.</p>
      ) : (
        <div className="border border-[#E5E5E5] rounded-sm bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wide">Naam</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wide">Prijs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wide">Voorraad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {producten.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-[#111111]">{product.naam}</td>
                  <td className="px-4 py-3 text-[#111111]">€{product.prijs.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={product.aantal === 0 ? 'text-[#888888]' : 'text-[#111111]'}>
                      {product.aantal === 0 ? 'Uitverkocht' : product.aantal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        href={`/medewerker/producten/${product.id}`}
                        className="text-xs text-[#888888] hover:text-[#111111] transition-colors"
                      >
                        Bewerken
                      </Link>
                      {verwijderBevestiging === product.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => verwijder(product.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Bevestig
                          </button>
                          <button
                            onClick={() => setVerwijderBevestiging(null)}
                            className="text-xs text-[#888888] hover:text-[#111111]"
                          >
                            Annuleer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setVerwijderBevestiging(product.id)}
                          className="text-xs text-[#888888] hover:text-red-500 transition-colors"
                        >
                          Verwijderen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
