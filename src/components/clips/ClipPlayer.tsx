"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

type Props = {
  src: string;
  poster?: string;
  title: string;
  className?: string;
};

/**
 * Video player with standard controls: play/pause, seek, mute, volume,
 * playback speed and fullscreen. Keyboard: Space/K play-pause, ←/→ seek 5 s,
 * ↑/↓ volume, M mute, F fullscreen, < / > speed.
 */
export default function ClipPlayer({ src, poster, title, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const speedId = useId();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const video = () => videoRef.current;

  function togglePlay() {
    const v = video();
    if (!v) return;
    if (v.paused || v.ended) {
      v.play().catch(() => setError("Playback was blocked. Press play to try again."));
    } else {
      v.pause();
    }
  }

  function seekTo(time: number) {
    const v = video();
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(Math.max(0, time), v.duration);
    setCurrentTime(v.currentTime);
  }

  function toggleMute() {
    const v = video();
    if (!v) return;
    if (v.muted && v.volume === 0) v.volume = 0.5;
    v.muted = !v.muted;
  }

  function changeVolume(next: number) {
    const v = video();
    if (!v) return;
    v.volume = Math.min(1, Math.max(0, next));
    v.muted = v.volume === 0;
  }

  function changeRate(next: number) {
    const v = video();
    if (!v) return;
    v.playbackRate = next;
  }

  function stepRate(direction: 1 | -1) {
    const index = SPEEDS.indexOf(rate as (typeof SPEEDS)[number]);
    const nextIndex = Math.min(SPEEDS.length - 1, Math.max(0, (index === -1 ? 3 : index) + direction));
    changeRate(SPEEDS[nextIndex]);
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else el.requestFullscreen?.().catch(() => undefined);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Let form controls (range inputs, select) keep their own arrow-key behavior.
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "SELECT") return;
    const v = video();
    if (!v) return;
    switch (event.key) {
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        event.preventDefault();
        seekTo(v.currentTime - 5);
        break;
      case "ArrowRight":
        event.preventDefault();
        seekTo(v.currentTime + 5);
        break;
      case "ArrowUp":
        event.preventDefault();
        changeVolume(v.volume + 0.1);
        break;
      case "ArrowDown":
        event.preventDefault();
        changeVolume(v.volume - 0.1);
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "<":
        stepRate(-1);
        break;
      case ">":
        stepRate(1);
        break;
    }
  }

  function updateBuffered() {
    const v = video();
    if (!v || v.buffered.length === 0) return;
    setBuffered(v.buffered.end(v.buffered.length - 1));
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      ref={wrapperRef}
      className={`group relative overflow-hidden rounded-xl bg-black text-white outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title}`}
      onKeyDown={onKeyDown}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full cursor-pointer bg-black"
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setError(null);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onProgress={updateBuffered}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
        onError={() => setError("This clip could not be loaded. Refresh the page to try again.")}
      >
        Your browser does not support HTML5 video.
      </video>

      {error && (
        <div role="alert" className="absolute inset-x-0 top-0 bg-red-900/90 px-4 py-2 text-sm">
          {error}
        </div>
      )}
      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}

      <div className="flex flex-col gap-2 bg-gradient-to-t from-black/90 to-black/60 px-3 pb-3 pt-2">
        {/* Seek bar */}
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/20" aria-hidden />
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/40"
            style={{ width: `${bufferedPct}%` }}
            aria-hidden
          />
          <div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded bg-amber-400"
            style={{ width: `${progressPct}%` }}
            aria-hidden
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seekTo(Number(e.target.value))}
            disabled={!duration}
            aria-label="Seek"
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="absolute inset-0 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-default"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded px-2 py-1 font-semibold hover:bg-white/10"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚ Pause" : "▶ Play"}
          </button>

          <span className="tabular-nums text-white/80" aria-live="off">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded px-2 py-1 hover:bg-white/10"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
              aria-pressed={muted}
            >
              {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveVolume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-label="Volume"
              aria-valuetext={`${Math.round(effectiveVolume * 100)}%`}
              className="w-20 accent-amber-400 sm:w-28"
            />

            <label htmlFor={speedId} className="sr-only">
              Playback speed
            </label>
            <select
              id={speedId}
              value={rate}
              onChange={(e) => changeRate(Number(e.target.value))}
              className="rounded bg-white/10 px-2 py-1 text-white"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s === 1 ? "1× Normal" : `${s}×`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded px-2 py-1 hover:bg-white/10"
              aria-label="Toggle fullscreen"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
