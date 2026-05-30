import { verifyJWT } from "@/lib/jwt"

export interface AuthUser {
  userId: string
  phone: string
  role: string
}

export async function getUserFromHeaders(request: Request): Promise<AuthUser | null> {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null

  try {
    const payload = await verifyJWT(auth.slice(7))
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}
