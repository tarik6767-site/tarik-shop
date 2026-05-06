import ProductFormulier from '@/components/ProductFormulier'
import Link from 'next/link'

export default function NieuwProductPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/medewerker/producten" className="text-[#888888] hover:text-[#111111] transition-colors text-sm">
          ← Terug
        </Link>
        <span className="text-[#E5E5E5]">/</span>
        <h1 className="text-lg font-medium">Nieuw product</h1>
      </div>
      <ProductFormulier />
    </div>
  )
}
