// SettingsView
// ...settings view UI...
import React, { useState } from 'react';

export default function SettingsView({ appState }) {
  const [settings, setSettings] = useState(appState?.user || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      appState.setUser(settings);
      await appState.saveUserSettings();
      setError(null);
    } catch (err) {
      setError(err);
    }
    setSaving(false);
  };

  return (
    <div className="settings-view">
      <h2>Settings</h2>
      <form>
        <label>
          Check Interval (minutes):
          <input
            type="number"
            name="checkInterval"
            value={settings.checkInterval || ''}
            onChange={handleChange}
            min={1}
            max={120}
          />
        </label>
        <label>
          Notifications:
          <select name="notifications" value={settings.notifications ? 'true' : 'false'} onChange={handleChange}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label>
          Auto Refresh:
          <select name="autoRefresh" value={settings.autoRefresh ? 'true' : 'false'} onChange={handleChange}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <button type="button" onClick={handleSave} disabled={saving}>Save</button>
        {saving && <span className="settings-saving">Saving...</span>}
        {error && <span className="settings-error">Error: {error.toString()}</span>}
      </form>
    </div>
  );
}
