import React, { useEffect, useState } from "react";
import { LoginForm } from "./loginform";
import ScanPage from "./ScanPage";
import UserProfile from "./userprofile";


function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [data, setData] = useState(null)



  useEffect(() => {
    const fetchUserSessionData = async () => {
      const response = await fetch(`/authSync/session/validate`, {
        method: 'GET',
        credentials: "include"
      })

      const userData = await response.json()
      if (userData.status === 'success') {
        setData(userData);
        setIsLoggedIn(true);
      }
    }
    fetchUserSessionData();
  }, [])

  // const useSSE = (userId) => {
  //   useEffect(() => {
  //     const eventSource = new EventSource(`http://localhost:5000/events/${userId}`);

  //     eventSource.onmessage = (event) => {
  //       const data = JSON.parse(event.data);
  //       console.log("Received SSE event:", data);

  //       // If logout event is received, refresh the page (or redirect to login)
  //       if (data.action === "logout") {
  //         window.location.reload(); // Refresh to trigger API-based logout
  //       }
  //     };

  //     return () => eventSource.close();
  //   }, [userId]);
  // };

  // const userId = data.userData.userName
  //   useSSE(userId);

  const getLoginState = (state, data) => {


    setIsLoggedIn(state)
    setData(data)

  }

  const getLogoutState = (state) => {
    setIsLoggedIn(!state)

  }

  return (
    <div className="container">
      {isLoggedIn ? <UserProfile data={data} onSuccessfulLogout={getLogoutState} /> : <LoginForm onSuccessfulLogin={getLoginState} />}
      {!isLoggedIn && <ScanPage onSuccessfulLogin={getLoginState} />}

    </div>
  );
}

export default App;

{/* <HomePage data={data} /> */ }