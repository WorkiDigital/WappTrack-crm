import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string | null;
  isFromMe: boolean;
}

// Gera alturas de barras determinísticas baseadas na src (consistente entre renders)
function generateBars(src: string | null, count = 20): number[] {
  const seed = src ? src.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 42;
  const bars: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    bars.push(20 + (Math.abs(s) % 80)); // altura entre 20% e 100%
  }
  return bars;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isFromMe }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const bars = generateBars(src);
  const progress = duration > 0 ? currentTime / duration : 0;
  const canPlay = !!src;

  const handleToggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying, canPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDuration);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDuration);
    };
  }, []);

  // Reset quando src muda
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const activeColor = isFromMe ? 'bg-white' : 'bg-primary';
  const mutedColor = isFromMe ? 'bg-white/40' : 'bg-primary/30';
  const buttonBg = isFromMe
    ? 'bg-white/20 hover:bg-white/30 text-white'
    : 'bg-primary/10 hover:bg-primary/20 text-primary';
  const disabledBg = isFromMe ? 'bg-white/10 text-white/40' : 'bg-muted text-muted-foreground';
  const timerColor = isFromMe ? 'text-white/70' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-2 py-1 min-w-[180px]">
      {/* Hidden audio element */}
      {src && <audio ref={audioRef} src={src} preload="metadata" />}

      {/* Play/Pause button */}
      <button
        onClick={handleToggle}
        disabled={!canPlay}
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
          canPlay ? buttonBg : disabledBg
        )}
      >
        {isPlaying
          ? <Pause className="h-3.5 w-3.5" />
          : <Play className="h-3.5 w-3.5 translate-x-px" />
        }
      </button>

      {/* Waveform bars */}
      <div className="flex items-end gap-[2px] flex-1 h-7">
        {bars.map((height, i) => {
          const barProgress = i / bars.length;
          const isActive = barProgress <= progress;
          return (
            <div
              key={i}
              className={cn(
                'rounded-full w-[3px] transition-colors',
                isActive ? activeColor : mutedColor
              )}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Timer */}
      <span className={cn('text-xs flex-shrink-0 tabular-nums', timerColor)}>
        {isPlaying || currentTime > 0
          ? formatTime(currentTime)
          : formatTime(duration)}
      </span>
    </div>
  );
};
