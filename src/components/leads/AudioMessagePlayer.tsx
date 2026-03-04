import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioMessagePlayerProps {
    src: string;
    isFromMe: boolean;
}

const SPEED_STEPS = [1, 1.5, 2];

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioMessagePlayer = ({ src, isFromMe }: AudioMessagePlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIdx, setSpeedIdx] = useState(0);

    const speed = SPEED_STEPS[speedIdx];
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) audio.pause();
        else audio.play();
    }, [isPlaying]);

    const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const track = trackRef.current;
        if (!audio || !track || !duration) return;
        const rect = track.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = Math.max(0, Math.min(ratio * duration, duration));
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

    const trackBg = isFromMe ? 'bg-white/25' : 'bg-black/15';
    const rangeBg = isFromMe ? 'bg-white' : 'bg-foreground';
    const thumbBg = isFromMe ? 'bg-white' : 'bg-foreground';
    const textMuted = isFromMe ? 'text-white/70' : 'text-muted-foreground';
    const btnBg = isFromMe ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/20';

    return (
        <div className="flex items-center gap-2 min-w-[220px]">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause */}
            <button
                onClick={togglePlay}
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                    btnBg
                )}
            >
                {isPlaying
                    ? <Pause className={cn('h-4 w-4 fill-current', isFromMe ? 'text-white' : 'text-foreground')} />
                    : <Play className={cn('h-4 w-4 fill-current ml-0.5', isFromMe ? 'text-white' : 'text-foreground')} />
                }
            </button>

            {/* Track area */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
                {/* Progress bar */}
                <div
                    ref={trackRef}
                    className={cn('relative h-1.5 w-full rounded-full cursor-pointer', trackBg)}
                    onClick={handleTrackClick}
                >
                    <div
                        className={cn('absolute left-0 top-0 h-full rounded-full transition-all', rangeBg)}
                        style={{ width: `${progress}%` }}
                    />
                    {/* Thumb dot */}
                    <div
                        className={cn('absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full shadow', thumbBg)}
                        style={{ left: `${progress}%` }}
                    />
                </div>
                {/* Times */}
                <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] tabular-nums', textMuted)}>
                        {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
                    </span>
                    <span className={cn('text-[10px] tabular-nums', textMuted)}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Speed */}
            <button
                onClick={cycleSpeed}
                className={cn(
                    'shrink-0 text-[10px] font-bold w-7 text-center rounded px-1 py-0.5 transition-colors',
                    btnBg,
                    isFromMe ? 'text-white' : 'text-foreground'
                )}
            >
                {speed}x
            </button>
        </div>
    );
};
