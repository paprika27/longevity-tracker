import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { LogEntry, MetricConfig, MetricValues } from '../types';
import * as db from '../services/storageService';

interface DataControlsProps {
  entries: LogEntry[];
  metrics: MetricConfig[];
  onImportComplete: () => void;
}

export const DataControls: React.FC<DataControlsProps> = ({ entries, metrics, onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // --- EXCEL HANDLERS ---

  const handleExcelExport = async () => {
    if (entries.length === 0) {
      alert("No data to export.");
      return;
    }
    setLoading(true);

    try {
        const xlsxModule = await import('xlsx');
        const XLSX = xlsxModule.default || xlsxModule;
        
        // Transform to Long Format: metric | value | unit | date | time
        const rows: any[] = [];
        
        entries.forEach(entry => {
            const dateObj = new Date(entry.timestamp);
            // Use local date components to avoid UTC shifts
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const timeStr = dateObj.toTimeString().slice(0, 5); // HH:MM

            Object.entries(entry.values).forEach(([metricId, val]) => {
                if (val !== null && val !== undefined) {
                    const config = metrics.find(m => m.id === metricId);
                    rows.push({
                        metric: metricId,
                        value: val,
                        unit: config?.unit || '',
                        date: dateStr,
                        time: timeStr
                    });
                }
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Longevity Data");
        XLSX.writeFile(workbook, "LongevityTracker_Data.xlsx");
    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export data. Check console for details.");
    } finally {
        setLoading(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
        const xlsxModule = await import('xlsx');
        const XLSX = xlsxModule.default || xlsxModule;
        
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            if (bstr) {
                try {
                    const workbook = XLSX.read(bstr, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { cellDates: true } as any);

                    // We expect columns: metric, value, unit, date, time
                    // Group by Timestamp
                    const groupedData: Record<string, MetricValues> = {};
                    const newMetricsMap: Map<string, Partial<MetricConfig>> = new Map();

                    jsonData.forEach(row => {
                         const metricId = row['metric'];
                         const val = row['value'];
                         const unit = row['unit'] || '';
                         let dateStr = row['date'];
                         let timeStr = row['time'];

                         if (!metricId || val === undefined || !dateStr) return;

                         // Handle date if it comes as object (from cellDates: true)
                         if (dateStr instanceof Date) {
                             // Convert back to YYYY-MM-DD
                             const year = dateStr.getFullYear();
                             const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                             const day = String(dateStr.getDate()).padStart(2, '0');
                             dateStr = `${year}-${month}-${day}`;
                         }

                         // Default time if missing
                         if (!timeStr) timeStr = "12:00";

                         // Construct Timestamp (Local -> ISO)
                         let timestamp = new Date().toISOString();
                         try {
                             // Create date in local time
                             const d = new Date(`${dateStr}T${timeStr}`);
                             if (!isNaN(d.getTime())) {
                                 timestamp = d.toISOString();
                             }
                         } catch (e) {}

                         // Key for grouping
                         if (!groupedData[timestamp]) {
                             groupedData[timestamp] = {};
                         }
                         groupedData[timestamp][metricId] = val;

                         // Track potential new metrics
                         const existing = metrics.find(m => m.id === metricId);
                         if (!existing) {
                             newMetricsMap.set(metricId, { unit });
                         }
                    });

                    // Handle New Metrics
                    if (newMetricsMap.size > 0) {
                        const existingMetrics = db.getMetrics();
                        const toAdd: MetricConfig[] = [];
                        newMetricsMap.forEach((conf, id) => {
                            if (!existingMetrics.find(m => m.id === id)) {
                                toAdd.push({
                                    id,
                                    name: id.charAt(0).toUpperCase() + id.slice(1),
                                    range: [0, 100],
                                    unit: conf.unit || '',
                                    fact: 'Imported',
                                    citation: 'Import',
                                    step: 1,
                                    category: 'imported',
                                    active: true,
                                    includeInSpider: false
                                });
                            }
                        });
                        if (toAdd.length > 0) {
                             db.saveMetrics([...existingMetrics, ...toAdd]);
                             alert(`Added ${toAdd.length} new metrics from file.`);
                        }
                    }

                    // Save Entries
                    Object.entries(groupedData).forEach(([ts, values]) => {
                        db.saveEntry(values, ts);
                    });

                    alert(`Successfully imported entries.`);
                    onImportComplete();

                } catch (err) {
                    console.error("Parse error:", err);
                    alert("Failed to parse Excel file.");
                } finally {
                    setLoading(false);
                }
            }
        };
        reader.readAsBinaryString(file);
    } catch (error) {
        console.error("Import load error:", error);
        setLoading(false);
        alert("Failed to load Excel library.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // --- JSON HANDLERS ---

  const handleJsonExport = () => {
      const config = {
          metrics: db.getMetrics(),
          categories: db.getCategories(),
          regimen: db.getRegimen()
      };
      
      const dataStr = JSON.stringify(config, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = "LongevityTracker_Config.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const str = evt.target?.result as string;
              const data = JSON.parse(str);
              
              let updated = false;
              if (data.metrics && Array.isArray(data.metrics)) {
                  db.saveMetrics(data.metrics);
                  updated = true;
              }
              if (data.categories && Array.isArray(data.categories)) {
                  db.saveCategories(data.categories);
                  updated = true;
              }
              if (typeof data.regimen === 'string') {
                  db.saveRegimen(data.regimen);
                  updated = true;
              }
              
              if (updated) {
                  alert("Configuration imported successfully.");
                  onImportComplete();
              } else {
                  alert("No valid configuration data found in JSON.");
              }
          } catch (err) {
              console.error(err);
              alert("Invalid JSON file.");
          }
      };
      reader.readAsText(file);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Hidden Inputs */}
      <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleExcelImport} className="hidden" />
      <input type="file" accept=".json" ref={jsonInputRef} onChange={handleJsonImport} className="hidden" />
      
      {/* Excel Controls */}
      <div className="flex gap-1 bg-white border border-slate-300 rounded-md shadow-sm">
        <button 
            onClick={handleExcelExport} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 border-r border-slate-200 transition-colors disabled:opacity-50"
            title="Export Data (XLSX)"
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="hidden sm:inline">Data</span> <FileSpreadsheet className="w-3 h-3 text-green-600"/>
        </button>
        <button 
            onClick={() => fileInputRef.current?.click()} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Import Data (XLSX)"
        >
            <Upload className="w-3 h-3" />
        </button>
      </div>

      {/* JSON Controls */}
      <div className="flex gap-1 bg-white border border-slate-300 rounded-md shadow-sm">
        <button 
            onClick={handleJsonExport}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 border-r border-slate-200 transition-colors"
            title="Export Settings (JSON)"
        >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Config</span> <FileJson className="w-3 h-3 text-orange-600"/>
        </button>
        <button 
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            title="Import Settings (JSON)"
        >
            <Upload className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};