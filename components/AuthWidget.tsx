
import React, { useState, useEffect } from 'react';
import { Cloud, Loader2, LogIn, LogOut, User, Server, AlertTriangle, Terminal } from 'lucide-react';
import * as authService from '../services/authService';

interface AuthWidgetProps {
    onSyncComplete: () => void;
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ onSyncComplete }) => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('lt_user'));
    const [serverUrl, setServerUrl] = useState<string>(localStorage.getItem('lt_server_url') || 'http://localhost:3001');
    
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lt_last_sync'));
    
    // Debug Logging
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    
    // Platform State
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        // Dynamic import to determine platform safety
        import('@capacitor/core').then(mod => {
            setIsNative(mod.Capacitor.isNativePlatform());
        }).catch(() => {
            setIsNative(false);
        });
    }, []);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    };

    const isLocalhost = serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setLogs([]); // Clear logs on new attempt
        
        addLog(`Initiating Login to: ${serverUrl}`);
        
        try {
            localStorage.setItem('lt_server_url', serverUrl);
            
            addLog(`Sending POST to ${serverUrl}/api/login...`);
            const token = await authService.login(username, password, serverUrl);
            addLog(`Login Success! Token: ${token}`);
            
            localStorage.setItem('lt_user', token); 
            setUser(token);
            setIsOpen(false);
            
            // Auto sync
            await handleSync(token, serverUrl);
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Unknown Error';
            addLog(`ERROR: ${msg}`);
            if (msg.includes('Failed to fetch')) {
                 addLog(`HINT: Failed to fetch usually means the server is unreachable. Check IP and Port.`);
            }
            setError('Connection failed. See Logs.');
            setShowLogs(true); // Auto open logs on error
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('lt_user');
        setUser(null);
        setIsOpen(false);
    };

    const handleSync = async (tokenOverride?: string, urlOverride?: string) => {
        const token = tokenOverride || user;
        const url = urlOverride || serverUrl;
        
        if (!token) return;

        setLoading(true);
        addLog(`Sync started...`);
        try {
            await authService.syncData(token, url);
            const now = new Date().toLocaleTimeString();
            localStorage.setItem('lt_last_sync', now);
            setLastSync(now);
            onSyncComplete();
            addLog(`Sync Completed Successfully at ${now}`);
        } catch (err: any) {
            addLog(`Sync ERROR: ${err.message}`);
            if (!isOpen) alert(`Sync failed. Check connection.`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <LogIn className="w-3 h-3" /> Login / Sync
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                        <h3 className="text-sm font-bold text-slate-800 mb-2">Sync Settings</h3>
                        
                        <form onSubmit={handleLogin} className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Server URL</label>
                                <div className="relative">
                                    <Server className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className={`w-full text-sm border-slate-300 rounded-md pl-8 ${isNative && isLocalhost ? 'border-orange-300 bg-orange-50' : ''}`}
                                        placeholder="http://192.168.1.X:3001"
                                        value={serverUrl} onChange={e => setServerUrl(e.target.value)}
                                        required
                                    />
                                </div>
                                {isNative && isLocalhost && (
                                    <div className="flex gap-2 mt-1.5 p-2 bg-orange-50 border border-orange-100 rounded text-[10px] text-orange-800 leading-tight">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <p>
                                            <strong>Android Warning:</strong> 'localhost' refers to the phone itself, not your PC. 
                                            Use your PC's local IP (e.g. 192.168.1.50).
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="border-t border-slate-100 my-2"></div>

                            <div>
                                <input 
                                    type="text" placeholder="Username" 
                                    className="w-full text-sm border-slate-300 rounded-md mb-2"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    required
                                />
                                <input 
                                    type="password" placeholder="Password" 
                                    className="w-full text-sm border-slate-300 rounded-md"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>}
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Connecting...' : 'Login & Sync'}
                            </button>
                        </form>

                        {/* DEBUG TOGGLE */}
                        <div className="mt-4 border-t border-slate-100 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 uppercase font-bold"
                            >
                                <Terminal className="w-3 h-3" /> {showLogs ? 'Hide' : 'Show'} Debug Logs
                            </button>
                            
                            {showLogs && (
                                <div className="mt-2 bg-slate-900 rounded p-2 h-32 overflow-y-auto custom-scrollbar">
                                    {logs.length === 0 && <p className="text-[10px] text-slate-500 italic">No logs yet...</p>}
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-[10px] font-mono text-green-400 mb-1 break-all">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3"/> {user}
                </span>
                <span className="text-[10px] text-slate-400">
                    Last sync: {lastSync || 'Never'}
                </span>
            </div>
            
            <button 
                onClick={() => handleSync()} 
                disabled={loading}
                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                title="Sync Now"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            </button>
            
            <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
};
