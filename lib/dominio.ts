import type { Sinal } from "./tipos";

const REGEX_LINK = /(?:https??\/\/|www\.)[^\s)]+/gi;
const DIAS_SUSPEITOS = 30;

const SERVIDORES_RDAP: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  br: "https://rdap.registro.br/domain/",
};

async function diasDeVida(dominio: string): Promise<number | null> {
  const tld = dominio.split(".").pop() ?? "";
  const base = SERVIDORES_RDAP[tld] ?? "https://rdap.org/domain/";

  try {
    const res = await fetch(base + dominio, {
      headers: {
        Accept: "application/rdap+json",
        "User-Agent": "detector-vagas/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const dados = await res.json();
    const registro = dados.events?.find(
      (e: { eventAction: string }) => e.eventAction === "registration",
    );
    if (!registro) return null;

    const ms = Date.now() - new Date(registro.eventDate).getTime();
    return Math.floor(ms / 86_400_000);
  } catch {
    return null;
  }
}

export async function analisarDominios(texto: string): Promise<Sinal[]> {
  const sinais: Sinal[] = [];
  const links = [...texto.matchAll(REGEX_LINK)].slice(0, 3);

  for (const m of links) {
    let dominio: string;
    try {
      const link = m[0].startsWith("www.") ? `https://${m[0]}` : m[0];
      dominio = new URL(link).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    const dias = await diasDeVida(dominio);
    if (dias !== null && dias < DIAS_SUSPEITOS) {
      const inicio = m.index ?? 0;
      sinais.push({
        id: "diminio-novo",
        descricao: `Domínio ${dominio} criado há ${dias}dias`,
        gravidade: "alta",
        trecho: m[0],
        inicio,
        fim: inicio + m[0].length,
      });
    }
  }

  return sinais;
}
