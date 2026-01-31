
import React, { useState, useEffect } from 'react';
import { MetricConfig, MetricValues, AppSettings } from '../../types';
import { FormattedDateInput, FormattedTimeInput, FormattedDurationInput } from '../shared/FormattedInputs';
import { RotateCcw } from 'lucide-react';
import { toIsoDate } from '../../services/engine';

interface EntryFormProps {
    metrics: MetricConfig[];
    categories: string[];
    settings: AppSettings;
    onSave: (values: MetricValues, timestamp: string) => void;
    onCancel: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ metrics, categories, settings, onSave, onCancel }) => {
    const [entryDate, setEntryDate] = useState(() => toIsoDate(new Date()));
    const [entryTime, setEntryTime] = useState(() => new Date().toTimeString().slice(0, 5));
    const [newEntryValues, setNewEntryValues] = useState<MetricValues>({});
    const [activeFormCategory, setActiveFormCategory] = useState<string>('daily');

    // Default to first valid category if current is invalid
    useEffect(() => {
        if (categories.length > 0 && !categories.includes(activeFormCategory)) {
            // Prefer 'inputs' or 'daily' if available, else first
            if (categories.includes('inputs')) setActiveFormCategory('inputs');
            else if (categories.includes('daily')) setActiveFormCategory('daily');
            else setActiveFormCategory(categories[0]);
        }
    }, [categories, activeFormCategory]);

    const setNow = () => {
        const now = new Date();
        setEntryDate(toIsoDate(now));
        setEntryTime(now.toTimeString().slice(0, 5));
    };

    const handleInputChange = (id: string, val: string | number | null) => {
        setNewEntryValues(prev => ({
            ...prev,
            [id]: val === '' ? null : (typeof val === 'string' ? parseFloat(val) : val)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanValues: MetricValues = {};
        Object.keys(newEntryValues).forEach(k => {
            if (newEntryValues[k] !== null && newEntryValues[k] !== undefined && !isNaN(newEntryValues[k] as number)) {
                cleanValues[k] = newEntryValues[k];
            }
        });
        if (Object.keys(cleanValues).length === 0) return;

        let timestampStr = new Date().toISOString();
        try {
            const combined = new Date(`${entryDate}T${entryTime}`);
            if (!isNaN(combined.getTime())) timestampStr = combined.toISOString();
        } catch (e) {}

        onSave(cleanValues, timestampStr);
        setNewEntryValues({});
        alert("Data saved successfully!");
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Log Metrics</h2>
                <div className="flex space-x-1 sm:space-x-4 mt-4 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveFormCategory(cat)} className={`text-sm font-medium px-3 py-2 border-b-2 capitalize whitespace-nowrap ${activeFormCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{cat}</button>
                    ))}
                </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-100">
                    <FormattedDateInput value={entryDate} onChange={setEntryDate} format={settings.dateFormat} />
                    <div className="flex gap-2">
                        <FormattedTimeInput value={entryTime} onChange={setEntryTime} format={settings.timeFormat} />
                        <button type="button" onClick={setNow} className="px-3 py-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"><RotateCcw className="w-3 h-3 text-slate-600"/></button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).map(m => {
                        const isBool = m.range[0] === 0 && m.range[1] === 1 && m.step === 1;
                        const isTime = m.isTimeBased !== undefined ? m.isTimeBased : (m.unit && m.unit.includes('hour'));
                        return (
                            <div key={m.id}>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">{m.name} <span className="text-slate-500 font-normal">({m.unit})</span></label>
                                {isBool ? (
                                    <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-md bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors h-[42px]">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            checked={newEntryValues[m.id] === 1}
                                            onChange={e => handleInputChange(m.id, e.target.checked ? 1 : 0)}
                                        />
                                        <span className={`text-sm font-medium ${newEntryValues[m.id] === 1 ? 'text-indigo-700' : 'text-slate-500'}`}>
                                            {newEntryValues[m.id] === 1 ? 'Yes' : 'No'}
                                        </span>
                                    </label>
                                ) : isTime ? (
                                    <FormattedDurationInput value={newEntryValues[m.id] as number} onChange={val => handleInputChange(m.id, val)} unit={m.unit} />
                                ) : (
                                    <input type="number" step={m.step} className="w-full rounded-md border-slate-300 shadow-sm px-4 py-2 border bg-white text-slate-900 font-medium" value={newEntryValues[m.id] ?? ''} onChange={e => handleInputChange(m.id, e.target.value)} />
                                )}
                            </div>
                        );
                    })}
                    {metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).length === 0 && (
                        <div className="col-span-2 text-center text-slate-400 italic py-4">No input metrics in this category.</div>
                    )}
                </div>
                <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-slate-100">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg bg-white text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">Save Entry</button>
                </div>
            </form>
         </div>
    );
};
