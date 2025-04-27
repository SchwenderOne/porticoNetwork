import React, { useState, useEffect } from 'react';
import HeroTitle from '@/components/HeroTitle';
import { Toggle } from '@/components/ui/toggle';

const SettingsPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => !!document.documentElement.classList.contains('dark'));
  const [refreshInterval, setRefreshInterval] = useState<number>(() => Number(localStorage.getItem('refreshInterval')) || 10);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('language') || 'de');

  // Dunkelmodus in body abbilden
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Persist Refresh-Intervall
  useEffect(() => {
    localStorage.setItem('refreshInterval', refreshInterval.toString());
  }, [refreshInterval]);

  // Persist Sprache
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <main className="container mx-auto px-4 py-8">
      <HeroTitle title="Einstellungen" subtitle="Anwendungseinstellungen anpassen" />

      <div className="glass p-6 rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">Dunkelmodus</span>
          <Toggle pressed={darkMode} onPressedChange={setDarkMode} />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="refresh-interval" className="font-medium">Aktualisierungsintervall (Sek.)</label>
          <input
            id="refresh-interval"
            type="number"
            min={1}
            className="border rounded px-2 py-1 w-20 text-right"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value) || 1)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="language-select" className="font-medium">Sprache</label>
          <select
            id="language-select"
            className="border rounded px-2 py-1"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage; 