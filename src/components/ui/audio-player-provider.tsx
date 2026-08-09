"use client"

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

enum ReadyState {
  HAVE_NOTHING = 0,
  HAVE_METADATA = 1,
  HAVE_CURRENT_DATA = 2,
  HAVE_FUTURE_DATA = 3,
  HAVE_ENOUGH_DATA = 4,
}

enum NetworkState {
  NETWORK_EMPTY = 0,
  NETWORK_IDLE = 1,
  NETWORK_LOADING = 2,
  NETWORK_NO_SOURCE = 3,
}

function maybeUpdateState<T>(
  previous: T,
  next: T,
  setState: Dispatch<SetStateAction<T>>
) {
  if (!Object.is(previous, next)) setState(next)
}

export interface AudioPlayerItem<TData = unknown> {
  id: string | number
  src: string
  data?: TData
}

export interface AudioPlayerApi<TData = unknown> {
  ref: RefObject<HTMLAudioElement | null>
  activeItem: AudioPlayerItem<TData> | null
  duration: number | undefined
  error: MediaError | null
  isPlaying: boolean
  isBuffering: boolean
  playbackRate: number
  isItemActive: (id: string | number | null) => boolean
  setActiveItem: (item: AudioPlayerItem<TData> | null) => Promise<void>
  play: (item?: AudioPlayerItem<TData> | null) => Promise<void>
  pause: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
}

const AudioPlayerContext = createContext<AudioPlayerApi<unknown> | null>(null)
const AudioPlayerTimeContext = createContext<number | null>(null)

export function useAudioPlayer<TData = unknown>(): AudioPlayerApi<TData> {
  const api = useContext(AudioPlayerContext) as AudioPlayerApi<TData> | null
  if (!api) {
    throw new Error(
      "useAudioPlayer cannot be called outside of AudioPlayerProvider"
    )
  }
  return api
}

export const useAudioPlayerTime = () => {
  const time = useContext(AudioPlayerTimeContext)
  if (time === null) {
    throw new Error(
      "useAudioPlayerTime cannot be called outside of AudioPlayerProvider"
    )
  }
  return time
}

type Callback = (delta: number) => void

function useAnimationFrame(callback: Callback) {
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const callbackRef = useRef<Callback>(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const delta = time - previousTimeRef.current
        callbackRef.current(delta)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      previousTimeRef.current = null
    }
  }, [])
}

export function AudioPlayerProvider<TData = unknown>({
  children,
}: {
  children: ReactNode
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const itemRef = useRef<AudioPlayerItem<TData> | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const [readyState, setReadyState] = useState<number>(0)
  const [networkState, setNetworkState] = useState<number>(0)
  const [time, setTime] = useState<number>(0)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [error, setError] = useState<MediaError | null>(null)
  const [activeItem, setActiveItemState] =
    useState<AudioPlayerItem<TData> | null>(null)
  const [paused, setPaused] = useState(true)
  const [playbackRate, setPlaybackRateState] = useState<number>(1)

  const setActiveItem = useCallback(
    async (item: AudioPlayerItem<TData> | null) => {
      const audio = audioRef.current
      if (!audio || item?.id === itemRef.current?.id) return

      itemRef.current = item
      const currentRate = audio.playbackRate
      audio.pause()
      audio.currentTime = 0
      if (item === null) audio.removeAttribute("src")
      else audio.src = item.src
      audio.load()
      audio.playbackRate = currentRate
    },
    []
  )

  const play = useCallback(
    async (item?: AudioPlayerItem<TData> | null) => {
      const audio = audioRef.current
      if (!audio) return

      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current
        } catch (playError) {
          console.error("Play promise error:", playError)
        }
      }

      if (item === undefined || item?.id === activeItem?.id) {
        const playPromise = audio.play()
        playPromiseRef.current = playPromise
        return playPromise
      }

      itemRef.current = item
      const currentRate = audio.playbackRate
      if (!audio.paused) audio.pause()
      audio.currentTime = 0
      if (item === null) audio.removeAttribute("src")
      else audio.src = item.src
      audio.load()
      audio.playbackRate = currentRate
      const playPromise = audio.play()
      playPromiseRef.current = playPromise
      return playPromise
    },
    [activeItem]
  )

  const pause = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (playError) {
        console.error(playError)
      }
    }

    audio.pause()
    playPromiseRef.current = null
  }, [])

  const seek = useCallback((nextTime: number) => {
    if (audioRef.current) audioRef.current.currentTime = nextTime
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = rate
    setPlaybackRateState(rate)
  }, [])

  const isItemActive = useCallback(
    (id: string | number | null) => activeItem?.id === id,
    [activeItem]
  )

  useAnimationFrame(() => {
    const audio = audioRef.current
    if (!audio) return

    maybeUpdateState(activeItem, itemRef.current, setActiveItemState)
    maybeUpdateState(readyState, audio.readyState, setReadyState)
    maybeUpdateState(networkState, audio.networkState, setNetworkState)
    const minimumTimeDelta = audio.paused ? 0 : 0.05
    if (
      !Object.is(time, audio.currentTime) &&
      Math.abs(time - audio.currentTime) >= minimumTimeDelta
    ) {
      setTime(audio.currentTime)
    }
    maybeUpdateState<number | undefined>(duration, audio.duration, setDuration)
    maybeUpdateState(paused, audio.paused, setPaused)
    maybeUpdateState(error, audio.error, setError)
    maybeUpdateState(playbackRate, audio.playbackRate, setPlaybackRateState)
  })

  const isPlaying = !paused
  const isBuffering =
    readyState < ReadyState.HAVE_FUTURE_DATA &&
    networkState === NetworkState.NETWORK_LOADING
  const api = useMemo<AudioPlayerApi<TData>>(
    () => ({
      ref: audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    }),
    [
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    ]
  )

  return (
    <AudioPlayerContext.Provider value={api as AudioPlayerApi<unknown>}>
      <AudioPlayerTimeContext.Provider value={time}>
        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />
        {children}
      </AudioPlayerTimeContext.Provider>
    </AudioPlayerContext.Provider>
  )
}
