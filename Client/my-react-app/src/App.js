import React, { useState } from "react";
import LoginForm from "./loginform";
import HomePage from './home';
import ScanPage from "./ScanPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [data, setData] = useState(null)

  const getLoginState = (state, data) => {
    setIsLoggedIn(state)
    setData(data)
  }

  return (
    <div className="container">
      {isLoggedIn ? <HomePage data={data} /> : <LoginForm onSuccessfulLogin={getLoginState} />}
      {!isLoggedIn && <ScanPage onSuccessfulLogin={getLoginState} />}
    </div>
  );
}

export default App;