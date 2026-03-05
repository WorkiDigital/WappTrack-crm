import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string | null;
  isFromMe: boolean;
}

function generateBars(src: string | null, count = 20): number[] {
  const seed = src ? src.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 42;
  const bars: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    bars.push(20 + (Math.abs(s) % 80));
  }
  return bars;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isFromMe }) => {
  // Sempre renderizar o elemento <audio> para garantir que o ref seja válido
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playError, setPlayError] = useState(false);

  const bars = generateBars(src);
  const progress = duration > 0 ? currentTime / duration : 0;
  const canPlay = !!src;

  // Atualizar src no elemento de áudio quando mudar (sem remontagem)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = src || '';
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlayError(false);
  }, [src]);

  // Eventos de áudio — roda uma vez na montagem; src atualizado pelo effect acima
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };

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

  const handleToggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;
    setPlayError(false);
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('AudioPlayer play() error:', err);
        setPlayError(true);
      });
    }
  }, [isPlaying, canPlay]);

  const activeColor = isFromMe ? 'bg-white' : 'bg-primary';
  const mutedColor  = isFromMe ? 'bg-white/40' : 'bg-primary/30';
  const buttonBg    = isFromMe
    ? 'bg-white/20 hover:bg-white/30 text-white'
    : 'bg-primary/10 hover:bg-primary/20 text-primary';
  const disabledBg  = isFromMe ? 'bg-white/10 text-white/40' : 'bg-muted text-muted-foreground/40';
  const timerColor  = isFromMe ? 'text-white/70' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-2 py-1 min-w-[200px]">
      {/* Elemento de áudio sempre montado */}
      <audio ref={audioRef} preload="metadata" />

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
          : <Play  className="h-3.5 w-3.5 translate-x-px" />
        }
      </button>

      {/* Waveform bars */}
      <div className="flex items-end gap-[2px] flex-1 h-7">
        {bars.map((height, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full w-[3px] transition-colors',
              i / bars.length <= progress ? activeColor : mutedColor
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Timer ou fallback de download */}
      {playError && src ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir áudio"
          className={cn('flex-shrink-0', timerColor)}
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className={cn('text-xs flex-shrink-0 tabular-nums', timerColor)}>
          {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
        </span>
      )}
    </div>
  );
};
