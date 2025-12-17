
import { FullState, restoreFullState, getFullState } from './storageService';

// We now accept the URL as a parameter, because on Mobile "localhost" is the phone, not the server.
export const login = async (username: string, password: string, serverUrl: string): Promise<string> => {
    // Remove trailing slash if present
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const apiUrl = `${cleanUrl}/api`;

    try {
        const res = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!res.ok) throw new Error('Login failed');
        
        const data = await res.json();
        return data.token;
    } catch (e) {
        throw e;
    }
};

export const syncData = async (token: string, serverUrl: string): Promise<void> => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    const apiUrl = `${cleanUrl}/api`;

    try {
        const localState = getFullState();
        
        const res = await fetch(`${apiUrl}/sync`, {
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
    } catch (e) {
        console.error("Sync error:", e);
        throw e;
    }
};
