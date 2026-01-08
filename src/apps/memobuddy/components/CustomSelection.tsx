// src/apps/memobuddy/components/CustomSelection.tsx

import React, { useState } from 'react';

export function CustomSelection({ config, setConfig }: any) {
  const [inputValue, setInputValue] = useState('');
  const [itemType, setItemType] = useState<'surah' | 'juz'>('surah');

  const handleAdd = () => {
    if (!inputValue.trim()) return;

    const addedValues: number[] = [];
    const rangeMatch = inputValue.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(itemType === 'surah' ? 114 : 30, Math.max(start, end));

      for (let i = min; i <= max; i++) {
        addedValues.push(i);
      }
    } else {
      const val = parseInt(inputValue);
      if (!isNaN(val)) {
        if ((itemType === 'surah' && val >= 1 && val <= 114) || (itemType === 'juz' && val >= 1 && val <= 30)) {
          addedValues.push(val);
        }
      }
    }

    if (addedValues.length > 0) {
      setConfig((prev: any) => {
        // 1. Combine existing items of the same type with new values
        const currentVals = prev.items
          .filter((i: any) => i.type === itemType)
          .map((i: any) => i.val);
        
        // 2. Use a Set to remove duplicates
        const combinedUnique = Array.from(new Set([...currentVals, ...addedValues]));
        
        // 3. Sort in ascending order
        const sortedUnique = combinedUnique.sort((a, b) => a - b);

        // 4. Rebuild the list (keeping other types if they existed)
        const otherItems = prev.items.filter((i: any) => i.type !== itemType);
        const updatedItems = [
          ...otherItems,
          ...sortedUnique.map(v => ({ type: itemType, val: v }))
        ];

        return { ...prev, items: updatedItems };
      });
    }
    setInputValue('');
  };

  const handleClear = () => {
    setConfig((prev: any) => ({ ...prev, items: [] }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAdd();
    }
  };

  return (
    <div className="mb-4 w-full space-y-4">
      {/* Type Switcher */}
      <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-100">
        {(['include', 'exclude', 'exact'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setConfig({ ...config, type: t })}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              config.type === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600/60'
            }`}
          >
            {t === 'include' ? 'Select These' : t === 'exclude' ? 'All Except' : 'Exact Range'}
          </button>
        ))}
      </div>

      {config.type !== 'exact' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full gap-2">
            <select value={itemType} onChange={(e) => setItemType(e.target.value as any)} 
              className="border rounded-lg px-2 py-2 bg-white text-xs font-bold text-emerald-700 outline-none">
              <option value="surah">Surah</option>
              <option value="juz">Juz</option>
            </select>
            <input 
              type="text" 
              placeholder={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Number`}
              value={inputValue} 
              onKeyDown={handleKeyDown}
              onChange={(e) => setInputValue(e.target.value.replace(/[^0-9-]/g, ''))}
              className="flex-1 border rounded-lg px-4 py-2 bg-white shadow-sm text-sm outline-none focus:ring-2 focus:ring-emerald-300" 
            />
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-6 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors">
              Add to List
            </button>
            <button onClick={handleClear} className="px-6 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
              Clear List
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-h-28 overflow-y-auto w-full p-1 border-t border-emerald-50 pt-3">
            {config.items.map((item: any, idx: number) => (
              <span key={idx} className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                {item.type.toUpperCase()} {item.val}
                <button onClick={() => setConfig({...config, items: config.items.filter((_:any,i:number)=>i!==idx)})} className="ml-1.5 text-emerald-300 hover:text-rose-500 transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label className="text-[9px] uppercase font-bold text-emerald-600 pl-1">Start</label>
            <div className="flex gap-1">
              <input type="number" placeholder="Surah" className="w-full border rounded p-2 text-xs outline-none" onChange={e => setConfig({...config, exact: {...config.exact, startSurah: +e.target.value}})} />
              <input type="number" placeholder="Ayah" className="w-full border rounded p-2 text-xs outline-none" onChange={e => setConfig({...config, exact: {...config.exact, startAyah: +e.target.value}})} />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[9px] uppercase font-bold text-emerald-600 pl-1">End</label>
            <div className="flex gap-1">
              <input type="number" placeholder="Surah" className="w-full border rounded p-2 text-xs outline-none" onChange={e => setConfig({...config, exact: {...config.exact, endSurah: +e.target.value}})} />
              <input type="number" placeholder="Ayah" className="w-full border rounded p-2 text-xs outline-none" onChange={e => setConfig({...config, exact: {...config.exact, endAyah: +e.target.value}})} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}