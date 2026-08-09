"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export interface AudioAnalyserOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
}

function createAudioAnalyser(
  mediaStream: MediaStream,
  options: AudioAnalyserOptions = {}
) {
  const audioContext = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )()
  const source = audioContext.createMediaStreamSource(mediaStream)
  const analyser = audioContext.createAnalyser()

  if (options.fftSize) analyser.fftSize = options.fftSize
  if (options.smoothingTimeConstant !== undefined) {
    analyser.smoothingTimeConstant = options.smoothingTimeConstant
  }
  if (options.minDecibels !== undefined) {
    analyser.minDecibels = options.minDecibels
  }
  if (options.maxDecibels !== undefined) {
    analyser.maxDecibels = options.maxDecibels
  }

  source.connect(analyser)

  const resumeAudioContext = () => {
    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined)
    }
  }

  resumeAudioContext()
  window.addEventListener("pointerdown", resumeAudioContext)
  window.addEventListener("keydown", resumeAudioContext)

  const cleanup = () => {
    window.removeEventListener("pointerdown", resumeAudioContext)
    window.removeEventListener("keydown", resumeAudioContext)
    source.disconnect()
    void audioContext.close()
  }

  return { analyser, cleanup }
}

function hasAudioTracks(
  mediaStream: MediaStream | null | undefined
): mediaStream is MediaStream {
  return Boolean(mediaStream?.getAudioTracks().length)
}

export function useAudioVolume(
  mediaStream?: MediaStream | null,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 }
) {
  const { fftSize, maxDecibels, minDecibels, smoothingTimeConstant } = options
  const [volume, setVolume] = useState(0)
  const volumeRef = useRef(0)
  const frameId = useRef<number | undefined>(undefined)
  const memoizedOptions = useMemo(
    () => ({ fftSize, maxDecibels, minDecibels, smoothingTimeConstant }),
    [fftSize, maxDecibels, minDecibels, smoothingTimeConstant]
  )

  useEffect(() => {
    if (!hasAudioTracks(mediaStream)) {
      setVolume(0)
      volumeRef.current = 0
      return
    }

    const { analyser, cleanup } = createAudioAnalyser(
      mediaStream,
      memoizedOptions
    )
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let lastUpdate = 0
    const updateInterval = 1000 / 30

    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdate >= updateInterval) {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let index = 0; index < dataArray.length; index += 1) {
          const value = dataArray[index]
          sum += value * value
        }
        const nextVolume = Math.sqrt(sum / dataArray.length) / 255
        if (Math.abs(nextVolume - volumeRef.current) > 0.01) {
          volumeRef.current = nextVolume
          setVolume(nextVolume)
        }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(updateVolume)
    }

    frameId.current = requestAnimationFrame(updateVolume)
    return () => {
      cleanup()
      if (frameId.current) cancelAnimationFrame(frameId.current)
    }
  }, [mediaStream, memoizedOptions])

  return volume
}

export interface MultiBandVolumeOptions {
  bands?: number
  loPass?: number
  hiPass?: number
  updateInterval?: number
  analyserOptions?: AudioAnalyserOptions
}

const multibandDefaults: MultiBandVolumeOptions = {
  bands: 5,
  loPass: 100,
  hiPass: 600,
  updateInterval: 32,
  analyserOptions: { fftSize: 2048 },
}

function normalizeDb(value: number) {
  if (value === -Infinity) return 0
  const minDb = -100
  const maxDb = -10
  const db = 1 - (Math.max(minDb, Math.min(maxDb, value)) * -1) / 100
  return Math.sqrt(db)
}

export function useMultibandVolume(
  mediaStream?: MediaStream | null,
  options: MultiBandVolumeOptions = {}
) {
  const { analyserOptions, bands, hiPass, loPass, updateInterval } = options
  const opts = useMemo(
    () => ({
      ...multibandDefaults,
      analyserOptions,
      bands,
      hiPass,
      loPass,
      updateInterval,
    }),
    [analyserOptions, bands, hiPass, loPass, updateInterval]
  )
  const [frequencyBands, setFrequencyBands] = useState<number[]>(() =>
    new Array(opts.bands).fill(0)
  )
  const bandsRef = useRef<number[]>(new Array(opts.bands).fill(0))
  const frameId = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!hasAudioTracks(mediaStream)) {
      const emptyBands = new Array(opts.bands).fill(0)
      setFrequencyBands(emptyBands)
      bandsRef.current = emptyBands
      return
    }

    const { analyser, cleanup } = createAudioAnalyser(
      mediaStream,
      opts.analyserOptions
    )
    const dataArray = new Float32Array(analyser.frequencyBinCount)
    const sliceStart = opts.loPass!
    const sliceEnd = opts.hiPass!
    const chunkSize = Math.ceil((sliceEnd - sliceStart) / opts.bands!)
    let lastUpdate = 0

    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdate >= opts.updateInterval!) {
        analyser.getFloatFrequencyData(dataArray)
        const chunks = new Array(opts.bands!)

        for (let band = 0; band < opts.bands!; band += 1) {
          let sum = 0
          let count = 0
          const startIndex = sliceStart + band * chunkSize
          const endIndex = Math.min(
            sliceStart + (band + 1) * chunkSize,
            sliceEnd
          )
          for (let index = startIndex; index < endIndex; index += 1) {
            sum += normalizeDb(dataArray[index])
            count += 1
          }
          chunks[band] = count > 0 ? sum / count : 0
        }

        const hasChanged = chunks.some(
          (value, index) => Math.abs(value - bandsRef.current[index]) > 0.01
        )
        if (hasChanged) {
          bandsRef.current = chunks
          setFrequencyBands(chunks)
        }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(updateVolume)
    }

    frameId.current = requestAnimationFrame(updateVolume)
    return () => {
      cleanup()
      if (frameId.current) cancelAnimationFrame(frameId.current)
    }
  }, [mediaStream, opts])

  return frequencyBands
}
