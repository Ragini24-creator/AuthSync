// hooks/useDeviceSSE.js
import { useEffect } from "react";

const useDeviceSSE = (userId, deviceId) => {
    useEffect(() => {
        if (!userId || !deviceId) return;

        const eventSource = new EventSource(`/authSync/device-events/${userId}/${deviceId}`);

        eventSource.onopen = () => {
            console.log(`📡 Connected to device-level SSE for ${deviceId}`);
        };



        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("🎯 Device-specific SSE event:", data);

            if (data.action === "logout") {
                console.log("🔒 Device-specific logout triggered.");
                window.location.reload();
            }
        };

        eventSource.onerror = (error) => {
            console.error("❌ Device-level SSE error", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [userId, deviceId]);
};

export default useDeviceSSE;
