import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { createMockApi, type CenarioPix } from "./api/mock";
import { lerToken } from "./lib/token";

const params = new URLSearchParams(window.location.search);
const CENARIOS: CenarioPix[] = ["cpf", "outras-chaves", "sem-chaves"];
const pix = params.get("pix") as CenarioPix | null;
const api = createMockApi({
  // Simulação: ?pix=cpf | outras-chaves | sem-chaves e ?horas=N
  pix: pix && CENARIOS.includes(pix) ? pix : "cpf",
  horasUteis: Number(params.get("horas")) || 2,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App api={api} token={lerToken(window.location, import.meta.env.BASE_URL)} />
  </StrictMode>,
);
