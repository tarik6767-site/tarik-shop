'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/Logo'
import Link from 'next/link'

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFout('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/wachtwoord-reset&type=recovery`,
    })

    if (error) {
      setFout(error.message)
    } else {
      setVerzonden(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        {verzonden ? (
          <div className="text-center">
            <p className="text-sm text-[#111111] font-medium mb-2">Check je e-mail</p>
            <p className="text-sm text-[#888888]">
              We hebben een resetlink gestuurd naar <span className="text-[#111111]">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={verstuur} className="space-y-4">
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

            {fout && <p className="text-xs text-red-500">{fout}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
                py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              {loading ? 'Versturen...' : 'Resetlink sturen'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[#888888] mt-6">
          <Link href="/login" className="text-[#111111] hover:underline">
            Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  )
}
