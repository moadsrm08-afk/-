
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, DownloadIcon } from './Icons';

interface AudioPlayerProps {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  speed: number;
  pitch: number;
  onDownload: () => void;
}

const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioContext, audioBuffer, speed, pitch, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Effect to handle progress updates with requestAnimationFrame
  useEffect(() => {
    const updateProgress = () => {
      if (!isPlaying || !sourceRef.current) {
        return;
      }
      
      const elapsedTime = (audioContext.currentTime - startTimeRef.current) * speed;
      
      if (elapsedTime >= audioBuffer.duration) {
        setCurrentTime(audioBuffer.duration);
        setProgress(100);
        return; // onended will handle the rest
      }

      const newProgress = (elapsedTime / audioBuffer.duration) * 100;
      setProgress(Math.min(newProgress, 100));
      setCurrentTime(elapsedTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, audioContext, audioBuffer, speed]);


  const stopAudio = (shouldReset: boolean) => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    if (shouldReset) {
      setProgress(0);
      pausedAtRef.current = 0;
      setCurrentTime(0);
    }
  };
  
  const playAudio = () => {
    if (isPlaying || !audioBuffer) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    source.detune.value = 1200 * Math.log2(pitch);
    source.connect(audioContext.destination);

    const offset = pausedAtRef.current;
    source.start(0, offset);
    
    startTimeRef.current = audioContext.currentTime - offset / speed;
    sourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      if (sourceRef.current === source) {
          stopAudio(true);
      }
    };
  };

  const pauseAudio = () => {
    if (!isPlaying || !sourceRef.current) return;
    pausedAtRef.current = (audioContext.currentTime - startTimeRef.current) * speed;
    stopAudio(false);
  };

  useEffect(() => {
    // Stop and clean up on unmount or when buffer changes
    return () => {
      stopAudio(true);
    };
  }, [audioBuffer]);

  useEffect(() => {
    if (sourceRef.current && isPlaying) {
        const oldSpeed = sourceRef.current.playbackRate.value;
        const currentPosition = (audioContext.currentTime - startTimeRef.current) * oldSpeed;

        sourceRef.current.playbackRate.value = speed;
        sourceRef.current.detune.value = 1200 * Math.log2(pitch);

        startTimeRef.current = audioContext.currentTime - currentPosition / speed;
    }
  }, [speed, pitch, isPlaying, audioContext]);


  const togglePlayPause = () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = progressBar.clientWidth;
    const clickPosition = document.dir === 'rtl' ? width - x : x;
    const percentage = Math.max(0, Math.min(1, clickPosition / width));

    const newTime = percentage * audioBuffer.duration;
    
    pausedAtRef.current = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
    
    if (isPlaying) {
      stopAudio(false);
      playAudio();
    }
  };

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-between gap-4">
      <button
        onClick={togglePlayPause}
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex-shrink-0"
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
      >
        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
      </button>

      <div className="flex items-center gap-3 w-full">
        <span dir="ltr" className="text-sm font-mono text-slate-600 dark:text-slate-300 w-12 text-center" aria-live="off">{formatTime(currentTime)}</span>
        <div 
          className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 cursor-pointer relative"
          onClick={handleSeek}
          title="تحريك شريط الصوت"
        >
          <div
            className="bg-blue-600 h-2.5 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div 
              className="absolute top-1/2 -end-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-md transform -translate-y-1/2"
            ></div>
          </div>
        </div>
        <span dir="ltr" className="text-sm font-mono text-slate-600 dark:text-slate-300 w-12 text-center">{formatTime(audioBuffer ? audioBuffer.duration : 0)}</span>
      </div>

      <button
        onClick={onDownload}
        className="p-3 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 transition flex-shrink-0"
        title="تنزيل بصيغة WAV"
        aria-label="تنزيل الملف الصوتي بصيغة WAV"
      >
        <DownloadIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AudioPlayer;
