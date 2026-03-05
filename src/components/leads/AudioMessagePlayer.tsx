import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioMessagePlayerProps {
    src: string;
    isFromMe: boolean;
}

const SPEED_STEPS = [1, 1.5, 2];
const BAR_COUNT = 40;

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Deterministic pseudo-random bar heights from the src URL */
function generateBars(seed: string): number[] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return Array.from({ length: BAR_COUNT }, (_, i) => {
        const v = Math.abs(Math.sin(hash * 0.003 + i * 0.47) * 0.6 + Math.sin(i * 0.21 + hash * 0.07) * 0.4);
        // Clamp to [0.15, 1.0]
        return 0.15 + Math.abs(v) * 0.85;
    });
}

export const AudioMessagePlayer = ({ src, isFromMe }: AudioMessagePlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const waveRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIdx, setSpeedIdx] = useState(0);

    const speed = SPEED_STEPS[speedIdx];
    const progress = duration > 0 ? currentTime / duration : 0;
    const bars = useMemo(() => generateBars(src), [src]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.pause();
        else audio.play().catch(() => {});
    }, [isPlaying]);

    const handleWaveClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const wave = waveRef.current;
        if (!audio || !wave || !duration) return;
        const rect = wave.getBoundingClientRect();
        const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
        audio.currentTime = ratio * duration;
    }, [duration]);

    const cycleSpeed = useCallback(() => {
        const next = (speedIdx + 1) % SPEED_STEPS.length;
        setSpeedIdx(next);
        if (audioRef.current) audioRef.current.playbackRate = SPEED_STEPS[next];
    }, [speedIdx]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoaded = () => setDuration(audio.duration);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoaded);
        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoaded);
        };
    }, []);

    // Colors based on bubble side
    const playBtnClass = isFromMe
        ? 'bg-white/25 hover:bg-white/35 text-white'
        : 'bg-emerald-500 hover:bg-emerald-600 text-white';

    const barFilled = isFromMe ? 'bg-white' : 'bg-emerald-500';
    const barEmpty = isFromMe ? 'bg-white/30' : 'bg-muted-foreground/25';
    const timeColor = isFromMe ? 'text-white/65' : 'text-muted-foreground';

    return (
        <div className="flex items-center gap-2.5 w-[240px]">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* ── Play / Pause button ── */}
            <button
                onClick={togglePlay}
                className={cn(
                    'h-10 w-10 shrink-0 flex items-center justify-center rounded-full transition-colors',
                    playBtnClass
                )}
            >
                {isPlaying
                    ? <Pause className="h-4 w-4 fill-current" />
                    : <Play className="h-4 w-4 fill-current translate-x-px" />
                }
            </button>

            {/* ── Waveform + meta ── */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
                {/* Bars */}
                <div
                    ref={waveRef}
                    className="flex items-center gap-px h-8 cursor-pointer"
                    onClick={handleWaveClick}
                >
                    {bars.map((h, i) => {
                        const filled = i / BAR_COUNT <= progress;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    'rounded-full flex-1 transition-colors duration-75',
                                    filled ? barFilled : barEmpty
                                )}
                                style={{ height: `${Math.round(h * 28)}px`, minWidth: '2px' }}
                            />
                        );
                    })}
                </div>

                {/* Time + speed */}
                <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] tabular-nums leading-none', timeColor)}>
                        {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
                    </span>
                    <button
                        onClick={cycleSpeed}
                        className={cn(
                            'text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded transition-opacity',
                            isFromMe ? 'text-white/65 hover:text-white' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {speed === 1 ? '1x' : `${speed}x`}
                    </button>
                </div>
            </div>
        </div>
    );
};
