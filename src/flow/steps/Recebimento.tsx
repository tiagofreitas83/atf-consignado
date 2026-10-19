import { Button, Icon, Input, Spinner } from "../../ds";
import type { DestinoPix, Proposta } from "../../api/types";
import { banco, horasUteisLabel, primeiroNome } from "../../lib/format";
import { detectarChave, ROTULO_CHAVE } from "../../lib/pix";
import { TUTORIAL_CRIAR_CHAVE, tutorialTrocarBanco, type Passo } from "../content";
import { Sheet } from "../Sheet";
import { ActionBar, FieldSlot, LinkRow, Opcao, StepColumn, StepHeading, TextButton, Tile } from "../ui";
import type { Flow, TutorialPix } from "../useConsignado";

const CHAVE_EXEMPLO = "mariana.lima@email.com";

const rotuloChave = (d: DestinoPix) => `Chave ${ROTULO_CHAVE[d.tipo].toLowerCase().replace("cpf", "CPF")}`;

function Passos({ passos }: { passos: Passo[] }) {
  return (
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
  );
}

/** Conta de destino verificada: banco + titular, para a pessoa conferir. */
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
          {rotuloChave(destino)}: {destino.chaveMascarada}
        </span>
        <span>Titular: {destino.titularMascarado}</span>
        <span className="text-pretty">É para esta conta que o valor do empréstimo vai.</span>
      </div>
    </Tile>
  );
}

const ABAS: { id: TutorialPix; rotulo: string }[] = [
  { id: "criar", rotulo: "Cadastrar chave nova" },
  { id: "trocar", rotulo: "Mudar chave de banco" },
];

/** Ajuda de chave Pix: cadastrar uma chave nova ou levar uma chave existente para outro banco. */
function AjudaChave({ aba, bancoAtual, onAba, onClose }: { aba: TutorialPix; bancoAtual: string; onAba: (aba: TutorialPix) => void; onClose: () => void }) {
  return (
    <Sheet title="Como preparar sua chave Pix" onClose={onClose}>
      <div role="tablist" aria-label="Tipo de ajuda" className="grid grid-cols-2 gap-1 rounded-full bg-neutral-95 p-1">
        {ABAS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`aba-${t.id}`}
            aria-selected={aba === t.id}
            aria-controls="aba-painel"
            onClick={() => onAba(t.id)}
            className={`min-h-10 rounded-full px-3 text-[13px] leading-tight font-semibold transition-colors ${
              aba === t.id ? "bg-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-neutral-40 [@media(hover:hover)]:hover:text-neutral-10"
            }`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="aba-painel" aria-labelledby={`aba-${aba}`} className="flex flex-col gap-5 pt-2">
        {aba === "criar" ? (
          <>
            <Tile tone="success" className="text-sm leading-normal text-success-10 text-pretty">
              <strong className="font-semibold">O caminho mais rápido.</strong> Leva menos de um minuto e não mexe nas chaves que você já tem.
            </Tile>
            <Passos passos={TUTORIAL_CRIAR_CHAVE} />
            <p className="m-0 text-sm leading-normal text-neutral-40 text-pretty">
              Depois, volte aqui, escolha <strong className="font-semibold text-neutral-10">Outro banco</strong> e informe a chave.
            </p>
          </>
        ) : (
          <>
            <Tile tone="amber" className="text-sm leading-normal text-pretty">
              <strong className="font-semibold">Depende da sua aprovação no banco atual.</strong> Com pressa? Cadastre uma chave nova no banco onde quer receber.
            </Tile>
            <Passos passos={tutorialTrocarBanco(bancoAtual)} />
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Campo único de chave Pix: reconhece celular, e-mail, chave aleatória (e CPF/CNPJ). A verificação acontece ao seguir. */
function OutraChave({ flow: { state: s, actions: a }, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const nome = primeiroNome(p.trabalhador.nome);
  const chave = detectarChave(s.chaveInput);
  const digitou = s.chaveInput.trim().length > 0;
  const formatoErro =
    digitou && !chave && s.chaveInput.trim().length >= 6
      ? "Não reconhecemos essa chave. Confira o celular com DDD, o e-mail ou a chave aleatória."
      : chave?.tipo === "cnpj"
        ? "Chave de CNPJ é de empresa. Use uma chave sua: celular, e-mail ou aleatória."
        : undefined;
  const apiErro: Partial<Record<string, string>> = {
    "outro-titular": `Essa chave não está no seu nome, ${nome}. Use uma chave Pix sua.`,
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
      ) : (
        s.chaveStatus === "ok" && s.chaveDestino && <DestinoOk destino={s.chaveDestino} titulo="Chave verificada" />
      )}
    </div>
  );
}

export function Recebimento({ flow, proposta: p }: { flow: Flow; proposta: Proposta }) {
  const { state: s, actions: a, derived: d } = flow;
  const nome = primeiroNome(p.trabalhador.nome);
  const reconsultar = () => a.consultarPix(p.id);
  const consultando = s.pixConsulta === "consultando";
  const bancoAtual = s.pixCpfDestino ? s.pixCpfDestino.instituicao.nome : "banco atual";
  const cpf = s.pixCpfDestino;

  return (
    <StepColumn label="Recebimento">
      <StepHeading title="Onde você quer receber?" lead="O valor vai por Pix, direto para uma conta no seu nome." />

      {/* Regra sempre visível: qualquer chave da pessoa vale, em qualquer banco. */}
      <Tile tone="subtle" className="flex items-start gap-3">
        <span className="flex shrink-0 pt-px" aria-hidden="true">
          <Icon name="pix" size={24} />
        </span>
        <div className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="font-semibold">Vale qualquer chave Pix sua, {nome}</span>
          <span className="leading-normal text-neutral-40 text-pretty">CPF, celular, e-mail ou chave aleatória, em qualquer banco. Só precisa ser sua.</span>
          <TextButton onClick={() => a.setTutorial("criar")}>Como cadastrar ou mudar uma chave</TextButton>
        </div>
      </Tile>

      <div aria-live="polite" className="flex flex-col gap-3">
        {consultando && (
          <Tile tone="subtle" className="flex items-center gap-3 text-sm text-neutral-40">
            <Spinner size="sm" label="Consultando" />
            <span>Procurando as suas chaves Pix…</span>
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

        {/* 1) Achamos a chave CPF: a pessoa escolhe entre esse banco e outro. */}
        {s.pixConsulta === "cpf" && cpf && (
          <>
            <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
              <legend className="mb-3 p-0 text-[15px] font-semibold">Escolha a conta</legend>
              <Opcao
                name="destino-pix"
                checked={!s.outraChave}
                onChange={() => a.setOutraChave(false)}
                titulo={banco(cpf.instituicao)}
                detalhe={
                  <>
                    Encontramos a sua chave CPF aqui.
                    <br />
                    Titular: {cpf.titularMascarado}
                  </>
                }
              />
              <Opcao
                name="destino-pix"
                checked={s.outraChave}
                onChange={() => a.setOutraChave(true)}
                titulo="Outro banco"
                detalhe="Use uma chave Pix sua de lá: celular, e-mail ou aleatória."
              />
            </fieldset>

            {s.outraChave && (
              <div className="flex flex-col gap-3 pt-2">
                <OutraChave flow={flow} proposta={p} />
                {/* Rotulado como tutorial: os links só explicam, não mudam nada na conta. */}
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-[13px] font-semibold tracking-[0.02em] text-neutral-40 uppercase">Tutorial</span>
                  <LinkRow>
                    <TextButton onClick={() => a.setTutorial("criar")}>Não tenho chave ainda</TextButton>
                    <TextButton onClick={() => a.setTutorial("trocar")}>Quero mudar a chave de banco</TextButton>
                  </LinkRow>
                </div>
              </div>
            )}
          </>
        )}

        {/* 2) O CPF não é chave, mas há outras chaves da pessoa. */}
        {s.pixConsulta === "outras-chaves" && (
          <>
            <Tile tone="amber" className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Encontramos chaves Pix suas, mas não a de CPF</span>
              <span className="leading-normal text-pretty">Sem problema: informe uma delas para conferirmos o banco.</span>
            </Tile>
            <OutraChave flow={flow} proposta={p} />
            <TextButton onClick={() => a.setTutorial("criar")}>Não lembro das minhas chaves</TextButton>
          </>
        )}

        {/* 3) Nenhuma chave: aviso + como criar, já aberto. */}
        {s.pixConsulta === "sem-chaves" && (
          <>
            <Tile tone="error" className="flex flex-col gap-1 text-sm text-error-10">
              <span className="font-semibold">Você ainda não tem chave Pix</span>
              <span className="leading-normal text-pretty">Crie uma no app do banco onde quer receber. Leva menos de um minuto.</span>
            </Tile>
            <div className="flex flex-col gap-4 rounded-card border border-neutral-90 p-[clamp(16px,4vw,24px)]">
              <span className="text-[15px] font-semibold">Como criar uma chave Pix</span>
              <Passos passos={TUTORIAL_CRIAR_CHAVE} />
            </div>
            <div className="flex">
              <Button variant="neutral" size="sm" className="w-full sm:w-auto" onClick={reconsultar}>
                Já criei, verificar de novo
              </Button>
            </div>
          </>
        )}
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
        <Button variant="brand" size="lg" rightIcon="arrowForward" fullWidth disabled={!d.podeSeguirRecebimento || s.chaveStatus === "validando"} onClick={() => a.seguirRecebimento(p.id)}>
          Seguir para assinatura
        </Button>
      </ActionBar>

      {s.tutorial && (
        <AjudaChave
          aba={s.tutorial}
          bancoAtual={bancoAtual}
          onAba={a.setTutorial}
          onClose={() => a.setTutorial(null)}
        />
      )}
    </StepColumn>
  );
}
