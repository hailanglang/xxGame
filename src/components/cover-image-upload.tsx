"use client"

import { useState } from "react"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload"
import { PlusIcon, XSmallIcon } from "@/components/icons"
import { api } from "@/lib/api-client"
import type { UploadResponse } from "@/types/api"

interface CoverImageUploadProps {
  value?: string[]
  onValueChange?: (urls: string[]) => void
  maxFiles?: number
}

export function CoverImageUpload({
  value,
  onValueChange,
  maxFiles = 9,
}: CoverImageUploadProps) {
  const [urls, setUrls] = useState<string[]>(value ?? [])
  const [uploading, setUploading] = useState(false)

  const currentUrls = value !== undefined ? value : urls

  async function handleFilesChange(newFiles: File[]) {
    setUploading(true)
    const newUrls: string[] = []
    console.log('newFiles', newFiles)
    for (const file of newFiles) {
      const formData = new FormData()
      formData.append("file", file)
      try {
        const data = await api<UploadResponse>("/api/upload", {
          method: "POST",
          body: formData,
        })
        newUrls.push(data.imageUrl)
      } catch {
        // 单张失败跳过
      }
    }
    const all = [...currentUrls, ...newUrls]
    if (value === undefined) setUrls(all)
    onValueChange?.(all)
    setUploading(false)
  }

  function removeUrl(index: number) {
    const next = currentUrls.filter((_, i) => i !== index)
    if (value === undefined) setUrls(next)
    onValueChange?.(next)
  }

  return (
    <FileUpload
      maxFiles={maxFiles}
      maxSize={5 * 1024 * 1024}
      accept="image/*"
      onValueChange={handleFilesChange}
      multiple={maxFiles > 1}
    >
      <div className="flex gap-2 flex-wrap">
        {currentUrls.map((url, index) => (
          <div
            key={url}
            className="relative size-24 shrink-0 rounded-[10px] overflow-hidden bg-[#101828]"
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeUrl(index)}
              className="absolute top-1 right-1 size-5 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <XSmallIcon />
            </button>
          </div>
        ))}

        {currentUrls.length < maxFiles && (
          <FileUploadDropzone className="size-24 shrink-0 rounded-[10px] border-2 border-dashed border-[#D1D5DC] bg-[#F9FAFB] hover:bg-[#F3F4F6] flex items-center justify-center p-0 cursor-pointer transition-colors">
            <FileUploadTrigger className="size-full flex items-center justify-center">
              {uploading ? (
                <span className="size-4 border-2 border-[#99A1AF]/30 border-t-[#99A1AF] rounded-full animate-spin" />
              ) : (
                <PlusIcon className="text-[#99A1AF]" />
              )}
            </FileUploadTrigger>
          </FileUploadDropzone>
        )}
      </div>
    </FileUpload>
  )
}
