
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Globe } from 'lucide-react';

interface LanguageSelectProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  disabled?: boolean;
}

const INDIAN_LANGUAGES = [
  'Assamese', 'Bengali', 'Bodo', 'Dogri', 'English', 'Gujarati', 'Hindi', 
  'Kannada', 'Kashmiri', 'Konkani', 'Maithili', 'Malayalam', 'Manipuri', 
  'Marathi', 'Nepali', 'Odia', 'Punjabi', 'Sanskrit', 'Santali', 'Sindhi', 
  'Tamil', 'Telugu', 'Urdu'
];

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ 
  selectedLanguages, 
  onLanguagesChange,
  disabled = false 
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const handleAddLanguage = () => {
    if (selectedLanguage && !selectedLanguages.includes(selectedLanguage)) {
      onLanguagesChange([...selectedLanguages, selectedLanguage]);
      setSelectedLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    onLanguagesChange(selectedLanguages.filter(lang => lang !== language));
  };

  const availableLanguages = INDIAN_LANGUAGES.filter(lang => !selectedLanguages.includes(lang));

  return (
    <div className="space-y-3">
      <Label className="text-slate-200 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Languages
      </Label>
      
      <div className="flex gap-2">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={disabled}>
          <SelectTrigger className="flex-1 bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {availableLanguages.map((language) => (
              <SelectItem key={language} value={language} className="text-white hover:bg-slate-700">
                {language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleAddLanguage} 
          disabled={!selectedLanguage || disabled}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((language) => (
            <Badge 
              key={language} 
              variant="secondary" 
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1"
            >
              {language}
              {!disabled && (
                <button
                  onClick={() => handleRemoveLanguage(language)}
                  className="ml-1 hover:bg-blue-500/30 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
