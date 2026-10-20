import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createFerreteriaGateway } from "./adapters/outbound/ferreteriaGateway.js";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App createGateway={createFerreteriaGateway} /></React.StrictMode>,
);
