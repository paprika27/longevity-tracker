
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

        // Dynamic Import for Capacitor to avoid crash on web if missing
        let isNative = false;
        try {
            const { Capacitor } = await import('@capacitor/core');
            isNative = Capacitor.isNativePlatform();
        } catch (e) {
            // Capacitor not available, assume web
        }

        if (isNative) {
            // --- NATIVE ANDROID/IOS EXPORT ---
            try {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                // 1. Write to binary string
                const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
                const fileName = `LongevityTracker_Data_${new Date().getTime()}.xlsx`;

                // 2. Save to Cache Directory (Best for sharing without extra permissions)
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: wbout,
                    directory: Directory.Cache, 
                });
                
                console.log('File written to:', result.uri);

                // 3. Share the file using the 'files' array (CRITICAL for Android)
                await Share.share({
                    title: 'Export Longevity Data',
                    text: 'Here is your exported data file.',
                    files: [result.uri], // Use 'files' instead of 'url' for local files
                    dialogTitle: 'Save Data'
                });
            } catch (fsError: any) {
                console.error("Native export error:", fsError);
                alert(`Native Export Failed: ${fsError.message || JSON.stringify(fsError)}`);
            }

        } else {
            // --- WEB EXPORT ---
            XLSX.writeFile(workbook, "LongevityTracker_Data.xlsx");
        }

    } catch (error: any) {
        console.error("Export failed:", error);
        alert(`Export Failed: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const parseDateString = (dateInput: any): string | null => {
      if (!dateInput) return null;

      if (dateInput instanceof Date) {
          const year = dateInput.getFullYear();
          const month = String(dateInput.getMonth() + 1).padStart(2, '0');
          const day = String(dateInput.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
      }
      
      if (typeof dateInput === 'number') {
          const d = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
          if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
          }
      }
      
      const str = String(dateInput).trim();
      const cleanStr = str.replace(/\s+([./-])/g, '$1').replace(/([./-])\s+/g, '$1');

      const dmyMatch = cleanStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
      if (dmyMatch) {
          let yearStr = dmyMatch[3];
          if (yearStr.length === 2) {
              const y = parseInt(yearStr);
              yearStr = (y > 40 ? '19' : '20') + yearStr;
          }
          return `${yearStr}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }

      const ymdMatch = cleanStr.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
      if (ymdMatch) {
          return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
      }
      
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
      }

      return null;
  };
  
  const parseMetricValue = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return val;
      
      const str = String(val).trim();
      if (str.includes(':')) {
          const parts = str.split(':');
          if (parts.length >= 2) {
              const h = parseFloat(parts[0]);
              const m = parseFloat(parts[1]);
              if (!isNaN(h) && !isNaN(m)) {
                  return parseFloat((h + m / 60).toFixed(2));
              }
          }
      }
      const parsed = parseFloat(str);
      return isNaN(parsed) ? null : parsed;
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

                    const groupedData: Record<string, MetricValues> = {};
                    const newMetricsMap: Map<string, Partial<MetricConfig>> = new Map();
                    let importedCount = 0;

                    jsonData.forEach((row, rowIndex) => {
                         const normRow: any = {};
                         Object.keys(row).forEach(k => normRow[k.toLowerCase().trim()] = row[k]);

                         const metricId = normRow['metric'];
                         const rawVal = normRow['value'];
                         const unit = normRow['unit'] || '';
                         const rawDate = normRow['date'];
                         let timeStr = normRow['time'];

                         if (!metricId || rawVal === undefined || !rawDate) return;
                         
                         const val = parseMetricValue(rawVal);
                         if (val === null) return;

                         const dateStr = parseDateString(rawDate);
                         if (!dateStr) return;

                         if (!timeStr) timeStr = "12:00";
                         
                         if (timeStr instanceof Date) {
                             timeStr = timeStr.toTimeString().slice(0, 5);
                         } else if (typeof timeStr === 'number') {
                             const totalSeconds = Math.round(timeStr * 86400);
                             const hours = Math.floor(totalSeconds / 3600);
                             const minutes = Math.floor((totalSeconds % 3600) / 60);
                             timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                         } else {
                             timeStr = String(timeStr).trim();
                             if (!timeStr.match(/^\d{1,2}:\d{2}/)) timeStr = "12:00";
                         }

                         let timestamp = new Date().toISOString();
                         try {
                             const d = new Date(`${dateStr}T${timeStr}`);
                             if (!isNaN(d.getTime())) {
                                 timestamp = d.toISOString();
                             } else {
                                 timestamp = new Date(dateStr).toISOString();
                             }
                         } catch (e) {}

                         if (!groupedData[timestamp]) {
                             groupedData[timestamp] = {};
                         }
                         groupedData[timestamp][metricId] = val;
                         importedCount++;

                         const existing = metrics.find(m => m.id === metricId);
                         if (!existing) {
                             newMetricsMap.set(metricId, { unit });
                         }
                    });

                    if (importedCount === 0) {
                        alert("No valid data found in file.");
                        setLoading(false);
                        return;
                    }

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
                        }
                    }

                    Object.entries(groupedData).forEach(([ts, values]) => {
                        db.saveEntry(values, ts);
                    });

                    alert(`Imported ${importedCount} points.`);
                    onImportComplete();

                } catch (err) {
                    console.error("Parse error:", err);
                    alert("Failed to parse file.");
                } finally {
                    setLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsBinaryString(file);
    } catch (error) {
        console.error("Import load error:", error);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert("Failed to load Excel library.");
    }
  };

  const handleJsonExport = async () => {
      const config = {
          metrics: db.getMetrics(),
          categories: db.getCategories(),
          regimen: db.getRegimen()
      };
      
      const dataStr = JSON.stringify(config, null, 2);

      let isNative = false;
      try {
           const { Capacitor } = await import('@capacitor/core');
           isNative = Capacitor.isNativePlatform();
      } catch (e) {}

      if (isNative) {
           const fileName = `Longevity_Config_${new Date().getTime()}.json`;
           try {
                const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: dataStr,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8
                });
                await Share.share({
                    title: 'Export Config',
                    files: [result.uri],
                });
            } catch (e: any) {
                alert(`Native Export Failed: ${e.message}`);
            }
      } else {
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "LongevityTracker_Config.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }
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
              if (data.metrics) { db.saveMetrics(data.metrics); updated = true; }
              if (data.categories) { db.saveCategories(data.categories); updated = true; }
              if (data.regimen) { db.saveRegimen(data.regimen); updated = true; }
              
              if (updated) {
                  alert("Configuration imported.");
                  onImportComplete();
              }
          } catch (err) {
              alert("Invalid JSON.");
          } finally {
            if (jsonInputRef.current) jsonInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleExcelImport} className="hidden" />
      <input type="file" accept=".json" ref={jsonInputRef} onChange={handleJsonImport} className="hidden" />
      
      <div className="flex gap-1 bg-white border border-slate-300 rounded-md shadow-sm">
        <button 
            onClick={handleExcelExport} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 border-r border-slate-200 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="hidden sm:inline">Data</span> <FileSpreadsheet className="w-3 h-3 text-green-600"/>
        </button>
        <button 
            onClick={() => fileInputRef.current?.click()} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
            <Upload className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-1 bg-white border border-slate-300 rounded-md shadow-sm">
        <button 
            onClick={handleJsonExport}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 border-r border-slate-200 transition-colors"
        >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Config</span> <FileJson className="w-3 h-3 text-orange-600"/>
        </button>
        <button 
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
            <Upload className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
