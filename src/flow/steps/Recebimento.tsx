import { Button, Icon, Input, Spinner } from "../../ds";
import type { DestinoPix, Proposta } from "../../api/types";
import { formatCpf } from "../../lib/cpf";
import { banco, horasUteisLabel, primeiroNome } from "../../lib/format";
import { detectarChave, ROTULO_CHAVE } from "../../lib/pix";
import { TUTORIAL_CRIAR_CHAVE, tutorialTrocarBanco, type Passo } from "../content";
import { ActionBar, FieldSlot, StepColumn, StepHeading, TextButton, Tile } from "../ui";
import type { Flow } from "../useConsignado";

const CHAVE_EXEMPLO = "mariana.lima@email.com";

function Tutorial({ passos, titulo }: { passos: Passo[]; titulo: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-neutral-90 p-[clamp(16px,4vw,24px)]">
      <span className="text-[15px] font-semibold">{titulo}</span>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {passos.map((t, i) => (
          <li key={t.title} className="flex items-start gap-4">
            <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1 pt-[3px]">
              <span className="text-[15px] font-semibold">{t.title}</span>
              <span className="text-sm leading-normal text-neutral-40 text-pretty">{t.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Conta de destino encontrada: banco + titular, para a pessoa conferir. */
function DestinoOk({ destino, titulo }: { destino: DestinoPix; titulo: string }) {
  return (
    <Tile tone="success" className="flex items-start gap-3">
      <span className="flex shrink-0 text-success-40">
        <Icon name="check" size={24} />
      </span>
      <div className="flex min-w-0 flex-col gap-1 text-sm text-success-10">
        <span className="font-semibold">{titulo}</span>
        <span className="text-[15px] font-semibold [overflow-wrap:anywhere]">{banco(destino.instituicao)}</span>
        <span className="[overflow-wrap:anywhere]">
          Chave {ROTULO_CHAVE[destino.tipo].toLowerCase().replace("cpf", "CPF")}: {destino.chaveMascarada}
        </span>
        <span>Titular: {destino.titularMascarado}</span>
        <span className="text-pretty">É para esta conta que o valor do empréstimo vai.</span>
      </div>
    </Tile>
  );
}

/** Campo único de chave Pix: reconhece celular, e-mail, chave aleatória (e CPF/CNPJ). */
function OutraChave({ flow: { state: s, actions: a }, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const chave = detectarChave(s.chaveInput);
  const digitou = s.chaveInput.trim().length > 0;
  const formatoErro =
    digitou && !chave && s.chaveInput.trim().length >= 6
      ? "Não reconhecemos essa chave. Confira o celular com DDD, o e-mail ou a chave aleatória."
      : chave?.tipo === "cnpj"
        ? "A chave precisa estar no seu CPF. Chaves de CNPJ não são aceitas."
        : undefined;
  const apiErro: Partial<Record<string, string>> = {
    "outro-titular": `Essa chave não está no CPF de ${primeiroNome(p.trabalhador.nome)}. Só aceitamos chave Pix do próprio trabalhador.`,
    "nao-encontrada": "Não encontramos essa chave no Pix. Confira e tente de novo.",
    erro: "Não foi possível verificar agora. Tente novamente.",
  };
  const erro = formatoErro ?? apiErro[s.chaveStatus];
  const validando = s.chaveStatus === "validando";

  return (
    <div className="flex flex-col gap-3">
      <FieldSlot>
        <Input
          label="Chave Pix"
          value={s.chaveInput}
          onChange={a.setChave}
          placeholder="Celular, e-mail ou chave aleatória"
          leftIcon="pix"
          errors={erro}
          description={chave && !erro ? `Identificamos: ${ROTULO_CHAVE[chave.tipo]} · ${chave.exibicao}` : undefined}
          disabled={validando}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </FieldSlot>
      {/* TEMPORÁRIO (demonstração): remover antes de produção. */}
      <p className="m-0 text-[13px] leading-normal text-neutral-40">
        Chave de exemplo para testar: {CHAVE_EXEMPLO}.{" "}
        <button type="button" className="atf-link font-semibold" onClick={() => a.setChave(CHAVE_EXEMPLO)} disabled={validando}>
          Preencher
        </button>
      </p>
      {validando ? (
        <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
          <Spinner size="sm" label="Verificando" />
          <span>Verificando a chave no diretório Pix…</span>
        </Tile>
      ) : s.chaveStatus === "ok" && s.chaveDestino ? (
        <DestinoOk destino={s.chaveDestino} titulo="Chave verificada" />
      ) : (
        <div className="flex">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            disabled={!chave || chave.tipo === "cnpj"}
            onClick={() => a.validarChave(p.id)}
          >
            Verificar chave
          </Button>
        </div>
      )}
    </div>
  );
}

export function Recebimento({ flow, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const { state: s, actions: a, derived: d } = flow;
  const reconsultar = () => a.consultarPix(p.id);
  const consultando = s.pixConsulta === "consultando";
  const bancoAtual = s.pixCpfDestino ? s.pixCpfDestino.instituicao.nome : "banco atual";

  return (
    <StepColumn label="Recebimento">
      <StepHeading
        title="Onde você quer receber?"
        lead="O valor vai por Pix para uma conta no seu nome. Procuramos as chaves Pix do seu CPF para você conferir o banco."
      />

      <div className="flex flex-col gap-3">
        <FieldSlot>
          <Input
            label="CPF do titular"
            value={formatCpf(p.trabalhador.cpf)}
            onChange={() => {}}
            readOnly
            leftIcon="pix"
            className="atf-field--readonly"
            description="O CPF confirmado no início. Só aceitamos chave Pix deste CPF."
          />
        </FieldSlot>

        <div aria-live="polite" className="flex flex-col gap-3">
          {consultando && (
            <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
              <Spinner size="sm" label="Consultando" />
              <span>Procurando as chaves Pix do seu CPF…</span>
            </Tile>
          )}

          {s.pixConsulta === "erro" && (
            <Tile tone="error" className="flex flex-col items-start gap-3 text-sm text-error-10">
              <span role="alert">Não conseguimos consultar o Pix agora.</span>
              <Button variant="neutral" size="sm" onClick={reconsultar}>
                Tentar novamente
              </Button>
            </Tile>
          )}

          {/* 1) O CPF é chave Pix: mostra o banco e permite trocar. */}
          {s.pixConsulta === "cpf" && s.pixCpfDestino && !s.outraChave && (
            <>
              <DestinoOk destino={s.pixCpfDestino} titulo="Encontramos a chave Pix do seu CPF" />
              <TextButton onClick={() => a.setTutorial(s.tutorial === "trocar" ? null : "trocar")}>
                {s.tutorial === "trocar" ? "Manter neste banco" : "Quero receber em outro banco"}
              </TextButton>
              {s.tutorial === "trocar" && (
                <div className="flex flex-col gap-3">
                  <Tutorial passos={tutorialTrocarBanco(bancoAtual)} titulo="Leve a chave CPF para o outro banco" />
                  <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-x-6">
                    <Button variant="neutral" size="sm" onClick={reconsultar}>
                      Já movi, verificar de novo
                    </Button>
                    <TextButton onClick={() => a.setOutraChave(true)}>Ou usar outra chave minha</TextButton>
                  </div>
                </div>
              )}
            </>
          )}

          {s.pixConsulta === "cpf" && s.outraChave && (
            <>
              <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
                Informe outra chave Pix sua, no banco onde quer receber. Ela precisa estar no seu CPF.
              </p>
              <OutraChave flow={flow} proposta={p} />
              <TextButton onClick={() => a.setOutraChave(false)}>Voltar para a chave CPF</TextButton>
            </>
          )}

          {/* 2) O CPF não é chave, mas há outras chaves no CPF. */}
          {s.pixConsulta === "outras-chaves" && (
            <>
              <Tile tone="amber" className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">O seu CPF ainda não é uma chave Pix</span>
                <span className="leading-normal text-pretty">
                  Mas você tem outras chaves no seu CPF. Informe uma delas — celular, e-mail ou chave aleatória — para conferirmos o banco.
                </span>
              </Tile>
              <OutraChave flow={flow} proposta={p} />
            </>
          )}

          {/* 3) Nenhuma chave no CPF: aviso + como criar. */}
          {s.pixConsulta === "sem-chaves" && (
            <>
              <Tile tone="error" className="flex flex-col gap-1 text-sm text-error-10">
                <span className="font-semibold">Não encontramos nenhuma chave Pix no seu CPF</span>
                <span className="leading-normal text-pretty">
                  Para receber o empréstimo, crie uma chave Pix no app do seu banco, numa conta no seu nome. Leva menos de um minuto.
                </span>
              </Tile>
              <Tutorial passos={TUTORIAL_CRIAR_CHAVE} titulo="Como criar uma chave Pix" />
              <div className="flex">
                <Button variant="neutral" size="sm" className="w-full sm:w-auto" onClick={reconsultar}>
                  Já criei, verificar de novo
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Tile tone="amber" className="flex items-center gap-3">
        <span className="flex shrink-0">
          <Icon name="scheduleBold" size={24} />
        </span>
        <span className="text-sm leading-normal text-pretty">
          Pagamento estimado em até <strong className="font-semibold">{horasUteisLabel(p.horasUteisPagamento)}</strong> após a assinatura da CCB.
        </span>
      </Tile>

      <ActionBar
        back={
          <Button variant="text" size="md" onClick={a.back}>
            Voltar
          </Button>
        }
      >
        <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled={!d.recebimentoOk} onClick={() => a.next()}>
          Seguir para assinatura
        </Button>
      </ActionBar>
    </StepColumn>
  );
}
