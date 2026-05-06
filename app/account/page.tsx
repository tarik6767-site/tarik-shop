'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [verwijderBevestiging, setVerwijderBevestiging] = useState(false)
  const [bericht, setBericht] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function laadGebruiker() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('gebruiker')
        .select('naam, email')
        .eq('id', user.id)
        .single()

      if (data) {
        setNaam(data.naam)
        setEmail(data.email)
      }
      setLoading(false)
    }
    laadGebruiker()
  }, [])

  async function slaOp(e: React.FormEvent) {
    e.preventDefault()
    setOpslaan(true)
    setBericht('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('gebruiker').update({ naam, email }).eq('id', user.id)
    setBericht('Gegevens opgeslagen.')
    setOpslaan(false)
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function verwijderAccount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('gebruiker').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="text-[#888888] text-sm">Laden...</div>

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-medium mb-8">Account</h1>

      <form onSubmit={slaOp} className="space-y-4 mb-10">
        <div>
          <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
            Naam
          </label>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            required
            className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
              focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
            E-mailadres
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
              focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        {bericht && <p className="text-xs text-[#888888]">{bericht}</p>}

        <button
          type="submit"
          disabled={opslaan}
          className="bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
            px-5 py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
        >
          {opslaan ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>

      <div className="border-t border-[#E5E5E5] pt-8 space-y-4">
        <button
          onClick={uitloggen}
          className="block text-sm text-[#888888] hover:text-[#111111] transition-colors"
        >
          Uitloggen
        </button>

        {!verwijderBevestiging ? (
          <button
            onClick={() => setVerwijderBevestiging(true)}
            className="block text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Account verwijderen
          </button>
        ) : (
          <div className="border border-red-200 rounded-sm p-4 space-y-3">
            <p className="text-sm text-[#111111]">Weet je het zeker? Dit kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3">
              <button
                onClick={verwijderAccount}
                className="text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Ja, verwijder account
              </button>
              <button
                onClick={() => setVerwijderBevestiging(false)}
                className="text-xs font-medium uppercase tracking-wide px-4 py-2 rounded-sm border border-[#E5E5E5] text-[#111111] hover:border-[#111111] transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
