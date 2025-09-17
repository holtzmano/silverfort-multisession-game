// client/src/components/SaveScoreForm.tsx
import React from 'react';

interface SaveScoreFormProps {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  canSave: boolean;
  saved: boolean;
}

export function SaveScoreForm({ 
  name, 
  onNameChange, 
  onSave, 
  canSave, 
  saved 
}: SaveScoreFormProps) {
  return (
    <div className="save-row">
      <input
        type="text"
        placeholder="Nickname (optional)"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={24}
        aria-label="Nickname"
      />
      <button className="primary" disabled={!canSave} onClick={onSave}>
        {saved ? 'Saved ✓' : 'Save Score'}
      </button>
    </div>
  );
}
