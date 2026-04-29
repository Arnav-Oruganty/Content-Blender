import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { CbankProvider } from "./context/CbankContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <CbankProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontSize: "13px", borderRadius: "8px" },
          duration: 2500,
        }}
      />
    </CbankProvider>
  </BrowserRouter>
);
