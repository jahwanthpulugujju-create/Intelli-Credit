import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Application configuration</p>
      <div className="metric-card text-center py-16">
        <Settings className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="font-display font-semibold text-lg mb-2">Settings</h3>
        <p className="text-muted-foreground text-sm">User and application settings will be available here.</p>
      </div>
    </div>
  );
}