'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Link from 'next/link'

export default function RegistrerenPage() {
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function registreer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFout('')

    const { data, error } = await supabase.auth.signUp({ email, password: wachtwoord })

    if (error) {
      setFout(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setFout('Er ging iets mis. Probeer het opnieuw.')
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase.from('gebruiker').insert({
      id: data.user.id,
      naam,
      email,
    })

    if (dbError) {
      setFout('Account aanmaken mislukt: ' + dbError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        <form onSubmit={registreer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
              Naam
            </label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              placeholder="Voornaam Achternaam"
              className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
                placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
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
              placeholder="jij@voorbeeld.nl"
              className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
                placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
              Wachtwoord
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

          {fout && <p className="text-xs text-red-500">{fout}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
              py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>

        <p className="text-center text-xs text-[#888888] mt-6">
          Al een account?{' '}
          <Link href="/login" className="text-[#111111] hover:underline">
            Inloggen
          </Link>
        </p>
      </div>
    </div>
  )
}
