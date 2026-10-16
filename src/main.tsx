import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { createMockApi } from "./api/mock";

const params = new URLSearchParams(window.location.search);
const api = createMockApi({
  // Simulação (equivale às props do protótipo): ?pix=sem-chave e ?horas=N
  pixResultado: params.get("pix") === "sem-chave" ? "sem-chave" : "cadastrado",
  horasUteis: Number(params.get("horas")) || 2,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App api={api} />
  </StrictMode>,
);
