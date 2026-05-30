import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const issuer = "xxgame"
const audience = "xxgame"

export async function signJWT(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer,
    audience,
  })
  return payload
}
