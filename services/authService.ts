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

// Type for Capacitor HTTP Response
interface HttpResponse {
    status: number;
    data: any;
    headers: Record<string, string>;
}

export const login = async (username: string, password: string, serverUrl: string): Promise<string> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const targetUrl = `${cleanUrl}/api/login`;
    const { isNative, CapacitorHttp } = await getCapacitor();

    try {
        if (isNative && CapacitorHttp) {
            console.log(`[Native HTTP] POST ${targetUrl}`);
            
            // Enhanced Capacitor HTTP configuration for better error handling
            const response = await CapacitorHttp.post({
                url: targetUrl,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: { username, password },
                responseType: 'json'
            });

            if (response.status < 200 || response.status >= 300) {
                const errorMsg = response.data?.error || `HTTP ${response.status}`;
                throw new Error(errorMsg);
            }
            
            if (!response.data?.token) {
                throw new Error('Invalid server response - no token received');
            }
            
            return response.data.token;
        } else {
            console.log(`[Web Fetch] POST ${targetUrl}`);
            // Implement fetch timeout using AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${res.status}`);
                }
                const data = await res.json();
                
                if (!data.token) {
                    throw new Error('Invalid server response - no token received');
                }
                
                return data.token;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }
    } catch (e: any) {
        console.error("Login Error Details:", e);
        
        // Enhanced error messages for common issues
        if (e.name === 'TimeoutError' || e.message?.includes('timeout')) {
            throw new Error('Connection timeout. Check server URL and network.');
        }
        
        if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
            throw new Error('Network error. Check if server is running and accessible.');
        }
        
        if (e.message?.includes('localhost') && isNative) {
            throw new Error('On mobile devices, use your computer\'s IP address instead of localhost.');
        }
        
        throw e;
    }
};

export const syncData = async (token: string, serverUrl: string): Promise<void> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const targetUrl = `${cleanUrl}/api/sync`;
    const { isNative, CapacitorHttp } = await getCapacitor();
    const localState = getFullState();

    try {
        if (isNative && CapacitorHttp) {
            console.log(`[Native HTTP] POST ${targetUrl}`);
            // Enhanced Capacitor HTTP configuration for sync
            const response = await CapacitorHttp.post({
                url: targetUrl,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'Accept': 'application/json'
                },
                data: localState,
                responseType: 'json'
            });

            if (response.status < 200 || response.status >= 300) {
                const errorMsg = response.data?.error || `HTTP ${response.status}`;
                throw new Error(errorMsg);
            }

            if (!response.data) {
                throw new Error('Invalid server response - no data received');
            }

            const serverState: FullState = response.data;
            restoreFullState(serverState);
        } else {
            console.log(`[Web Fetch] POST ${targetUrl}`);
            // Implement fetch timeout using AbortController
            const syncController = new AbortController();
            const syncTimeoutId = setTimeout(() => syncController.abort(), 15000);
            
            try {
                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': token,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(localState),
                    signal: syncController.signal
                });
                clearTimeout(syncTimeoutId);
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${res.status}`);
                }

                const serverState: FullState = await res.json();
                restoreFullState(serverState);
            } catch (fetchError) {
                clearTimeout(syncTimeoutId);
                throw fetchError;
            }
        }
    } catch (e: any) {
        console.error("Sync error:", e);
        
        // Enhanced error handling
        if (e.name === 'TimeoutError' || e.message?.includes('timeout')) {
            throw new Error('Sync timeout. Check network connection.');
        }
        
        if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
            throw new Error('Network error during sync.');
        }
        
        throw e;
    }
};