
import React, { useState, useEffect } from 'react';
import { MetricConfig, AppSettings, DateFormat, TimeFormat } from '../types';
import { Plus, Trash2, Eye, EyeOff, Radar, Save, RotateCcw, PenSquare, CheckSquare, Square, X, Calculator, AlertTriangle, FlaskConical, Sliders, Clock } from 'lucide-react';
import * as db from '../services/storageService';

interface MetricManagerProps {
  metrics: MetricConfig[];
  onUpdate: (newMetrics: MetricConfig[]) => void;
  onRename?: (oldId: string, newId: string, newConfig: MetricConfig) => boolean;
  onFactoryReset: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

export const MetricManager: React.FC<MetricManagerProps> = ({ metrics, onUpdate, onRename, onFactoryReset, settings, onSettingsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MetricConfig>>({});
  
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  // Selection Mode (for Form Design)
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
      const cats = db.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0]);
  }, []);

  const handleUpdateCategories = (newCats: string[]) => {
      setCategories(newCats);
      db.saveCategories(newCats);
  };

  const handleAddCategory = () => {
      const name = prompt("Enter new form name (e.g., 'Morning Routine'):");
      if (name && !categories.includes(name)) {
          const newCats = [...categories, name];
          handleUpdateCategories(newCats);
          setActiveCategory(name);
      }
  };

  const handleDeleteCategory = (cat: string) => {
      if (categories.length <= 1) {
          alert("You must have at least one form.");
          return;
      }
      if (confirm(`Delete '${cat}' form? Metrics inside it will remain but won't be assigned to this form anymore.`)) {
          const newCats = categories.filter(c => c !== cat);
          handleUpdateCategories(newCats);
          setActiveCategory(newCats[0]);
          
          // Reassign metrics in this category to the first available category to avoid orphans
          const updatedMetrics = metrics.map(m => m.category === cat ? { ...m, category: newCats[0] } : m);
          onUpdate(updatedMetrics);
          db.saveMetrics(updatedMetrics);
      }
  };

  const handleToggleActive = (id: string) => {
    const updated = metrics.map(m => m.id === id ? { ...m, active: !m.active } : m);
    onUpdate(updated);
    db.saveMetrics(updated);
  };

  const handleToggleSpider = (id: string) => {
    const updated = metrics.map(m => m.id === id ? { ...m, includeInSpider: !m.includeInSpider } : m);
    onUpdate(updated);
    db.saveMetrics(updated);
  };

  const handleMoveToCategory = (id: string, targetCategory: string) => {
      const updated = metrics.map(m => m.id === id ? { ...m, category: targetCategory } : m);
      onUpdate(updated);
      db.saveMetrics(updated);
  };

  const startEdit = (metric: MetricConfig) => {
    setEditingId(metric.id);
    setEditForm({ ...metric });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const validateFormula = (formula: string): boolean => {
      // 1. Check syntax by creating function
      try {
          const f = new Function('vals', `with(vals) { return ${formula}; }`);
          
          // 2. Check variables. Simple regex to find words.
          // This is a naive check but helps basic typos.
          const vars = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
          const knownIds = metrics.map(m => m.id);
          // Filter out JS keywords/math object members to be safe? 
          // Actually, just checking if *some* variables exist is usually enough for a "quick check"
          // Let's just run it with dummy data.
          
          const dummyData: any = {};
          metrics.forEach(m => dummyData[m.id] = 1);
          
          f(dummyData); // Run it
          return true;
      } catch (e: any) {
          alert("Formula Error: " + e.message + "\n\nMake sure you are using valid Metric IDs (e.g. 'weight', 'height').");
          return false;
      }
  };

  const saveEdit = () => {
    if (!editingId) return;

    if (editForm.isCalculated && editForm.formula) {
        if (!validateFormula(editForm.formula)) return;
    }
    
    // Check for ID change
    if (editForm.id && editForm.id !== editingId && onRename) {
        const success = onRename(editingId, editForm.id, editForm as MetricConfig);
        if (!success) {
            // If merge was cancelled, keep edit mode open
            return; 
        }
    } else {
        // Normal Update
        const updated = metrics.map(m => m.id === editingId ? { ...m, ...editForm } as MetricConfig : m);
        onUpdate(updated);
        db.saveMetrics(updated);
    }
    
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNewMetric = () => {
    const newId = `custom_${Date.now()}`;
    const newMetric: MetricConfig = {
      id: newId,
      name: "New Metric",
      range: [0, 10],
      unit: "unit",
      fact: "Track your progress.",
      citation: "Self",
      step: 1,
      category: activeCategory, // Add to current view
      active: true,
      includeInSpider: true,
      isCalculated: false,
      isTimeBased: false
    };
    const updated = [...metrics, newMetric];
    onUpdate(updated);
    db.saveMetrics(updated);
    startEdit(newMetric);
  };

  const handleDeleteMetric = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this metric?")) return;
    const updated = metrics.filter(m => m.id !== id);
    onUpdate(updated);
    db.saveMetrics(updated);
  };

  const handleReset = () => {
    if (!window.confirm("Reset all metrics and forms to default? Custom settings will be lost.")) return;
    const defaultMetrics = db.resetMetrics();
    const defaultCats = db.resetCategories();
    onUpdate(defaultMetrics);
    setCategories(defaultCats);
    setActiveCategory(defaultCats[0]);
  };

  // Filter metrics
  const filteredMetrics = activeCategory === 'Calculated' 
      ? metrics.filter(m => m.isCalculated) 
      : metrics.filter(m => m.category === activeCategory && !m.isCalculated);

  return (
    <div className="space-y-6">
      
      {/* General Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" /> General Preferences
            </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date Format</label>
                <select
                    value={settings.dateFormat}
                    onChange={(e) => onSettingsChange({ ...settings, dateFormat: e.target.value as DateFormat })}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-white text-slate-900 font-medium"
                >
                    <option value="YYYY-MM-DD">ISO (YYYY-MM-DD)</option>
                    <option value="DD.MM.YYYY">EU (DD.MM.YYYY)</option>
                    <option value="MM/DD/YYYY">US (MM/DD/YYYY)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Used for reports and history axes.</p>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Time Format</label>
                <select
                    value={settings.timeFormat}
                    onChange={(e) => onSettingsChange({ ...settings, timeFormat: e.target.value as TimeFormat })}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-white text-slate-900 font-medium"
                >
                    <option value="24h">24 Hour (14:30)</option>
                    <option value="12h">12 Hour (2:30 PM)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Used for reports and tooltips.</p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header / Category Tabs */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-slate-800">Form Designer</h3>
                 <div className="flex gap-2">
                    <button onClick={handleReset} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 px-2 py-1">
                        <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                    <button onClick={handleAddNewMetric} className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                        <Plus className="w-3 h-3" /> Create New Metric
                    </button>
                 </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                {categories.map(cat => (
                    <div key={cat} className="relative group">
                        <button
                            onClick={() => setActiveCategory(cat)}
                            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors capitalize border ${
                                activeCategory === cat 
                                ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                                : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                        {categories.includes(cat) && categories.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                                className="absolute -top-1 -right-1 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                title="Delete Form"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
                 <button
                    onClick={() => setActiveCategory('Calculated')}
                    className={`text-sm font-medium px-4 py-2 rounded-md transition-colors capitalize border flex items-center gap-1.5 ${
                        activeCategory === 'Calculated'
                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm ring-1 ring-purple-200' 
                        : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Calculator className="w-3 h-3" /> Calculated
                </button>

                <button onClick={handleAddCategory} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Add New Form">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            {activeCategory !== 'Calculated' && (
            <div className="flex items-center gap-2 mt-2">
                <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                        isSelectionMode ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-300'
                    }`}
                >
                    {isSelectionMode ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
                    {isSelectionMode ? 'Done Selecting' : 'Select Metrics for this Form'}
                </button>
                {isSelectionMode && <span className="text-xs text-slate-500">Check metrics to add them to the <strong>{activeCategory}</strong> form.</span>}
            </div>
            )}
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {(isSelectionMode ? metrics.filter(m => !m.isCalculated) : filteredMetrics).map(m => {
            const isAssigned = m.category === activeCategory;
            return (
            <div key={m.id} className={`p-4 flex items-center gap-4 transition-colors ${isAssigned || activeCategory === 'Calculated' ? 'bg-white' : 'bg-slate-50/50 opacity-60'}`}>
              
              {/* Selection Checkbox (Only in Selection Mode) */}
              {isSelectionMode && activeCategory !== 'Calculated' && (
                  <button 
                    onClick={() => handleMoveToCategory(m.id, isAssigned ? (categories[0] === activeCategory ? categories[1] || 'archive' : categories[0]) : activeCategory)}
                    className={`p-1 rounded ${isAssigned ? 'text-indigo-600' : 'text-slate-300'}`}
                  >
                      {isAssigned ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
              )}

              {editingId === m.id ? (
                // --- EDIT MODE ---
                <div className="flex-1 bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Metric Name</label>
                            <input 
                                type="text" 
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">ID (Variable Name)</label>
                            <input 
                                type="text" 
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                value={editForm.id} 
                                onChange={e => setEditForm({...editForm, id: e.target.value.replace(/\s+/g, '_')})}
                                title="Editing this ID to an existing one will merge them."
                                placeholder="Unique ID"
                            />
                            <p className="text-[10px] text-slate-500">Change to rename. Set to existing ID to merge data.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Unit</label>
                            <input 
                                type="text" 
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                value={editForm.unit} 
                                onChange={e => setEditForm({...editForm, unit: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Target Min</label>
                            <input 
                                type="number" 
                                step={m.step}
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                value={editForm.range?.[0]} 
                                onChange={e => setEditForm({...editForm, range: [parseFloat(e.target.value), editForm.range?.[1] || 0]})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Target Max</label>
                            <input 
                                type="number" 
                                step={m.step}
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                value={editForm.range?.[1]} 
                                onChange={e => setEditForm({...editForm, range: [editForm.range?.[0] || 0, parseFloat(e.target.value)]})}
                            />
                        </div>

                        {/* Calculation Settings */}
                        <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-2 mt-2">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="isCalculated"
                                    checked={editForm.isCalculated || false}
                                    onChange={e => setEditForm({...editForm, isCalculated: e.target.checked})}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <label htmlFor="isCalculated" className="text-sm font-medium text-slate-700">Calculated Automatically (Compound Score)</label>
                             </div>
                             
                             {editForm.isCalculated && (
                                 <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                                     <div className="flex justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Formula (JS)</label>
                                        <button 
                                            onClick={() => { if(editForm.formula) validateFormula(editForm.formula) ? alert("Formula is valid!") : null; }}
                                            className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 border border-green-200 flex items-center gap-1"
                                        >
                                            <FlaskConical className="w-3 h-3"/> Test Syntax
                                        </button>
                                     </div>
                                     <input 
                                        type="text" 
                                        className="w-full font-mono text-sm text-slate-900 border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white mb-1" 
                                        value={editForm.formula || ''} 
                                        onChange={e => setEditForm({...editForm, formula: e.target.value})}
                                        placeholder="e.g. weight / ((height/100) * (height/100))"
                                     />
                                     <p className="text-[10px] text-slate-500">
                                         Available variables: {metrics.map(x => x.id).join(', ')}. <br/>
                                         Example: <span className="font-mono text-slate-700">weight / Math.pow(height/100, 2)</span>
                                     </p>
                                 </div>
                             )}
                        </div>
                        
                        {/* Time Format Toggle */}
                        {!editForm.isCalculated && (
                        <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-2">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="isTimeBased"
                                    checked={editForm.isTimeBased || false}
                                    onChange={e => setEditForm({...editForm, isTimeBased: e.target.checked})}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <div className="flex flex-col">
                                    <label htmlFor="isTimeBased" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" /> Input as Time Format
                                    </label>
                                    <span className="text-[10px] text-slate-500">
                                        Converts inputs like "6:30" (Base 60) to 6.5 (Decimal). Useful for Sleep (hrs:min), Pace (min:sec), etc.
                                    </span>
                                </div>
                             </div>
                        </div>
                        )}

                        {!editForm.isCalculated && (
                        <div className="space-y-1 md:col-span-2 mt-2">
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Assigned Form</label>
                             <select 
                                className="w-full text-sm font-medium text-slate-900 border-slate-300 rounded-md bg-white"
                                value={editForm.category}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                             >
                                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                 <option value="imported">Unassigned / Imported</option>
                             </select>
                        </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                        <button onClick={cancelEdit} className="text-sm font-medium px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={saveEdit} className="text-sm font-medium px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm">
                            <Save className="w-4 h-4"/> Save Changes
                        </button>
                    </div>
                </div>
              ) : (
                // --- VIEW MODE ---
                <>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-base ${m.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{m.name}</h4>
                            {!m.active && <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-medium">Hidden</span>}
                            {m.isCalculated && <span className="text-[10px] uppercase bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><Calculator className="w-3 h-3"/> Auto</span>}
                            {m.isTimeBased && <span className="text-[10px] uppercase bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Time</span>}
                            {!isAssigned && isSelectionMode && <span className="text-[10px] uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">In {m.category}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                             <span className="font-mono text-slate-400">ID: {m.id}</span>
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">{m.range[0]} - {m.range[1]} {m.unit}</span>
                             {m.active && m.includeInSpider && <span className="flex items-center gap-0.5 text-blue-600"><Radar className="w-3 h-3"/> Spider</span>}
                        </div>
                    </div>
                    
                    {!isSelectionMode && (
                    <div className="flex items-center gap-2">
                         {/* Toggle Active (Show in Forms) */}
                         {!m.isCalculated && (
                         <button 
                            onClick={() => handleToggleActive(m.id)}
                            title={m.active ? "Hide from Input Forms" : "Show in Input Forms"}
                            className={`p-2 rounded-md transition-colors ${m.active ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            {m.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                         )}
                        
                        {/* Toggle Spider (Show in Chart) */}
                        <button 
                            onClick={() => handleToggleSpider(m.id)}
                            title={m.includeInSpider ? "Remove from Radar Chart" : "Add to Radar Chart"}
                            className={`p-2 rounded-md transition-colors ${m.includeInSpider ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Radar className="w-4 h-4" />
                        </button>

                        <button 
                            onClick={() => startEdit(m)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-md hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <PenSquare className="w-3 h-3" /> Edit
                        </button>
                        
                        <button 
                            onClick={() => handleDeleteMetric(m.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Metric"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    )}
                </>
              )}
            </div>
            );
          })}
          {(isSelectionMode ? metrics.filter(m => !m.isCalculated) : filteredMetrics).length === 0 && (
              <div className="p-12 text-center text-slate-400">
                  <p className="italic mb-2">No metrics found.</p>
                  {activeCategory !== 'Calculated' && (
                  <button onClick={() => setIsSelectionMode(true)} className="text-indigo-600 font-medium hover:underline text-sm">
                      Select metrics for {activeCategory}
                  </button>
                  )}
                  {activeCategory === 'Calculated' && (
                      <p className="text-xs">Create a new metric and check "Calculated Automatically" to add it here.</p>
                  )}
              </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5"/> Danger Zone
        </h3>
        <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <h4 className="font-semibold text-red-900">Factory Reset</h4>
                <p className="text-sm text-red-700">Irreversibly wipe all data, metrics, and settings. Returns app to fresh state.</p>
            </div>
            <button 
                onClick={onFactoryReset}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
                <Trash2 className="w-4 h-4"/> Delete Everything
            </button>
        </div>
      </div>
    </div>
  );
};
