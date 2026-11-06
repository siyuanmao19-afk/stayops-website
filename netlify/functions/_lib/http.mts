export function json(data: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function methodNotAllowed(allowed: string[]) {
  return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: allowed.join(', ') },
  })
}

export function safeError(reason: unknown) {
  const status = typeof reason === 'object' && reason && 'status' in reason
    ? Number((reason as { status: unknown }).status)
    : 500
  const message = reason instanceof Error ? reason.message : 'Unexpected server error.'
  return json({ error: message }, Number.isFinite(status) ? status : 500)
}


