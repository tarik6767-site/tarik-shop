'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import ProductFormulier from '@/components/ProductFormulier'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Product = {
  id: string
  naam: string
  prijs: number
  aantal: number
  foto_url: string | null
}

export default function BewerkProductPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const params = useParams()

  useEffect(() => {
    async function laadProduct() {
      const { data } = await supabase
        .from('producten')
        .select('id, naam, prijs, aantal, foto_url')
        .eq('id', params.id)
        .single()
      setProduct(data)
      setLoading(false)
    }
    laadProduct()
  }, [params.id])

  if (loading) return <div className="text-[#888888] text-sm">Laden...</div>
  if (!product) return <div className="text-[#888888] text-sm">Product niet gevonden.</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/medewerker/producten" className="text-[#888888] hover:text-[#111111] transition-colors text-sm">
          ← Terug
        </Link>
        <span className="text-[#E5E5E5]">/</span>
        <h1 className="text-lg font-medium">Product bewerken</h1>
      </div>
      <ProductFormulier initieel={product} />
    </div>
  )
}
