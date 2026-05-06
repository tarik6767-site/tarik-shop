'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isMedewerker, setIsMedewerker] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkUser() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) return

      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsLoggedIn(true)

      const { data } = await supabase
        .from('medewerker')
        .select('id')
        .eq('gebruiker_id', user.id)
        .maybeSingle()

      setIsMedewerker(!!data)
    }
    checkUser()
  }, [])

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm ${
        pathname === href
          ? 'text-[#111111] font-medium'
          : 'text-[#888888] hover:text-[#111111] transition-colors'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-6">
          {navLink('/', 'Producten')}
          {isLoggedIn && navLink('/winkelmand', 'Winkelmand')}
          {isMedewerker && navLink('/medewerker/producten', 'Producten beheren')}
          {isMedewerker && navLink('/medewerker/bestellingen', 'Bestellingen')}
          {isLoggedIn
            ? navLink('/account', 'Account')
            : navLink('/login', 'Inloggen')}
        </div>
      </div>
    </nav>
  )
}
