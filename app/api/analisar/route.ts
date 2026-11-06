import { analisarPorRegras, montarResultado } from "@/lib/regras";
import { analisarDominios } from "@/lib/dominio";
import { analisarComIA } from "@/lib/ia";
import { permitido } from "@/lib/limite";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!permitido(ip)) {
    return Response.json(
      {
        erro: "Muitas análises seguidas. Tente de novo em 1 minuto.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const { texto } = await req.json();

  if (typeof texto !== "string" || texto.length === 0 || texto.length > 5000) {
    return Response.json({ erro: "Texto inválido" }, { status: 400 });
  }

  const base = analisarPorRegras(texto);
  const extras = await analisarDominios(texto);
  const sinais = [...base.sinais, ...extras];
  const parcial = montarResultado(sinais);

  if (parcial.score >= 90) {
    return Response.json({ ...parcial, iaUsada: false });
  }

  const ia = await analisarComIA(texto);
  if (!ia) {
    return Response.json({ ...parcial, Iansui: false });
  }

  const final = montarResultado(sinais, ia.risco);
  return Response.json({
    ...final,
    sinais: [...final.sinais, ...ia.sinais],
    iaUsada: true,
  });
}
