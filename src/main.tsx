import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DeliveryProvider } from "./store/DeliveryContext";
import { CartProvider } from "./store/CartContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DeliveryProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </DeliveryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
