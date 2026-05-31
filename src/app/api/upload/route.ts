import { NextRequest } from "next/server"
import { getUserFromHeaders } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { UploadResponse, ApiError } from "@/types/api"

export async function POST(request: NextRequest) {
  const user = await getUserFromHeaders(request)
  if (!user) {
    return Response.json({ error: "请先登录" } satisfies ApiError, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileHash = formData.get("fileHash") as string | null

    if (!file) {
      return Response.json({ error: "请选择文件" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "仅支持图片文件" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "文件不能超过 5MB" }, { status: 400 })
    }

    // 使用 hash 作为文件名实现去重
    const ext = file.name.split(".").pop() || "jpg"
    const hash = fileHash || crypto.randomUUID()
    const path = `${hash}.${ext}`

    const { data, error } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(data.path)

    return Response.json({ imageUrl: urlData.publicUrl } satisfies UploadResponse)
  } catch (e) {
    console.error("upload error:", e)
    return Response.json({ error: "上传失败" } satisfies ApiError, { status: 500 })
  }
}
