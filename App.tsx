
import React, { useState } from 'react';
import VoiceGenerator from './components/VoiceGenerator';
import { AudioSparkIcon, MagicWandIcon } from './components/Icons';

const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <div className="p-6 bg-blue-100 rounded-full mb-6">
      <AudioSparkIcon className="w-16 h-16 text-blue-600" />
    </div>
    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4">
      مرحباً بك في الصوت الذكي
    </h1>
    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
      حوّل نصوصك إلى كلام واقعي يشبه صوت الإنسان بقوة الذكاء الاصطناعي.
    </p>
    <button
      onClick={onStart}
      className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
    >
      <MagicWandIcon className="w-6 h-6" />
      <span>ابدأ الآن</span>
    </button>
  </div>
);

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div dir="rtl" className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-200 selection:text-blue-800">
      <main className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center">
        {showWelcome ? (
          <WelcomeScreen onStart={() => setShowWelcome(false)} />
        ) : (
          <VoiceGenerator />
        )}
      </main>
      <footer className="w-full text-center p-4 mt-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">تم إنشاؤه بواسطة المحترف معاذ</p>
      </footer>
    </div>
  );
};

export default App;