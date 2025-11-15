
import React, { useState, useEffect, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audioUtils';
import AudioPlayer from './AudioPlayer';
import { VOICE_OPTIONS, LANGUAGES } from '../types';
import type { VoiceOption, Language } from '../types';
import { LoadingIcon, MicIcon, SpeakerIcon, TuneIcon, ChevronDownIcon, PlayIcon, LanguageIcon } from './Icons';

// Global AudioContext
// Fix: Cast window to any to support webkitAudioContext for older browsers.
const AudioCTX = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

const VoiceGenerator: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ar');
  const [speed, setSpeed] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Set initial text based on selected language
  useEffect(() => {
    const currentLangInfo = LANGUAGES.find(l => l.code === selectedLanguage);
    if(currentLangInfo) {
      setText(currentLangInfo.placeholder.replace('...', ' مرحباً بكم في الصوت الذكي.'));
    }
  }, [selectedLanguage]);


  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('الرجاء إدخال نص لإنشاء مقطع صوتي.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioBuffer(null);

    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      const decodedBytes = decode(base64Audio);
      const buffer = await decodeAudioData(decodedBytes, AudioCTX, 24000, 1);
      setAudioBuffer(buffer);
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('فشل إنشاء المقطع الصوتي. يرجى مراجعة وحدة التحكم للحصول على التفاصيل.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioBuffer) return;
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-voice-speech.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handlePreviewVoice = async (e: React.MouseEvent<HTMLButtonElement>, voiceId: string) => {
    e.stopPropagation();

    if (previewSourceRef.current) {
        previewSourceRef.current.onended = null;
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
        previewSourceRef.current = null;
    }

    if (previewingVoiceId === voiceId) {
        setPreviewingVoiceId(null);
        return;
    }

    setPreviewingVoiceId(voiceId);

    try {
        const sampleText = "Hello. Bonjour. مرحبا.";
        const base64Audio = await generateSpeech(sampleText, voiceId);
        const decodedBytes = decode(base64Audio);
        const buffer = await decodeAudioData(decodedBytes, AudioCTX, 24000, 1);

        if (previewingVoiceId !== voiceId) return;
        if (AudioCTX.state === 'suspended') await AudioCTX.resume();

        const source = AudioCTX.createBufferSource();
        source.buffer = buffer;
        source.connect(AudioCTX.destination);
        source.start();
        previewSourceRef.current = source;
        source.onended = () => {
            if (previewSourceRef.current === source) {
                setPreviewingVoiceId(null);
                previewSourceRef.current = null;
            }
        };
    } catch (err) {
        console.error('Error generating voice preview:', err);
        setError('فشل في معاينة الصوت.');
        if (previewingVoiceId === voiceId) {
            setPreviewingVoiceId(null);
        }
    }
  };

  const currentVoice = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const currentLangInfo = LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6 transition-all duration-300">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white text-center">إنشاء مقطع صوتي</h2>

      <div className="space-y-2">
        <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <LanguageIcon className="w-5 h-5" />
            <span>اللغة</span>
        </label>
        <div className="flex space-x-2 space-x-reverse rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
            {LANGUAGES.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`w-full rounded-md py-2 px-3 text-sm font-semibold transition-colors ${selectedLanguage === lang.code ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                >
                    {lang.name}
                </button>
            ))}
        </div>
    </div>
      
      <div className="space-y-2">
        <label htmlFor="text-input" className="font-semibold text-slate-700 dark:text-slate-300">النص الخاص بك</label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentLangInfo?.placeholder}
          lang={selectedLanguage}
          dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
          className="w-full h-36 p-4 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
          rows={5}
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
            <label htmlFor="voice-select-button" className="font-semibold text-slate-700 dark:text-slate-300">الصوت</label>
            <div className="relative" ref={dropdownRef}>
                <button
                id="voice-select-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="w-full flex items-center justify-between text-start ps-10 pe-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                >
                <MicIcon className="w-5 h-5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <span>
                    {currentVoice?.name} ({currentVoice?.description})
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto" role="listbox">
                    {VOICE_OPTIONS.map((voice) => (
                    <li
                        key={voice.id}
                        onClick={() => {
                        setSelectedVoice(voice.id);
                        setIsDropdownOpen(false);
                        }}
                        className="group flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                        role="option"
                        aria-selected={selectedVoice === voice.id}
                    >
                        <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{voice.name} ({voice.description})</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{voice.languages.join(' / ')}</span>
                        </div>
                        <button
                          onClick={(e) => handlePreviewVoice(e, voice.id)}
                          disabled={previewingVoiceId !== null && previewingVoiceId !== voice.id}
                          className="p-2 rounded-full text-slate-500 hover:bg-blue-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          title={`معاينة صوت ${voice.name}`}
                        >
                        {previewingVoiceId === voice.id ? (
                            <LoadingIcon className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <PlayIcon className="w-5 h-5 group-hover:text-blue-600" />
                        )}
                        </button>
                    </li>
                    ))}
                </ul>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
            <label htmlFor="speed-slider" className="font-semibold text-slate-700 dark:text-slate-300">السرعة ({speed.toFixed(1)}x)</label>
            <div className="flex items-center gap-3">
                <SpeakerIcon className="w-5 h-5 text-slate-400" />
                <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600 slider-thumb"
                />
            </div>
            </div>
            <div className="space-y-2">
            <label htmlFor="pitch-slider" className="font-semibold text-slate-700 dark:text-slate-300">طبقة الصوت ({pitch.toFixed(1)}x)</label>
            <div className="flex items-center gap-3">
                <TuneIcon className="w-5 h-5 text-slate-400" />
                <input
                id="pitch-slider"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600 slider-thumb"
                />
            </div>
            </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <LoadingIcon className="w-5 h-5 animate-spin" />
            <span>جاري الإنشاء...</span>
          </>
        ) : (
          <span>إنشاء الصوت</span>
        )}
      </button>

      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {audioBuffer && (
        <AudioPlayer
          audioContext={AudioCTX}
          audioBuffer={audioBuffer}
          speed={speed}
          pitch={pitch}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default VoiceGenerator;