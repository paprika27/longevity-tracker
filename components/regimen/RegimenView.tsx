
import React, { useState, useEffect } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import * as db from '../../services/storageService';

export const RegimenView: React.FC = () => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setContent(db.getRegimen());
  }, []);

  const handleEdit = () => {
    setEditValue(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    db.saveRegimen(editValue);
    setContent(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Helper: Inline Styles (Bold, Basic Cleanup)
  const parseInline = (text: string) => {
    if (!text) return null;

    // Split by bold syntax **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        
        // Cleanup for specific notations like $VO_{2}max$ -> VO2max
        // Remove $ delimiters
        let cleanPart = part.replace(/\$/g, '');
        // We could do more complex replacement here if needed
        
        return cleanPart;
    });
  };

  // Helper: Render Table
  const renderTable = (rows: string[], keyPrefix: number) => {
      // 1. Identify Headers
      const headerLine = rows[0];
      // 2. Identify Alignment Row (contains '---')
      const alignLine = rows.length > 1 && rows[1].includes('---') ? rows[1] : null;
      const dataStart = alignLine ? 2 : 1;
      
      const parseCells = (line: string) => {
          return line.split('|').map(c => c.trim()).filter((c, i, arr) => {
             // Handle surrounding pipes |...| by ignoring first/last empty cells
             if (i === 0 && c === '') return false;
             if (i === arr.length - 1 && c === '') return false;
             return true;
          });
      };

      const headers = parseCells(headerLine);
      const alignments = alignLine ? parseCells(alignLine).map(s => {
          if (s.startsWith(':') && s.endsWith(':')) return 'center';
          if (s.endsWith(':')) return 'right';
          return 'left';
      }) : headers.map(() => 'left');

      return (
          <div key={keyPrefix} className="overflow-x-auto mb-6 rounded-lg border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                      <tr>
                          {headers.map((h, i) => (
                              <th 
                                key={i} 
                                className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-${alignments[i] || 'left'}`}
                                style={{ textAlign: alignments[i] as any }}
                              >
                                  {parseInline(h)}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-sm text-slate-700">
                      {rows.slice(dataStart).map((row, rIdx) => {
                          const cells = parseCells(row);
                          return (
                              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  {cells.map((cell, cIdx) => (
                                      <td 
                                        key={cIdx} 
                                        className={`px-4 py-3 whitespace-pre-wrap`}
                                        style={{ textAlign: alignments[cIdx] as any }}
                                      >
                                          {parseInline(cell)}
                                      </td>
                                  ))}
                                  {/* Fill empty cells if row is unbalanced */}
                                  {Array.from({ length: Math.max(0, headers.length - cells.length) }).map((_, i) => <td key={`empty-${i}`} className="px-4 py-3"></td>)}
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      );
  };

  // Main Parser
  const renderContent = () => {
      const lines = content.split('\n');
      const output = [];
      let i = 0;

      while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // Table Detection (Starts with |)
          if (trimmed.startsWith('|')) {
              const tableLines = [];
              // Consume consecutive table lines
              while (i < lines.length && lines[i].trim().startsWith('|')) {
                  tableLines.push(lines[i]);
                  i++;
              }
              output.push(renderTable(tableLines, i));
              continue;
          }

          // Headers
          if (line.startsWith('### ')) {
              output.push(<h3 key={i} className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">{line.replace('### ', '')}</h3>);
          } else if (line.startsWith('## ')) {
              output.push(<h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">{line.replace('## ', '')}</h2>);
          } else if (line.startsWith('#### ')) {
             output.push(<h4 key={i} className="text-md font-bold text-slate-800 mt-4 mb-2">{line.replace('#### ', '')}</h4>);
          }
          // Unordered Lists
          else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
               output.push(
                   <div key={i} className="ml-4 flex items-start gap-2 mb-1">
                       <span className="text-slate-400 mt-1.5">•</span>
                       <div className="text-slate-700 leading-relaxed">{parseInline(trimmed.substring(2))}</div>
                   </div>
               );
          }
          // Numbered Lists
          else if (/^\d+\./.test(trimmed)) {
              const match = trimmed.match(/^(\d+)\./);
              const num = match ? match[1] : '•';
              const text = trimmed.replace(/^\d+\.\s*/, '');
              output.push(
                   <div key={i} className="ml-4 flex items-start gap-2 mb-1">
                       <span className="font-mono text-xs text-slate-400 font-bold mt-1">{num}.</span>
                       <div className="text-slate-700 leading-relaxed">{parseInline(text)}</div>
                   </div>
               );
          }
          // Separator
          else if (trimmed === '---') {
              output.push(<hr key={i} className="my-6 border-slate-200" />);
          }
          // Empty Lines
          else if (trimmed === '') {
              output.push(<div key={i} className="h-2"></div>);
          }
          // Standard Paragraphs
          else {
              output.push(<p key={i} className="text-slate-700 mb-2 leading-relaxed">{parseInline(line)}</p>);
          }

          i++;
      }
      return output;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isEditing ? (
            <div className="flex gap-2">
                <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">
                    <Save className="w-4 h-4" /> Save Protocol
                </button>
            </div>
        ) : (
            <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <Pencil className="w-4 h-4" /> Edit Regimen
            </button>
        )}
      </div>

      {isEditing ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <textarea 
                className="w-full h-[600px] p-4 font-mono text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter your regimen in Markdown format..."
              />
              <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-4">
                  <span className="font-mono">## Header 2</span>
                  <span className="font-mono">| Table | Row |</span>
                  <span className="font-mono">* Bullet</span>
                  <span className="font-mono">**Bold**</span>
              </div>
          </div>
      ) : (
          <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm">
             <div className="max-w-4xl mx-auto space-y-1">
                {renderContent()}
             </div>
          </div>
      )}
    </div>
  );
};
