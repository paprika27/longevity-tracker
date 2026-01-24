
import React, { useState, useEffect } from 'react';
import { Cloud, Loader2, LogIn, LogOut, User, Server, AlertTriangle, Terminal, Wifi, ShieldAlert, ExternalLink, Globe, Activity, X, Lock, RefreshCw, CheckCircle2, ChevronRight, Image as ImageIcon } from 'lucide-react';
import * as authService from '../services/authService';

interface AuthWidgetProps {
    onSyncComplete: () => void;
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ onSyncComplete }) => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('lt_user'));
    const [serverUrl, setServerUrl] = useState<string>(localStorage.getItem('lt_server_url') || 'http://localhost:3000');
    
    // Legacy Mode: Forces standard window.fetch instead of CapacitorHttp
    const [useWebFetch, setUseWebFetch] = useState<boolean>(() => {
        return localStorage.getItem('lt_use_web_fetch') === 'true';
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lt_last_sync'));
    
    // Debug Logging
    const [logs, setLogs] = useState<string[]>([]);
    
    // Platform State
    const [isNative, setIsNative] = useState(false);

    // Image Probe State (to detect if content loads even if fetch fails - e.g. CORS vs SSL)
    const [probeSuccess, setProbeSuccess] = useState<boolean | null>(null);

    useEffect(() => {
        import('@capacitor/core').then(mod => {
            setIsNative(mod.Capacitor.isNativePlatform());
        }).catch(() => setIsNative(false));
    }, []);

    const toggleWebFetch = (val: boolean) => {
        setUseWebFetch(val);
        localStorage.setItem('lt_use_web_fetch', String(val));
        addLog(`Switched to ${val ? 'Web Fetch' : 'Native HTTP'}`);
    };

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    };

    const runImageProbe = (url: string) => {
        // Tries to load an image from the server. If this succeeds but fetch fails, it's CORS.
        // If this fails, it's likely SSL or Network.
        setProbeSuccess(null);
        const img = new Image();
        img.onload = () => {
            addLog("Image Probe: SUCCESS (Basic connectivity OK)");
            setProbeSuccess(true);
        };
        img.onerror = () => {
             addLog("Image Probe: FAILED (Blocked or Network Down)");
             setProbeSuccess(false);
        };
        // Use a dummy image path or root if server serves index.html as fallback, usually triggers 200 OK
        // Adding timestamp to prevent cache
        img.src = `${url.replace(/\/$/, '')}/?t=${Date.now()}`; 
    };

    const handleTestConnection = async () => {
        setConnectionStatus('testing');
        setStatusMsg('Pinging server...');
        setProbeSuccess(null);
        addLog(`Testing Connection to: ${serverUrl}`);
        
        // Run passive probe
        runImageProbe(serverUrl);

        try {
            const result = await authService.checkConnection(serverUrl, useWebFetch);
            addLog(`Result: ${result.ok ? 'SUCCESS' : 'FAILED'} (${result.status}) - ${result.msg}`);
            
            if (result.ok) {
                setConnectionStatus('success');
                setStatusMsg('Server Reachable');
            } else {
                setConnectionStatus('failed');
                if (result.msg.includes('Redirect')) {
                    setStatusMsg('Redirect Detected (Protocol Mismatch?)');
                } else if (result.msg.includes('Failed to fetch') || result.msg.includes('Trust anchor')) {
                    setStatusMsg('SSL / Network Error');
                } else if (result.status === 408) {
                    setStatusMsg('Timeout (Check IP/Firewall)');
                } else {
                    setStatusMsg(`Error: ${result.msg}`);
                }
            }
        } catch (e: any) {
            setConnectionStatus('failed');
            setStatusMsg(e.message);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLogs([]); 
        
        try {
            localStorage.setItem('lt_server_url', serverUrl);
            const token = await authService.login(username, password, serverUrl, useWebFetch);
            localStorage.setItem('lt_user', token); 
            setUser(token);
            await handleSync(token, serverUrl);
            setIsModalOpen(false); // Close on success
        } catch (err: any) {
            setConnectionStatus('failed');
            setStatusMsg(err.message || 'Login Failed');
            addLog(`ERROR: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('lt_user');
        setUser(null);
    };

    const handleSync = async (tokenOverride?: string, urlOverride?: string) => {
        const token = tokenOverride || user;
        const url = urlOverride || serverUrl;
        if (!token) return;

        setLoading(true);
        try {
            await authService.syncData(token, url, useWebFetch);
            const now = new Date().toLocaleTimeString();
            localStorage.setItem('lt_last_sync', now);
            setLastSync(now);
            onSyncComplete();
            addLog(`Sync OK at ${now}`);
        } catch (err: any) {
            addLog(`Sync ERROR: ${err.message}`);
            alert(`Sync Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRedirectTrust = () => {
        if (confirm("We will now redirect you to your server URL.\n\n1. If you see a warning, click 'Advanced' -> 'Proceed'.\n2. Once the page loads (it might say 'Longevity Server OK'), use your device's BACK button to return here.\n\nReady?")) {
            window.location.href = serverUrl;
        }
    };

    if (!user) {
        return (
            <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
            >
                <LogIn className="w-3 h-3" /> Connect Server
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Server className="w-5 h-5 text-indigo-600" /> Server Connection
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Server URL Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Server URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 rounded-md border-slate-300 shadow-sm text-sm"
                                        placeholder="https://192.168.1.X:3000"
                                        value={serverUrl} 
                                        onChange={e => { setServerUrl(e.target.value); setConnectionStatus('idle'); }}
                                    />
                                    <button 
                                        onClick={handleTestConnection}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-md border border-slate-200"
                                        title="Test Connection"
                                    >
                                        {connectionStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>

                            {/* Connection Status & Fixes */}
                            {connectionStatus === 'failed' && (
                                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-red-700">Connection Failed</p>
                                            <p className="text-xs text-red-600">{statusMsg}</p>
                                        </div>
                                    </div>
                                    
                                    {/* DIAGNOSTIC HINTS */}
                                    <div className="text-[10px] text-red-800 bg-red-100/50 p-2 rounded mb-2">
                                        {probeSuccess === true && <p><strong>Analysis:</strong> Basic connectivity works (Image Probe OK), but API Fetch Failed. This usually means <strong>CORS</strong> issues on the server.</p>}
                                        {probeSuccess === false && <p><strong>Analysis:</strong> Image Probe Failed. The device cannot reach the server at all, or the SSL certificate is totally rejected.</p>}
                                        {probeSuccess === null && <p><strong>Analysis:</strong> Probe inconclusive.</p>}
                                    </div>

                                    {/* Smart Action Buttons */}
                                    <div className="mt-2 flex flex-col gap-2">
                                        {useWebFetch ? (
                                            <button 
                                                onClick={handleRedirectTrust}
                                                className="w-full bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold py-2 rounded flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Redirect to Trust Certificate
                                            </button>
                                        ) : (
                                            <p className="text-[10px] text-red-600 italic">
                                                Enable "Force Web Fetch" below to fix SSL issues manually.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {connectionStatus === 'success' && (
                                <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <p className="text-sm text-green-700 font-medium">{statusMsg}</p>
                                </div>
                            )}

                            {/* Advanced Options Toggle */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={useWebFetch} 
                                        onChange={e => toggleWebFetch(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Force Web Fetch (Required for Self-Signed SSL)</span>
                                </label>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                                        <input 
                                            type="text" 
                                            className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                            value={username} onChange={e => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                        <input 
                                            type="password" 
                                            className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <LogIn className="w-4 h-4"/>}
                                    Login & Sync
                                </button>
                            </form>
                            
                            {/* Debug Log Viewer */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <details>
                                    <summary className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer hover:text-slate-600">View Debug Logs</summary>
                                    <div className="mt-2 bg-slate-900 rounded p-2 h-24 overflow-y-auto custom-scrollbar">
                                        {logs.map((log, i) => (
                                            <div key={i} className="text-[10px] font-mono text-green-400 mb-1 border-b border-white/5 pb-0.5">{log}</div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3"/> {user}
                </span>
                <span className="text-[10px] text-slate-400">
                    Synced: {lastSync || 'Never'}
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
