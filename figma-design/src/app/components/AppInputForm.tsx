import React, { useState } from 'react';
import { AppEntry, AppCategory } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface AppInputFormProps {
  apps: AppEntry[];
  onAddApp: (app: AppEntry) => void;
  onRemoveApp: (id: string) => void;
}

export function AppInputForm({ apps, onAddApp, onRemoveApp }: AppInputFormProps) {
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState<AppCategory>('social');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appName.trim()) return;
    
    const newApp: AppEntry = {
      id: Date.now().toString(),
      name: appName.trim(),
      category,
      hours: parseInt(hours) || 0,
      minutes: parseInt(minutes) || 0
    };
    
    onAddApp(newApp);
    
    // Reset form
    setAppName('');
    setHours('0');
    setMinutes('0');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <Label htmlFor="appName">App/Activity Name</Label>
          <Input
            id="appName"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g., TikTok, YouTube, Minecraft"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as AppCategory)}>
            <SelectTrigger id="category" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="video">Video/Streaming</SelectItem>
              <SelectItem value="game">Gaming</SelectItem>
              <SelectItem value="school">Educational/School</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add App
        </Button>
      </form>

      {/* App List */}
      {apps.length > 0 && (
        <div className="space-y-2">
          <Label>Added Apps</Label>
          <div className="space-y-2">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-gray-500">
                    {app.category} • {app.hours}h {app.minutes}m
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveApp(app.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
