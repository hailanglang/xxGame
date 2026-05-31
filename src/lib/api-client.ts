import { useUserStore } from "@/stores/user-store"

type ApiBody = Record<string, unknown> | FormData

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: ApiBody
}

export async function api<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = useUserStore.getState().token
  const { body, headers, ...rest } = options

  const isFormData = body instanceof FormData

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw data
  return data
}
