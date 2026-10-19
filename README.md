# ATF Consignado Privado

Jornada de contratação de crédito consignado privado da ATF SCD S.A. (instituição 513), em 5 passos:
boas-vindas (consentimento + CPF) → proposta → recebimento (Pix) → assinatura da CCB → protocolo.

> **Escopo deste pacote: só o front-end.** Não há back-end implementado. Todas as chamadas passam pela
> interface `ConsignadoApi` (`src/api/types.ts`), que é o contrato que o back-end precisa cumprir; hoje ela
> é atendida por `src/api/mock.ts`, com dados fictícios e latência simulada. Para produção, implemente um
> `ConsignadoApi` HTTP e injete em `src/main.tsx`.

**Link pessoal:** `www.atf.com.br/consignado/<token>`. O token é opaco (CPF cifrado no servidor) e só é
repassado à API. Na primeira página, depois do aceite do termo, aparece o campo do CPF; "Seguir" registra
o consentimento (`POST /consentimentos`) e confere o CPF com o token (`POST /proposta/verificar`). Só com o
CPF certo a proposta (nome, empresa, valores) chega ao front; 3 erros bloqueiam o link. A decifragem do
token e a comparação com o CPF são responsabilidade do back-end; o front nunca interpreta o token.

**Recebimento:** consulta automática das chaves Pix da pessoa (`POST /pix/consultar`).
- Se o CPF é chave: dois cartões de escolha, o banco encontrado (já marcado) ou "Outro banco".
- Em "Outro banco" (ou quando o CPF não é chave, mas há outras): campo único que reconhece celular,
  e-mail ou chave aleatória. A chave é verificada sozinha 0,5 s depois que a pessoa para de digitar
  (`POST /pix/validar`) e o banco de destino aparece logo abaixo; "Seguir para assinatura" também
  verifica, e um erro fica no campo. Abaixo do campo, o bloco "Vale qualquer chave Pix sua, <nome>" com
  os tutoriais "Não tenho chave ainda" e "Quero mudar a chave de banco" (folha com duas abas).
- Se não há nenhuma chave: aviso + tutorial de criação e "Já criei, verificar de novo".
- Só é aceita chave Pix da própria pessoa; os textos não falam em "vinculada ao CPF".

A assinatura tem 5 etapas em sequência: revisar e aceitar a CCB → confirmar o e-mail (código) →
confirmar o celular (código por SMS) → apresentar o documento com foto (CNH ou RG; enviado como PDF
da carteira digital ou digitalizado com a câmera, frente e verso) → reconhecimento facial com prova de vida (oval no estilo FaceTec ZoOm). E-mail e
celular vêm pré-preenchidos da proposta e são conferidos/editados dentro da própria etapa, antes do código.
O reenvio do código (e-mail ou SMS) só libera 30 s depois de cada envio, com contador (`REENVIO_SEGUNDOS`).

Responsividade: de 320px ao desktop, incluindo celular em paisagem. Safe-area (notch/barra de gestos),
`dvh`, hover só em dispositivos com mouse, alvos de toque ≥ 44px, modal como folha inferior no celular.

Link público: https://tiagofreitas83.github.io/atf-consignado/

React 19 + Vite + TypeScript + Tailwind 4. A especificação de design está em [`HANDOFF.md`](HANDOFF.md).

```bash
npm install   # depois: mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
npm run dev   # http://localhost:5173
npm test
npm run build
```

Simulação no mock: `?pix=cpf` (padrão), `?pix=outras-chaves` ou `?pix=sem-chaves`, e `?horas=N`.
CPF de teste: 123.456.789-09. Chaves do titular: `mariana.lima@email.com`, `(11) 98765-4321` ou
qualquer chave aleatória.
Código `000000` (e-mail ou SMS) simula código inválido. Sem câmera, a captura facial oferece
"Simular sem câmera". Os atalhos "Preencher"/"usar documento de exemplo" são temporários.

## Estrutura

- `src/ds/` — port dos componentes do ATF Design System usados aqui (Button, IconButton, Input,
  Checkbox, Spinner, Icon e máscaras), fiel ao `_ds_bundle.js` do handoff. Quando o DS virar pacote,
  troque os imports de `./ds` por ele.
- `src/api/types.ts` — contrato com o back-end (`POST /consentimentos`, `POST /proposta/verificar`, `POST /pix/consultar`,
  `POST /pix/validar`, `POST /assinatura/codigo` e `/confirmar`, `POST /assinatura/documento`,
  `POST /assinatura/biometria`, `POST /ccb/assinar`). `src/api/mock.ts` implementa com dados fictícios.
  Para produção, crie um `ConsignadoApi` HTTP e injete em `src/main.tsx`.
- `src/flow/useConsignado.ts` — estado da jornada, gates de cada passo e espelho do passo na URL
  (`?step=N`; acesso direto ou voltar do navegador nunca pula pré-requisitos).
- `src/flow/steps/` — as cinco telas; `steps/assinatura/` — as etapas da assinatura e a captura facial
  (`FaceCapture.tsx`: a liveness é simulada por tempo; em produção, o SDK do fornecedor de biometria
  conduz a captura e o back-end compara com a foto do documento). `Sheet.tsx` — folha inferior/modal; `DocModal.tsx` — Termo de consentimento e Política de Privacidade e LGPD
  (um único documento; textos provisórios em `content.ts`, a substituir pelos do jurídico).

## Diferenças em relação ao protótipo

- Parcela/total seguem o README do handoff (R$ 308,34 / R$ 11.100,24, PMT truncado). O protótipo
  arredondava para R$ 308,35 / R$ 11.100,42. Em produção o valor vem da API.
- Helper/erro do Input ancorado pelo topo: no DS (`bottom:-20px`) um texto de 2 linhas sobrepõe o campo no celular.
- Links "Termo"/"Política"/"Termos"/"Privacidade" são `<button>` com estilo de link (dentro do `<label>`
  do aceite não marcam o checkbox). Modal fecha com Esc e devolve o foco.
- A assinatura deixou de ser um OTP único: virou checklist de 5 etapas (CCB, e-mail, SMS, documento, facial).
- Código inválido e falha ao carregar a proposta têm mensagem de erro (não existiam no protótipo).
- "Reiniciar demonstração" não foi implementado (só existia no protótipo).
- O CPF foi para a primeira página (antes era uma tela própria "Confirme o seu CPF"), para que nada da
  proposta apareça só com o link.
- Recebimento sem botões "Verificar": a chave é conferida ao digitar e ao seguir.

## Pendências de produto

- Textos de Termos, Privacidade e cláusulas da CCB são provisórios (jurídico).
- "Ler documento completo", "Ver CCB assinada" e "Acompanhar protocolo" ainda sem destino.
