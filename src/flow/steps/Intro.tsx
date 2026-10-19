import { Button, Checkbox, Icon, Input } from "../../ds";
import { FieldSlot, Tile } from "../ui";
import type { Flow } from "../useConsignado";

const CPF_EXEMPLO = "123.456.789-09";

const FATOS = [
  ["513", "Código da instituição no sistema financeiro"],
  ["Bacen", "Autorizada e supervisionada pelo Banco Central"],
  ["Pix", "Dinheiro direto na sua conta, por uma chave Pix sua"],
] as const;

export function Intro({ flow: { state: s, actions: a, derived: d } }: { flow: Flow }) {
  const bloqueado = s.cpfBloqueado;
  const podeSeguir = s.consent && (Boolean(s.proposta) || d.cpfInputOk) && !s.cpfVerificando && !bloqueado;
  const seguir = () => podeSeguir && a.seguirIntro();

  return (
    <section aria-label="Boas-vindas" className="flex flex-col gap-[clamp(32px,6vw,48px)] pt-[clamp(0px,3vw,32px)] animate-cp-fade">
      <div className="flex max-w-[880px] flex-col gap-6">
        <h1 className="m-0 text-[clamp(34px,9vw,84px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Consignado privado, direto do seu salário para a sua conta.
        </h1>
        <p className="m-0 max-w-[620px] text-[clamp(16px,3.6vw,20px)] leading-normal text-neutral-40 text-pretty">
          A ATF SCD S.A. é uma Sociedade de Crédito Direto autorizada e regulada pelo Banco Central do Brasil. Você contrata em poucos minutos e a
          parcela é descontada em folha.
        </p>
      </div>

      <dl className="m-0 grid max-w-[880px] grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-5 border-t border-neutral-90 pt-6">
        {FATOS.map(([valor, legenda]) => (
          <div key={valor} className="flex flex-col-reverse gap-1">
            <dd className="m-0 text-sm text-neutral-40">{legenda}</dd>
            <dt className="text-[32px] font-semibold tracking-[-0.02em]">{valor}</dt>
          </div>
        ))}
      </dl>

      <div className="flex max-w-[880px] flex-col gap-6">
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal text-pretty">
          <Checkbox checked={s.consent} onChange={a.setConsent} />
          <span>
            Li e aceito o{" "}
            <button type="button" className="atf-link" onClick={() => a.openDoc("termos")}>
              Termo de consentimento
            </button>{" "}
            e a{" "}
            <button type="button" className="atf-link" onClick={() => a.openDoc("privacidade")}>
              Política de privacidade
            </button>
            , incluindo a consulta dos meus dados de vínculo empregatício.
          </span>
        </label>

        {/* O CPF abre o link: sem ele, nome, empresa e valores não chegam ao front. */}
        {s.consent &&
          (bloqueado ? (
            <Tile tone="error" className="flex max-w-[560px] flex-col gap-1 text-sm text-error-10 animate-cp-fade">
              <span className="font-semibold" role="alert">
                Bloqueamos este link por segurança
              </span>
              <span className="leading-normal text-pretty">O CPF não conferiu depois de várias tentativas. Peça um novo link ao RH da sua empresa ou fale com a ATF.</span>
            </Tile>
          ) : (
            <form
              className="flex max-w-[360px] flex-col gap-3 animate-cp-fade"
              onSubmit={(e) => {
                e.preventDefault();
                seguir();
              }}
            >
              <FieldSlot>
                <Input
                  label="Seu CPF"
                  value={s.cpfInput}
                  onChange={a.setCpfInput}
                  mask="cpf"
                  placeholder="000.000.000-00"
                  errors={d.cpfInputErro ?? s.cpfErroApi ?? undefined}
                  disabled={s.cpfVerificando || Boolean(s.proposta)}
                  autoComplete="off"
                  autoFocus={!s.proposta}
                />
              </FieldSlot>
              {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
              {!s.proposta && (
                <p className="m-0 text-[13px] leading-normal text-neutral-40">
                  CPF de exemplo para testar: {CPF_EXEMPLO}.{" "}
                  <button type="button" className="atf-link font-semibold" onClick={() => a.setCpfInput(CPF_EXEMPLO)} disabled={s.cpfVerificando}>
                    Preencher
                  </button>
                </p>
              )}
              <div className="flex items-start gap-2 text-[13px] leading-normal text-neutral-40">
                <span className="flex shrink-0" aria-hidden="true">
                  <Icon name="shieldPerson" size={18} />
                </span>
                <span className="text-pretty">O link é pessoal e só abre com o seu CPF.</span>
              </div>
              <Button type="submit" variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled={!podeSeguir} className="mt-3">
                {s.cpfVerificando ? "Verificando…" : "Seguir"}
              </Button>
            </form>
          ))}

        {!s.consent && (
          <div className="flex max-w-[360px]">
            <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled>
              Seguir
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
