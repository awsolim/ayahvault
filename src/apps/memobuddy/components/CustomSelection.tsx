// src/apps/memobuddy/components/CustomSelection.tsx

import React, { useState } from 'react';

export function CustomSelection({ config, setConfig }: any) {
  const [inputValue, setInputValue] = useState('');
  const [itemType, setItemType] = useState<'surah' | 'juz'>('surah');

  const handleAdd = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    
    // Check bounds
    if (itemType === 'surah' && (val < 1 || val > 114)) return;
    if (itemType === 'juz' && (val < 1 || val > 30)) return;

    setConfig((prev: any) => ({
      ...prev,
      type: 'include', // Default to include when adding specific items
      items: [...prev.items, { type: itemType, val }]
    }));
    setInputValue('');
  };

  // NEW: Handle Enter key inside the textbox
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Stops MemoBuddy from generating a verse
      handleAdd();
    }
  };

  const removeItem = (index: number) => {
    setConfig((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <select 
          value={itemType}
          onChange={(e) => setItemType(e.target.value as any)}
          className="border rounded-lg px-2 py-2 bg-white text-sm font-semibold text-emerald-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <option value="surah">Surah #</option>
          <option value="juz">Juz #</option>
        </select>
        
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 67"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
          onKeyDown={handleKeyDown} // Trigger local add on Enter
          className="flex-1 border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none"
        />
        
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold hover:bg-emerald-200 transition-colors"
        >
          Add
        </button>
      </div>

      {config.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.items.map((item: any, idx: number) => (
            <span 
              key={idx}
              className="flex items-center gap-1 bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
            >
              {item.type.toUpperCase()} {item.val}
              <button onClick={() => removeItem(idx)} className="ml-1 text-emerald-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}