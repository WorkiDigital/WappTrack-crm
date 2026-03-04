import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Image, Video, Mic, Smile, Paperclip, X, Loader2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MediaInputProps {
  onEmojiSelect: (emoji: string) => void;
  onMediaSelect: (file: File, type: 'image' | 'video' | 'audio') => void;
  disabled?: boolean;
}

export const MediaInput: React.FC<MediaInputProps> = ({
  onEmojiSelect,
  onMediaSelect,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{ file: File; type: 'image' | 'video' } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.ogg`, { type: 'audio/ogg' });
        onMediaSelect(audioFile, 'audio');
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 16MB');
        return;
      }
      setSelectedFile({ file, type: 'image' });
      onMediaSelect(file, 'image');
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Vídeo muito grande. Máximo 16MB');
        return;
      }
      setSelectedFile({ file, type: 'video' });
      onMediaSelect(file, 'video');
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
        disabled={disabled}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoSelect}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => imageInputRef.current?.click()}
        disabled={disabled}
        title="Enviar imagem"
      >
        <Image className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => videoInputRef.current?.click()}
        disabled={disabled}
        title="Enviar vídeo"
      >
        <Video className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={cn(isRecording && 'text-red-500 animate-pulse')}
        title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
      >
        {isRecording ? (
          <div className="flex items-center gap-1">
            <Mic className="h-4 w-4" />
            <span className="text-xs">{formatRecordingTime(recordingTime)}</span>
          </div>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            title="Emojis"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 border-none" align="end">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={400}
            searchPlaceHolder="Buscar emoji..."
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
