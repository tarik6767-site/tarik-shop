'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { useRouter } from 'next/navigation'

export default function WachtwoordResetPage() {
  const [wachtwoord, setWachtwoord] = useState('')
  const [bevestig, setBevestig] = useState('')
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [klaar, setKlaar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase plaatst de sessie automatisch via de URL hash na de redirect
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Gebruiker is klaar om wachtwoord te resetten
      }
    })
  }, [])

  async function resetWachtwoord(e: React.FormEvent) {
    e.preventDefault()
    if (wachtwoord !== bevestig) {
      setFout('Wachtwoorden komen niet overeen.')
      return
    }
    if (wachtwoord.length < 6) {
      setFout('Wachtwoord moet minimaal 6 tekens zijn.')
      return
    }

    setLoading(true)
    setFout('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: wachtwoord })

    if (error) {
      setFout(error.message)
    } else {
      setKlaar(true)
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        {klaar ? (
          <div className="text-center">
            <p className="text-sm text-[#111111] font-medium mb-2">Wachtwoord gewijzigd</p>
            <p className="text-sm text-[#888888]">Je wordt doorgestuurd naar inloggen...</p>
          </div>
        ) : (
          <form onSubmit={resetWachtwoord} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
                Nieuw wachtwoord
              </label>
              <input
                type="password"
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                required
                minLength={6}
                placeholder="Minimaal 6 tekens"
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
                  placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
                Bevestig wachtwoord
              </label>
              <input
                type="password"
                value={bevestig}
                onChange={(e) => setBevestig(e.target.value)}
                required
                placeholder="Herhaal wachtwoord"
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
                  placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {fout && <p className="text-xs text-red-500">{fout}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
                py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              {loading ? 'Opslaan...' : 'Wachtwoord instellen'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
