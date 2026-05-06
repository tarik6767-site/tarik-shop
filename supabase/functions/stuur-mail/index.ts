Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const { naar, onderwerp, body } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'tarik-shop <noreply@jouwdomein.com>',
      to: naar,
      subject: onderwerp,
      html: body,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify({ ok: res.ok, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
