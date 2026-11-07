import { getUser } from '@netlify/identity'
import { json } from './http.mts'

export async function requireAuth() {
  const user = await getUser()
  return user ? null : json({ error: 'Please sign in to use the StayOps workspace.' }, 401)
}

