"use client";
import { useState } from "react";
import type { Sinal } from "@/lib/tipos";
import { segmentar } from "@/lib/grifar";
import styles from "./page.module.css";

type Nivel = "baixo" | "medio" | "alto";
type Resultado = {
  score: number;
  nivel: Nivel;
  sinais: Sinal[];
  iaUsada?: boolean;
};

const ROTULO: Record<Nivel, string> = {
  baixo: "Risco baixo",
  medio: "Risco médio",
  alto: "Risco alto",
};

const MARCA: Record<Sinal["gravidade"], string> = {
  alta: styles.marcaAlta,
  media: styles.marcaMedia,
  baixa: styles.marcaBaixa,
};

const CARTAO_SINAL: Record<Sinal["gravidade"], string> = {
  alta: styles.sinalAlta,
  media: styles.sinalMedia,
  baixa: styles.sinalBaixa,
};

const EXEMPLOS = [
  {
    rotulo: "Golpe clássico",
    texto:
      "Vaga URGENTE home office! Comente EU QUERO e envie currículo para vagas.rh2026@gmail.com. Taxa de inscrição R$ 30.",
  },
  {
    rotulo: "Golpe sutil (só a IA pega)",
    texto:
      "Estamos expandindo e precisamos de 50 pessoas para atendimento remoto. Pagamos R$ 12 mil por mês, com carga horária de 3 horas por dia. Não precisa de currículo nem entrevista: basta confirmar interesse nos comentários que nossa consultora entra em contato com você.",
  },
  {
    rotulo: "Vaga normal",
    texto:
      "Estamos contratando uma pessoa desenvolvedora front-end pleno para o time de produto. Requisitos: React, TypeScript e testes. Processo: triagem, teste técnico e duas entrevistas. Candidate-se pelo site de carreiras da empresa.",
  },
];

export default function Home() {
  const [texto, setTexto] = useState("");
  const [analisado, setAnalisado] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function analisar() {
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });

      if (!res.ok) {
        setResultado(null);
        setErro(
          res.status === 429
            ? "Muitas análises seguidas. Espere 1 minuto."
            : "Não foi possível analisar o texto.",
        );
        return;
      }

      const dados = await res.json();
      setAnalisado(texto);
      setResultado(dados);
    } catch {
      setResultado(null);
      setErro("Não foi possível analisar o texto.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <span className={styles.selo}>Detector de vaga falsa</span>
        <h1>Esse post de vaga é confiável?</h1>
        <p>
          Cole o texto e veja os indícios de golpe ou isca de engajamento, com
          os trechos suspeitos marcados.
        </p>
      </header>

      <section className={styles.cartao}>
        <div className={styles.exemplos}>
          <span>Testar com:</span>
          {EXEMPLOS.map((e) => (
            <button
              key={e.rotulo}
              type="button"
              className={styles.chip}
              onClick={() => setTexto(e.texto)}
            >
              {e.rotulo}
            </button>
          ))}
        </div>

        <textarea
          className={styles.campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole o post aqui"
          maxLength={5000}
        />

        <div className={styles.rodape}>
          <span className={styles.contador}>{texto.length}/5000</span>
          <button
            className={styles.botao}
            onClick={analisar}
            disabled={carregando || texto.trim().length === 0}
          >
            {carregando ? "Analisando..." : "Analisar post"}
          </button>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}

        <p className={styles.aviso}>
          Se a análise com IA for usada, o texto é enviado a um serviço externo
          (Groq). Não cole dados pessoais.
        </p>
      </section>

      {resultado && resultado.sinais && (
        <section
          className={`${styles.cartao} ${styles.resultado} ${styles[resultado.nivel]}`}
        >
          <div className={styles.placar}>
            <span className={styles.nota}>
              {resultado.score}
              <small>/100</small>
            </span>
            <span className={styles.rotulo}>{ROTULO[resultado.nivel]}</span>
            {resultado.iaUsada && (
              <span className={styles.badgeIa}>com IA</span>
            )}
          </div>

          <div className={styles.barra}>
            <div
              className={styles.preenchimento}
              style={{ width: `${resultado.score}%` }}
            />
          </div>

          <h2 className={styles.titulo}>Post analisado</h2>
          <p className={styles.post}>
            {segmentar(analisado, resultado.sinais).map((p, i) =>
              p.gravidade ? (
                <mark key={i} className={MARCA[p.gravidade]}>
                  {p.texto}
                </mark>
              ) : (
                <span key={i}>{p.texto}</span>
              ),
            )}
          </p>

          <h2 className={styles.titulo}>Indícios encontrados</h2>
          {resultado.sinais.length === 0 ? (
            <p className={styles.vazio}>
              Nenhum indício encontrado. Isso não garante que a vaga é segura.
            </p>
          ) : (
            <ul className={styles.sinais}>
              {resultado.sinais.map((s) => (
                <li
                  key={`${s.id}-${s.inicio}`}
                  className={`${styles.sinal} ${CARTAO_SINAL[s.gravidade]}`}
                >
                  <div>{s.descricao}</div>
                  <div className={styles.trecho}>&ldquo;{s.trecho}&rdquo;</div>
                </li>
              ))}
            </ul>
          )}

          <p className={styles.notaFinal}>
            O resultado aponta indícios no texto, não é uma acusação contra
            ninguém.
          </p>
        </section>
      )}
    </main>
  );
}
