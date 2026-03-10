"use client"

import {
  ORG_BANNER_ASPECT_RATIO,
  ORG_BANNER_MIN_HEIGHT,
  ORG_BANNER_MIN_WIDTH,
} from "@/lib/organization/banner-spec"

export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageDimensions = {
  width: number
  height: number
}

export async function loadImageDimensions(imageSrc: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageSrc
  })
}

export function validateBannerImageDimensions(dimensions: ImageDimensions): string | null {
  if (dimensions.width < ORG_BANNER_MIN_WIDTH || dimensions.height < ORG_BANNER_MIN_HEIGHT) {
    return `Banner image is too small. Minimum ${ORG_BANNER_MIN_WIDTH}×${ORG_BANNER_MIN_HEIGHT}px.`
  }
  return null
}

export function validateBannerCropDimensions(area: CropArea): string | null {
  if (area.width < ORG_BANNER_MIN_WIDTH || area.height < ORG_BANNER_MIN_HEIGHT) {
    return `Selected crop is too tight. Zoom out so the crop is at least ${ORG_BANNER_MIN_WIDTH}×${ORG_BANNER_MIN_HEIGHT}px.`
  }
  return null
}

export async function getCroppedBannerBlob(imageSrc: string, area: CropArea): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const maxExportWidth = 4096
      const maxExportHeight = Math.round(maxExportWidth / ORG_BANNER_ASPECT_RATIO)
      const cropWidth = Math.max(1, Math.round(area.width))
      const cropHeight = Math.max(1, Math.round(area.height))
      const scale = Math.min(1, maxExportWidth / cropWidth, maxExportHeight / cropHeight)
      const outputWidth = Math.max(1, Math.round(cropWidth * scale))
      const outputHeight = Math.max(1, Math.round(cropHeight * scale))

      const canvas = document.createElement("canvas")
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        outputWidth,
        outputHeight,
      )

      canvas.toBlob((blob) => resolve(blob), "image/webp", 1)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}
