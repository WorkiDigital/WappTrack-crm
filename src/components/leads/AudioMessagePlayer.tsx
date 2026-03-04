import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

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
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIdx, setSpeedIdx] = useState(0);

    const speed = SPEED_STEPS[speedIdx];

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    }, [isPlaying]);

    const handleSeek = useCallback((value: number[]) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = value[0];
        setCurrentTime(value[0]);
    }, []);

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
        const onLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, []);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={cn(
            'flex items-center gap-2 rounded-full px-3 py-2 min-w-[220px]',
            isFromMe
                ? 'bg-primary/90 text-primary-foreground'
                : 'bg-muted text-foreground'
        )}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause */}
            <button
                onClick={togglePlay}
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80',
                    isFromMe ? 'bg-primary-foreground/20' : 'bg-foreground/10'
                )}
            >
                {isPlaying
                    ? <Pause className="h-4 w-4 fill-current" />
                    : <Play className="h-4 w-4 fill-current ml-0.5" />
                }
            </button>

            {/* Waveform / Slider area */}
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSeek}
                    className={cn(
                        'h-1 cursor-pointer',
                        isFromMe ? '[&_[data-slot=track]]:bg-primary-foreground/30 [&_[data-slot=range]]:bg-primary-foreground [&_[data-slot=thumb]]:bg-primary-foreground [&_[data-slot=thumb]]:border-primary-foreground/50' : ''
                    )}
                />
                <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] tabular-nums', isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
                    </span>
                    <span className={cn('text-[10px] tabular-nums', isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Speed */}
            <button
                onClick={cycleSpeed}
                className={cn(
                    'shrink-0 text-[10px] font-bold w-7 text-center rounded-sm px-1 py-0.5 transition-opacity hover:opacity-80',
                    isFromMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-foreground/10 text-foreground'
                )}
            >
                {speed}x
            </button>
        </div>
    );
};
