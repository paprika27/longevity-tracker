
import { FullState, restoreFullState, getFullState } from './storageService';

// Helper to dynamically load Capacitor core to prevent web build errors
// and allow native HTTP requests that bypass CORS/WebView restrictions.
const getCapacitor = async () => {
    try {
        const { Capacitor, CapacitorHttp } = await import('@capacitor/core');
        return { 
            isNative: Capacitor.isNativePlatform(), 
            CapacitorHttp 
        };
    } catch (e) {
        return { isNative: false, CapacitorHttp: null };
    }
};

export const checkConnection = async (serverUrl: string, forceWebFetch = false): Promise<{ ok: boolean; status: number; msg: string; mode: string }> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const { isNative, CapacitorHttp } = await getCapacitor();
    const mode = (isNative && CapacitorHttp && !forceWebFetch) ? 'Native HTTP' : 'Web Fetch';

    try {
        if (mode === 'Native HTTP') {
            const response = await CapacitorHttp.get({ 
                url: cleanUrl,
                connectTimeout: 5000,
                readTimeout: 5000
            });
            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                msg: response.status === 200 ? 'OK' : `Status ${response.status}`,
                mode
            };
        } else {
            // Web Fetch with Timeout
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            try {
                // Use redirect: 'manual' to detect 301/308 redirects from http->https
                const res = await fetch(cleanUrl, { 
                    method: 'GET', 
                    redirect: 'manual',
                    signal: controller.signal
                });
                clearTimeout(id);
                
                // Opaque responses (type: 'opaqueredirect') have status 0 or similar in some envs
                if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
                     return { ok: false, status: res.status || 308, msg: 'Redirect Detected', mode };
                }

                return {
                    ok: res.ok,
                    status: res.status,
                    msg: res.statusText,
                    mode
                };
            } catch (fetchErr: any) {
                clearTimeout(id);
                if (fetchErr.name === 'AbortError') {
                    return { ok: false, status: 408, msg: 'Timeout - Server Unreachable', mode };
                }
                throw fetchErr;
            }
        }
    } catch (e: any) {
        return { ok: false, status: 0, msg: e.message || 'Network Error', mode };
    }
};

export const login = async (username: string, password: string, serverUrl: string, forceWebFetch = false): Promise<string> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const targetUrl = `${cleanUrl}/api/login`;
    const { isNative, CapacitorHttp } = await getCapacitor();

    try {
        if (isNative && CapacitorHttp && !forceWebFetch) {
            console.log(`[Native HTTP] POST ${targetUrl}`);
            const response = await CapacitorHttp.post({
                url: targetUrl,
                headers: { 'Content-Type': 'application/json' },
                data: { username, password }
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.data.error || `Native Error: ${response.status}`);
            }
            return response.data.token;
        } else {
            console.log(`[Web Fetch] POST ${targetUrl}`);
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            return data.token;
        }
    } catch (e: any) {
        console.error("Login Error Details:", e);
        throw e;
    }
};

export const syncData = async (token: string, serverUrl: string, forceWebFetch = false): Promise<void> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const targetUrl = `${cleanUrl}/api/sync`;
    const { isNative, CapacitorHttp } = await getCapacitor();
    const localState = getFullState();

    try {
        if (isNative && CapacitorHttp && !forceWebFetch) {
            console.log(`[Native HTTP] POST ${targetUrl}`);
            const response = await CapacitorHttp.post({
                url: targetUrl,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                data: localState // Native expects object
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.data.error || `Native Error: ${response.status}`);
            }

            const serverState: FullState = response.data;
            restoreFullState(serverState);
        } else {
            console.log(`[Web Fetch] POST ${targetUrl}`);
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(localState)
            });

            if (!res.ok) throw new Error('Sync failed');

            const serverState: FullState = await res.json();
            restoreFullState(serverState);
        }
    } catch (e) {
        console.error("Sync error:", e);
        throw e;
    }
};
