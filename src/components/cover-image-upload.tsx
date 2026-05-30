"use client"

import * as React from "react"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload"
import { PlusIcon, XSmallIcon } from "@/components/icons"

interface CoverImageUploadProps {
  value?: File[]
  onValueChange?: (files: File[]) => void
  maxFiles?: number
}

export function CoverImageUpload({
  value,
  onValueChange,
  maxFiles = 9,
}: CoverImageUploadProps) {
  const [files, setFiles] = React.useState<File[]>(value ?? [])
  const [previews, setPreviews] = React.useState<string[]>([])

  const isControlled = value !== undefined
  const currentFiles = isControlled ? value : files

  React.useEffect(() => {
    const urls = currentFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [currentFiles])

  function handleValueChange(newFiles: File[]) {
    if (!isControlled) setFiles(newFiles)
    onValueChange?.(newFiles)
  }

  function removeFile(index: number) {
    const next = currentFiles.filter((_, i) => i !== index)
    handleValueChange(next)
  }

  return (
    <FileUpload
      maxFiles={maxFiles}
      maxSize={5 * 1024 * 1024}
      accept="image/*"
      value={currentFiles}
      onValueChange={handleValueChange}
      multiple={maxFiles > 1}
    >
      <div className="flex gap-2">
        {/* 已上传的图片 — Figma: 96x96, rounded 10px */}
        {currentFiles.map((_, index) => (
          <div
            key={index}
            className="relative size-24 shrink-0 rounded-[10px] overflow-hidden bg-[#101828]"
          >
            {previews[index] ? (
              <img
                src={previews[index]}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
            {/* 删除按钮 — Figma: 20x20, bg rgba(0,0,0,0.6), rounded 4px, 右上角 */}
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="absolute top-1 right-1 size-5 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <XSmallIcon />
            </button>
          </div>
        ))}

        {/* 上传占位 — Figma: 96x96, 虚线边框, bg #F9FAFB */}
        {currentFiles.length < maxFiles && (
          <FileUploadDropzone className="size-24 shrink-0 rounded-[10px] border-2 border-dashed border-[#D1D5DC] bg-[#F9FAFB] hover:bg-[#F3F4F6] flex items-center justify-center p-0 cursor-pointer transition-colors">
            <FileUploadTrigger className="size-full flex items-center justify-center">
              <PlusIcon className="text-[#99A1AF]" />
            </FileUploadTrigger>
          </FileUploadDropzone>
        )}
      </div>
    </FileUpload>
  )
}
