import React from "react";
import ReactDOM from "react-dom/client";

const App = () => (
  <div>
    <h1>Plero + React + Electron</h1>
    <p>Hello from React!</p>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
