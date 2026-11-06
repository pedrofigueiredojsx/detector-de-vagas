import { ipcForbiddenHeaders } from "next/dist/server/lib/server-ipc/utils";

const JANELA_MS = 60_000;
const MAX_POR_JANELA = 5;
const acessos = new Map<string, number[]>();

export function permitido(ip: string): boolean {
  if (acessos.size > 5000) acessos.clear();

  const agora = Date.now();
  const recentes = (acessos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);

  if (recentes.length >= MAX_POR_JANELA) {
    acessos.set(ip, recentes);
    return false;
  }

  recentes.push(agora);
  acessos.set(ip, recentes);
  return true;
}
