export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  languages: string[];
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Kore', name: 'Aria', description: 'أنثى، دافئ وواضح', languages: ['EN', 'FR', 'AR'] },
  { id: 'Puck', name: 'Leo', description: 'ذكر، محترف وهادئ', languages: ['EN', 'FR', 'AR'] },
  { id: 'Zephyr', name: 'Zoe', description: 'أنثى، حيوي ومشرق', languages: ['EN', 'FR', 'AR'] },
  { id: 'Fenrir', name: 'Finn', description: 'ذكر، ودود وجذاب', languages: ['EN', 'FR', 'AR'] },
  { id: 'Charon', name: 'Orion', description: 'ذكر، رسمي وعميق', languages: ['EN', 'FR', 'AR'] },
];

export type Language = 'en' | 'fr' | 'ar';

export interface LanguageOption {
  code: Language;
  name: string;
  placeholder: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', placeholder: 'Enter text in English...' },
  { code: 'fr', name: 'Français', placeholder: 'Entrez du texte en français...' },
  { code: 'ar', name: 'العربية', placeholder: 'أدخل النص باللغة العربية...' },
];