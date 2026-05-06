'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  initieel?: {
    id: string
    naam: string
    prijs: number
    aantal: number
    foto_url: string | null
  }
}

export default function ProductFormulier({ initieel }: Props) {
  const [naam, setNaam] = useState(initieel?.naam || '')
  const [prijs, setPrijs] = useState(initieel?.prijs?.toString() || '')
  const [aantal, setAantal] = useState(initieel?.aantal?.toString() || '0')
  const [uploading, setUploading] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [fotoUrl, setFotoUrl] = useState(initieel?.foto_url || '')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  async function uploadFoto(file: File): Promise<string | null> {
    setUploading(true)
    const bestandsnaam = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('product-fotos')
      .upload(bestandsnaam, file)

    if (error) {
      console.error('Upload error:', error)
      setFout(`Foto uploaden mislukt: ${error.message}`)
      setUploading(false)
      return null
    }

    const { data } = supabase.storage.from('product-fotos').getPublicUrl(bestandsnaam)
    setUploading(false)
    return data.publicUrl
  }

  async function slaOp(e: React.FormEvent) {
    e.preventDefault()
    setOpslaan(true)
    setFout('')

    let definitieveFotoUrl = fotoUrl

    if (fileRef.current?.files?.[0]) {
      const url = await uploadFoto(fileRef.current.files[0])
      if (!url) { setOpslaan(false); return }
      definitieveFotoUrl = url
    }

    const productData = {
      naam,
      prijs: parseFloat(prijs),
      aantal: parseInt(aantal),
      foto_url: definitieveFotoUrl || null,
    }

    if (initieel) {
      const { error } = await supabase
        .from('producten')
        .update(productData)
        .eq('id', initieel.id)

      if (error) { setFout('Opslaan mislukt.'); setOpslaan(false); return }
    } else {
      const { error } = await supabase.from('producten').insert(productData)
      if (error) { setFout('Opslaan mislukt.'); setOpslaan(false); return }
    }

    router.push('/medewerker/producten')
  }

  return (
    <form onSubmit={slaOp} className="max-w-md space-y-5">
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
          Prijs (€)
        </label>
        <input
          type="number"
          value={prijs}
          onChange={(e) => setPrijs(e.target.value)}
          required
          min="0"
          step="0.01"
          className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
            focus:outline-none focus:border-[#111111] transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
          Aantal (voorraad)
        </label>
        <input
          type="number"
          value={aantal}
          onChange={(e) => setAantal(e.target.value)}
          required
          min="0"
          className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2 text-sm text-[#111111] bg-white
            focus:outline-none focus:border-[#111111] transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#111111] mb-1.5 uppercase tracking-wide">
          Foto
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="block text-sm text-[#888888] file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border
            file:border-[#E5E5E5] file:text-xs file:font-medium file:uppercase file:tracking-wide
            file:text-[#111111] file:bg-white hover:file:border-[#111111] file:transition-colors file:cursor-pointer"
        />
        {fotoUrl && !fileRef.current?.files?.[0] && (
          <p className="text-xs text-[#888888] mt-1">Huidige foto is opgeslagen</p>
        )}
      </div>

      {fout && <p className="text-xs text-red-500">{fout}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={opslaan || uploading}
          className="bg-[#111111] text-white text-xs font-medium uppercase tracking-wide
            px-5 py-2.5 rounded-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
        >
          {opslaan || uploading ? 'Opslaan...' : 'Opslaan'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/medewerker/producten')}
          className="border border-[#E5E5E5] text-[#111111] text-xs font-medium uppercase tracking-wide
            px-5 py-2.5 rounded-sm hover:border-[#111111] transition-colors"
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}
