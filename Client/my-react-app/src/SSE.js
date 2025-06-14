
import { useEffect } from "react";


// const useEmergencySSE = (userId, deviceId) => {
//     useEffect(() => {
//         if (!userId || !deviceId) return; // Ensure both exist

//         console.log("🔗 Connecting to SSE...");
//         const eventSource = new EventSource(`/authSync/events/${userId}?deviceId=${deviceId}`);

//         eventSource.onopen = () => {
//             console.log("✅ SSE connection established!");
//         };

//         eventSource.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             console.log("📩 Received SSE event:", data);

//             if (data.action === "logout") {
//                 console.log("🔴 Logout triggered. Reloading...");
//                 window.location.reload();
//             }
//         };

//         eventSource.onerror = (error) => {
//             console.error("⚠️ SSE Connection Error:", error);
//             eventSource.close();
//         };

//         return () => {
//             console.log("❌ Closing SSE connection...");
//             eventSource.close();
//         };
//     }, [userId, deviceId]); // re-run effect if either changes
// };



const SSE = (userId) => {

    try {
        console.log('inside SSE:', userId)
        // useEffect(() => {
        console.log('userId', userId)
        if (!userId) return; // Ensure userId exists

        console.log("🔗 Connecting to SSE...");
        const eventSource = new EventSource(`/authSync/events/${userId}`);

        eventSource.onopen = () => {
            console.log("✅ SSE connection established!");
        };

        eventSource.onmessage = (event) => {
            console.log("📩 Received SSE event:", event.data);
            const data = JSON.parse(event.data);
            console.log("📩 Received SSE event:", data);

            if (data.action === "logout") {
                console.log("🔴 Logout triggered. Reloading...");
                window.location.reload(); // Page refresh triggers API-based logout
            }
        };

        eventSource.onerror = (error) => {
            console.error("⚠️ SSE Connection Error:", error);
            eventSource.close();
        };

        return () => {
            console.log("❌ Closing SSE connection...");
            eventSource.close();
        };
        // }, []); // Reconnect if userId changes
    }
    catch (error) {
        console.log('error occure in SSE frontent: ', error.message)
    }

};

export default SSE;
