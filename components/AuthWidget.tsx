
import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2, LogIn, LogOut, User, Server } from 'lucide-react';
import * as authService from '../services/authService';

interface AuthWidgetProps {
    onSyncComplete: () => void;
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ onSyncComplete }) => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('lt_user'));
    // Default to localhost, but allow user to change it (crucial for APK/Mobile)
    const [serverUrl, setServerUrl] = useState<string>(localStorage.getItem('lt_server_url') || 'http://localhost:3001');
    
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lt_last_sync'));

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Save server URL for future use
            localStorage.setItem('lt_server_url', serverUrl);
            
            const token = await authService.login(username, password, serverUrl);
            localStorage.setItem('lt_user', token); 
            setUser(token);
            setIsOpen(false);
            // Auto sync on login
            await handleSync(token, serverUrl);
        } catch (err) {
            setError('Could not connect. Check Server URL and credentials.');
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
        try {
            await authService.syncData(token, url);
            const now = new Date().toLocaleTimeString();
            localStorage.setItem('lt_last_sync', now);
            setLastSync(now);
            onSyncComplete();
        } catch (err) {
            alert(`Sync failed. Is the server running at ${url}?`);
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
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                        <h3 className="text-sm font-bold text-slate-800 mb-2">Sync Settings</h3>
                        <p className="text-xs text-slate-500 mb-3">
                            Connect to your self-hosted Docker container to backup data.
                        </p>
                        <form onSubmit={handleLogin} className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Server URL</label>
                                <div className="relative">
                                    <Server className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="w-full text-sm border-slate-300 rounded-md pl-8"
                                        placeholder="http://192.168.1.X:3001"
                                        value={serverUrl} onChange={e => setServerUrl(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    On Mobile? Use your PC's IP (e.g., 192.168.1.50), not localhost.
                                </p>
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
