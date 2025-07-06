
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Settings, Key, Mic, Loader2 } from 'lucide-react';
import { LanguageSelect } from './LanguageSelect';
import { retryWithDifferentKeys, fetchAvailableModels } from '@/utils/apiUtils';
import { toast } from 'sonner';

interface ConfigurationPanelProps {
  onGenerate: (config: {
    projectTitle: string;
    mainPrompt: string;
    languages: string[];
    googleApiKeys: string;
    pexelsApiKeys: string;
    textModel: string;
    voiceModel: string;
  }) => void;
  isGenerating: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [googleApiKeys, setGoogleApiKeys] = useState('');
  const [pexelsApiKeys, setPexelsApiKeys] = useState('');
  const [textModel, setTextModel] = useState('');
  const [voiceModel, setVoiceModel] = useState('');
  const [availableTextModels, setAvailableTextModels] = useState<string[]>([]);
  const [availableVoiceModels, setAvailableVoiceModels] = useState<string[]>([
    'tts-1', 
    'tts-1-hd',
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts'
  ]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedGoogleKeys = localStorage.getItem('unqvision_google_keys');
    const savedPexelsKeys = localStorage.getItem('unqvision_pexels_keys');
    
    if (savedGoogleKeys) setGoogleApiKeys(savedGoogleKeys);
    if (savedPexelsKeys) setPexelsApiKeys(savedPexelsKeys);
  }, []);

  // Save to localStorage when API keys change
  useEffect(() => {
    if (googleApiKeys) {
      localStorage.setItem('unqvision_google_keys', googleApiKeys);
    }
  }, [googleApiKeys]);

  useEffect(() => {
    if (pexelsApiKeys) {
      localStorage.setItem('unqvision_pexels_keys', pexelsApiKeys);
    }
  }, [pexelsApiKeys]);

  // Fetch models when Google API keys are available
  useEffect(() => {
    const loadModels = async () => {
      if (!googleApiKeys) return;
      
      setModelsLoading(true);
      try {
        const modelsOperation = async (apiKey: string) => {
          return await fetchAvailableModels(apiKey);
        };
        
        const { textModels, voiceModels } = await retryWithDifferentKeys(
          modelsOperation, 
          googleApiKeys, 
          'Model fetching'
        );
        
        setAvailableTextModels(textModels);
        setAvailableVoiceModels(voiceModels);
        
        // Set default models if none selected
        if (!textModel && textModels.length > 0) {
          setTextModel(textModels.find(m => m.includes('gemini-1.5-pro')) || textModels[0]);
        }
        if (!voiceModel && voiceModels.length > 0) {
          setVoiceModel(voiceModels[0]);
        }
        
        toast.success('Models loaded successfully!');
      } catch (error) {
        console.error('Failed to load models:', error);
        toast.error('Failed to load models. Please check your API keys.');
        // Use fallback models
        setAvailableTextModels(['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest']);
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, [googleApiKeys]);

  const handleGenerate = () => {
    if (!projectTitle || !mainPrompt || languages.length === 0 || !googleApiKeys || !pexelsApiKeys || !textModel || !voiceModel) {
      toast.error('Please fill in all required fields');
      return;
    }

    onGenerate({
      projectTitle,
      mainPrompt,
      languages,
      googleApiKeys,
      pexelsApiKeys,
      textModel,
      voiceModel
    });
  };

  return (
    <Card className="h-full bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="w-5 h-5 text-blue-400" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Project Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-200">Project Title</Label>
          <Input
            id="title"
            placeholder="Enter your video title..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400"
            disabled={isGenerating}
          />
        </div>

        {/* Main Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-slate-200">Main Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe your video idea... (e.g., Create a video about the mysteries of black holes)"
            value={mainPrompt}
            onChange={(e) => setMainPrompt(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 min-h-[120px] resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Languages */}
        <LanguageSelect
          selectedLanguages={languages}
          onLanguagesChange={setLanguages}
          disabled={isGenerating}
        />

        {/* API Keys Section */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <Label className="text-slate-200 flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </Label>
          
          <div className="space-y-2">
            <Label htmlFor="google-keys" className="text-sm text-slate-300">Google API Keys (comma-separated)</Label>
            <Input
              id="google-keys"
              type="password"
              placeholder="Enter your Google API keys..."
              value={googleApiKeys}
              onChange={(e) => setGoogleApiKeys(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pexels-keys" className="text-sm text-slate-300">Pexels API Keys (comma-separated)</Label>
            <Input
              id="pexels-keys"
              type="password"
              placeholder="Enter your Pexels API keys..."
              value={pexelsApiKeys}
              onChange={(e) => setPexelsApiKeys(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <Label className="text-slate-200">
            Model Selection
            {modelsLoading && <span className="text-xs text-blue-400 ml-2">(Loading...)</span>}
          </Label>
          
          <div className="space-y-2">
            <Label htmlFor="text-model" className="text-sm text-slate-300">Text Model</Label>
            <Select value={textModel} onValueChange={setTextModel} disabled={modelsLoading || isGenerating}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select Gemini model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {availableTextModels.map((model) => (
                  <SelectItem key={model} value={model} className="text-white hover:bg-slate-700">
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-model" className="text-sm text-slate-300 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Model
            </Label>
            <Select value={voiceModel} onValueChange={setVoiceModel} disabled={isGenerating}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select TTS model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {availableVoiceModels.map((model) => (
                  <SelectItem key={model} value={model} className="text-white hover:bg-slate-700">
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || modelsLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
