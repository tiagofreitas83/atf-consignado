/** Token de demonstração quando o link não traz um (abrir a raiz do site). */
export const TOKEN_DEMO = "demo";

/**
 * Lê o token opaco do link `…/consignado/<token>` (ou, alternativamente,
 * `?t=<token>`). O front não interpreta o token — só o repassa à API.
 */
export function lerToken(location: Pick<Location, "pathname" | "search">, base: string): string {
  const resto = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname;
  const segmentos = resto.split("/").filter(Boolean);
  if (segmentos[0] === "consignado") segmentos.shift();
  const doCaminho = segmentos[0];
  const daQuery = new URLSearchParams(location.search).get("t");
  return decodeURIComponent(doCaminho || daQuery || TOKEN_DEMO);
}
