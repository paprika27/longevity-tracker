import React, { useState, useEffect } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import * as db from '../services/storageService';

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

  // Simple Markdown Renderer (Headers, Bold, Lists)
  const renderMarkdown = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, idx) => {
          if (line.startsWith('### ')) {
              return <h3 key={idx} className="text-lg font-bold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('## ')) {
              return <h2 key={idx} className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('* ')) {
              const content = line.replace('* ', '');
              // Handle bolding within list items
              const parts = content.split('**');
              return (
                <li key={idx} className="ml-4 list-disc text-slate-700 mb-1 pl-1">
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part)}
                </li>
              );
          }
           if (line.match(/^\d+\./)) {
               // Numbered list
               const content = line.replace(/^\d+\.\s/, '');
               const parts = content.split('**');
               return (
                  <div key={idx} className="ml-4 flex gap-2 text-slate-700 mb-1">
                      <span className="font-mono text-slate-400 font-bold">{line.match(/^\d+\./)?.[0]}</span>
                      <span>
                        {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part)}
                      </span>
                  </div>
               );
           }
          
          if (line.trim() === '') return <div key={idx} className="h-2"></div>;
          
          return <p key={idx} className="text-slate-700 mb-2 leading-relaxed">{line}</p>;
      });
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
              <p className="text-xs text-slate-500 mt-2 flex gap-4">
                  <span>## Header 2</span>
                  <span>### Header 3</span>
                  <span>* Bullet point</span>
                  <span>**Bold Text**</span>
              </p>
          </div>
      ) : (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
             <div className="max-w-4xl mx-auto">
                {renderMarkdown(content)}
             </div>
          </div>
      )}
    </div>
  );
};
