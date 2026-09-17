import { API_URL } from '../config';

export const fetchWeather = async () => {
    try {
        if (!API_URL) throw new Error("No backend API configured");
        
        const res = await fetch(`${API_URL}/api/weather/current`);
        if (!res.ok) throw new Error("Weather proxy fetch failed");
        
        const json = await res.json();
        if (json.success && json.data) {
            return json.data.sensors; // Return mapped sensors
        }
        
        return null;
    } catch (e) {
        console.warn("Backend weather proxy failed, falling back to mock data", e);
        return null;
    }
};
