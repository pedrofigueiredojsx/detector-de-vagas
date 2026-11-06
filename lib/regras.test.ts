import { describe, it, expect } from "vitest";
import { analisarPorRegras } from "./regras";

describe("analisarPorRegras", () => {
  it("dá o risco alto para o golpe clássico", () => {
    const texto =
      "Vaga URGENTE home office! Comente EU QUERO e envie currículo para vagas.rh2026@gmail.com. Taxa de inscrição R$ 30.";

    const resultado = analisarPorRegras(texto);

    expect(resultado.nivel).toBe("alto");
    expect(resultado.score).toBe(100);
  });

  it("dá o risco baixo para vaga normal", () => {
    const texto =
      "Estamos contratando dev front-end, veja requisitos no site da empresa.";

    const resultado = analisarPorRegras(texto);

    expect(resultado.nivel).toBe("baixo");
    expect(resultado.score).toBe(0);
  });
});
