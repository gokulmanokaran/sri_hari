import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DeliveryProvider } from "./store/DeliveryContext";
import { CartProvider } from "./store/CartContext";
import { ProductProvider } from "./store/ProductContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DeliveryProvider>
        <ProductProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ProductProvider>
      </DeliveryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
