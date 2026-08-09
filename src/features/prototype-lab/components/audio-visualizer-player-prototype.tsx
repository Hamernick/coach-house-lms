"use client"

import * as React from "react"

import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
  useAudioPlayer,
} from "@/components/ui/audio-player"
import { BarVisualizer } from "@/components/ui/bar-visualizer"

const PRESENTER_AUDIO_ITEM = {
  id: "presenters-audio-from-opc",
  src: "/api/prototypes/presenter-audio",
}

type AudioElementWithCapture = HTMLAudioElement & {
  captureStream?: () => MediaStream
  mozCaptureStream?: () => MediaStream
}

function useCapturedAudioStream(audio: HTMLAudioElement | null) {
  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null)

  React.useEffect(() => {
    if (!audio) return

    const captureSource = audio as AudioElementWithCapture
    const capturedStream =
      captureSource.captureStream?.() ?? captureSource.mozCaptureStream?.()
    const commitCapturedStream = () => {
      setMediaStream(
        capturedStream?.getAudioTracks().length ? capturedStream : null
      )
    }

    commitCapturedStream()
    capturedStream?.addEventListener("addtrack", commitCapturedStream)
    audio.addEventListener("canplay", commitCapturedStream)
    audio.addEventListener("loadedmetadata", commitCapturedStream)
    audio.addEventListener("playing", commitCapturedStream)

    return () => {
      capturedStream?.removeEventListener("addtrack", commitCapturedStream)
      audio.removeEventListener("canplay", commitCapturedStream)
      audio.removeEventListener("loadedmetadata", commitCapturedStream)
      audio.removeEventListener("playing", commitCapturedStream)
      capturedStream?.getTracks().forEach((track) => track.stop())
      setMediaStream(null)
    }
  }, [audio])

  return mediaStream
}

function AudioVisualizerPlayerSurface() {
  const { ref, isItemActive, isPlaying, setActiveItem } = useAudioPlayer()
  const mediaStream = useCapturedAudioStream(ref.current)
  const presenterAudioActive = isItemActive(PRESENTER_AUDIO_ITEM.id)

  React.useEffect(() => {
    if (presenterAudioActive) return
    void setActiveItem(PRESENTER_AUDIO_ITEM)
  }, [presenterAudioActive, setActiveItem])

  return (
    <div className="bg-background flex min-h-[72vh] w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-[720px]">
        <BarVisualizer
          state={isPlaying ? "speaking" : "listening"}
          barCount={31}
          centerAlign
          mediaStream={mediaStream}
          demo={!mediaStream && isPlaying}
          className="mx-auto h-[13rem] max-w-[620px] bg-transparent p-0"
        />

        <div className="mx-auto mt-9 flex w-full max-w-[680px] items-center gap-3 sm:gap-4">
          <AudioPlayerButton
            item={PRESENTER_AUDIO_ITEM}
            size="icon"
            className="size-12 rounded-full shadow-lg shadow-cyan-950/10"
          />

          <AudioPlayerTime className="w-12 text-right font-mono text-xs sm:w-14 sm:text-sm" />

          <AudioPlayerProgress
            aria-label="Audio progress"
            className="min-w-0 flex-1"
          />

          <AudioPlayerDuration className="w-12 font-mono text-xs sm:w-14 sm:text-sm" />
        </div>
      </div>
    </div>
  )
}

export function AudioVisualizerPlayerPrototype() {
  return (
    <AudioPlayerProvider>
      <AudioVisualizerPlayerSurface />
    </AudioPlayerProvider>
  )
}
