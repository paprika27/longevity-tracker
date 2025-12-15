import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { LogEntry } from '../types';
import * as db from '../services/storageService';

interface DataControlsProps {
  entries: LogEntry[];
  onImportComplete: () => void;
}

export const DataControls: React.FC<DataControlsProps> = ({ entries, onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (entries.length === 0) {
      alert("No data to export.");
      return;
    }
    setLoading(true);

    try {
        const XLSX = await import('xlsx');
        
        // Flatten entries for Excel
        const rows = entries.map(e => {
        const row: any = { Timestamp: e.timestamp, Date: new Date(e.timestamp).toLocaleDateString() };
        // Sort keys for consistent columns
        const allKeys = Object.keys(e.values).sort();
        allKeys.forEach(k => {
            row[k] = e.values[k];
        });
        return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Longevity Data");
        XLSX.writeFile(workbook, "LongevityTracker_Data.xlsx");
    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export data. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            if (bstr) {
                try {
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                let importedCount = 0;
                jsonData.forEach(row => {
                    // Reconstruct entry
                    const values: any = {};
                    Object.keys(row).forEach(key => {
                    if (key !== 'Timestamp' && key !== 'Date') {
                        values[key] = row[key];
                    }
                    });

                    const timestamp = row.Timestamp || new Date().toISOString();
                    
                    db.saveEntry(values, timestamp);
                    importedCount++;
                });

                alert(`Successfully imported ${importedCount} entries.`);
                onImportComplete();
                } catch (err) {
                console.error(err);
                alert("Failed to parse file. Please ensure it is a valid Excel file exported from this app.");
                } finally {
                    setLoading(false);
                }
            }
        };
        reader.readAsBinaryString(file);
    } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to load Excel processor.");
        setLoading(false);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex gap-2">
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        Export XLSX
      </button>
      <button 
        onClick={handleImportClick}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        Import XLSX
      </button>
    </div>
  );
};