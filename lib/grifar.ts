import { projectUpdateInfoSubscribe } from "next/dist/build/swc/generated-native";
import type { Gravidade, Sinal } from "./tipos";

export type Pedaco = { texto: string; gravidade?: Gravidade };

export function segmentar(texto: string, sinais: Sinal[]): Pedaco[] {
  const ordenados = [...sinais].sort((a, b) => a.inicio - b.inicio);
  const pedacos: Pedaco[] = [];
  let cursor = 0;

  for (const s of ordenados) {
    if (s.inicio < cursor) continue;
    if (s.inicio > cursor) {
      pedacos.push({ texto: texto.slice(cursor, s.inicio) });
    }
    pedacos.push({
      texto: texto.slice(s.inicio, s.fim),
      gravidade: s.gravidade,
    });
    cursor = s.fim;
  }

  if (cursor < texto.length) {
    pedacos.push({ texto: texto.slice(cursor) });
  }

  return pedacos;
}
