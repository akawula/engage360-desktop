import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { syncService } from "./services/syncService";

// Initialize sync service
syncService.initialize().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
