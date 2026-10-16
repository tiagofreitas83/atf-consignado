# Handoff: Contratação de Consignado Privado (ATF SCD S.A.)

## Overview
Jornada wizard de 5 passos, tela única (sem sidebar), para o trabalhador do setor privado contratar crédito consignado com a **ATF SCD S.A.** (Sociedade de Crédito Direto, instituição **513**, autorizada pelo Banco Central). Fluxo: boas-vindas/consentimento → confirmação da proposta → dados de recebimento (Pix CPF) → assinatura da CCB → conclusão com protocolo.

## About the Design Files
Os arquivos deste pacote são **referências de design criadas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estas telas no ambiente do codebase alvo** (React, Next, React Native etc.) usando os padrões e bibliotecas já existentes. Se ainda não houver ambiente, recomenda-se React + TypeScript, consumindo o ATF Design System (o mesmo que o Internet Banking usa: React 19 + Vite + Tailwind 4).

Para abrir o protótipo: sirva a pasta por HTTP (`npx serve .`) e abra `Consignado Privado.dc.html`. O arquivo é um "Design Component": template HTML com holes `{{ }}` + uma classe JS (`class Component`) no `<script data-dc-script>` no fim do arquivo — toda a lógica e os dados mock estão lá.

## Fidelity
**High-fidelity.** Cores, tipografia, espaçamentos, copy, estados e animações são finais. Recriar pixel-perfect usando os componentes do ATF Design System (`Button`, `Input`, `Checkbox`, `Spinner`, `Icon`, `IconButton`).

---

## Estrutura global (todas as telas)

**Página:** fundo `#ffffff`, `min-height:100vh`, coluna flex: header → main → footer.

**Header (sticky, top:0, z-index 5, fundo #fff)**
- Container `max-width:1120px`, centrado, padding `clamp(16px,4vw,24px) clamp(16px,5vw,40px)`, flex `space-between`, `flex-wrap:wrap`, gap `12px 24px`.
- Esquerda: logotipo ATF `assets/logo.svg`, largura **104px** (wordmark oficial; não redesenhar).
- Direita: nome do passo (13px, 600, `#343332`) + contador "N de 5" (13px, `#90887f`), gap 12px.
- Barra de progresso: trilho 2px `#ecebe9`; preenchimento 2px `#ffcd7d`, largura = `step/5 × 100%`, `transition: width .4s ease`.

**Main:** `max-width:1120px`, centrado, padding `clamp(24px,5vw,40px) clamp(16px,5vw,40px) 64px`, `overflow-x:hidden`. Passos 2–5 usam coluna `max-width:640px` centrada, gap **32px**.

**Footer:** `border-top:1px solid #ecebe9`; container 1120px, padding `24px clamp(16px,5vw,40px)`, flex `space-between` com wrap, 12px/1.5 `#5e5c5b`.
- Texto: "ATF SCD S.A. · Sociedade de Crédito Direto · Instituição 513 · Autorizada pelo Banco Central do Brasil"
- Links "Termos" e "Privacidade" (abrem os modais de documento).

**Entrada de cada passo:** `animation: cpFade .4s ease both` (opacity 0→1, translateY 8px→0).

**Barra de ações (passos 2–4):** flex `space-between`, `flex-wrap: wrap-reverse`, gap 12px. Esquerda: `Button variant="text" size="md"` "Voltar". Direita: wrapper `flex:1 1 240px; max-width:360px; margin-left:auto` com `Button variant="brand" size="lg"` em **largura 100%**. No celular o primário fica em cima, em largura total, e o "Voltar" desce para baixo.

---

## Screens / Views

### 01 · Boas-vindas (estilo hotsite)
**Propósito:** apresentar a ATF e coletar o consentimento.
**Layout:** coluna, gap `clamp(32px,6vw,48px)`, conteúdo `max-width:880px`, alinhado à esquerda.
- **H1:** "Consignado privado, direto do seu salário para a sua conta." — `font-size: clamp(34px,9vw,84px)`, 600, line-height 1.02, letter-spacing −0.035em, `text-wrap:balance`.
- **Lead:** "A ATF SCD S.A. é uma Sociedade de Crédito Direto autorizada e regulada pelo Banco Central do Brasil. Você contrata em poucos minutos e a parcela é descontada em folha." — `clamp(16px,3.6vw,20px)`/1.5, `#5e5c5b`, max-width 620px.
- **Faixa de 3 fatos:** grid `repeat(auto-fit,minmax(min(100%,180px),1fr))`, gap 20px, `border-top:1px solid #ecebe9`, padding-top 24px. Cada fato: valor 32px/600/−0.02em + legenda 14px `#5e5c5b`, gap 4px.
  - "513" — Código da instituição no sistema financeiro
  - "Bacen" — Autorizada e supervisionada pelo Banco Central
  - "Pix" — Dinheiro na sua conta, na chave do seu CPF
- **Consentimento:** `label` flex, gap 12px, 15px/1.5. `Checkbox` + texto: "Li e aceito o [Termo de consentimento] e a [Política de privacidade], incluindo a consulta dos meus dados de vínculo empregatício." Os links abrem o modal de documento.
- **CTA:** `Button brand lg` "Seguir", ícone à direita `arrowForward`, largura 100% dentro de um wrapper com `max-width:360px`. **Desabilitado** até o consentimento ser marcado.

### 02 · Proposta
**Propósito:** o trabalhador confirma o que solicitou (valor, taxa, prazo, parcela).
- Saudação: "Olá, {primeiroNome}. Esta é a sua proposta." 14px `#5e5c5b`.
- **H1 (valor):** "R$ 8.000,00" — `clamp(30px,8vw,56px)`, 600, lh 1.05, −0.03em.
- Subtítulo: "em 36 parcelas de **R$ 308,34**, descontadas em folha" 16px (parcela em 600 `#343332`).
- **Card de condições:** borda 1px `#ecebe9`, raio 20px, padding `clamp(16px,4vw,24px) clamp(16px,4vw,24px) 12px`. Linhas: flex `space-between`, baseline, `flex-wrap:wrap`, gap `4px 16px`, padding 12px 0, divisor 1px `#ecebe9` (a última sem divisor). Rótulo 14px `#5e5c5b`; valor 15px/600, alinhado à direita, `margin-left:auto`.
  | Rótulo | Valor (mock) |
  |---|---|
  | Valor solicitado | R$ 8.000,00 |
  | Prazo | 36 meses |
  | Taxa de juros | 1,89% a.m. · 25,19% a.a. |
  | Parcela mensal | R$ 308,34 |
  | IOF | R$ 98,40 |
  | CET | 2,05% a.m. · 27,58% a.a. |
  | Valor total a pagar | R$ 11.100,24 |
  | Primeiro desconto em folha | Dezembro de 2026 |
- Nota legal 13px/1.6 `#5e5c5b`: "Solicitação feita por {nome}, CPF {cpf}, vinculado a {empregador}. A parcela respeita a sua margem consignável e é repassada pelo empregador à ATF."
- Ações: Voltar | "Confirmar proposta" (`arrowForward`).
- A parcela segue a Tabela Price: `PMT = PV·i / (1 − (1+i)^−n)`. Em produção, todos os valores vêm da API de proposta — não calcular no front.

### 03 · Recebimento
**Propósito:** definir o Pix CPF de destino, validar a instituição recebedora e coletar os contatos.
- **H1:** "Onde você quer receber?" `clamp(28px,7vw,48px)`. Lead: "O valor é enviado por Pix para a chave do seu CPF. Assim garantimos que o dinheiro cai numa conta no seu nome."
- **Input "Chave Pix (CPF)"** (left-icon `pix`, placeholder `000.000.000-00`, `inputmode=numeric`). Máscara `000.000.000-00`, no máximo 11 dígitos.
  - Erros (só com 11 dígitos digitados): "CPF inválido." (falha nos dígitos verificadores ou dígitos todos iguais) · "A chave precisa ser o CPF do titular do crédito." (CPF ≠ CPF do titular da proposta).
  - Qualquer edição reseta a validação Pix para `idle`.
- **Validação Pix (máquina de estados):**
  - `idle` → `Button outline md` "Validar chave Pix" (desabilitado se o CPF não for válido e igual ao do titular).
  - `loading` → tile `#f5f5f4`, raio 12px, padding 16px: `Spinner size="sm"` + "Consultando a instituição recebedora no diretório Pix…" (14px `#5e5c5b`). Mock de 1.400ms; em produção, consulta DICT.
  - `ok` → tile `#e7f7e7`: ícone `check` `#159130` 24px + "Chave validada" (14px/600 `#1d3d1f`) + "{banco} ({ISPB/código}) · {titular mascarado}", ex.: "Nu Pagamentos S.A. (260) · Mariana S. L. · CPF ***.456.789-**".
  - `notfound` → tile `#ffe6df`: "Seu CPF ainda não é uma chave Pix" (14px/600 `#4a0000`) + "Cadastre o CPF como chave no app do seu banco e valide novamente. Leva menos de um minuto." + `Button neutral sm` "Já cadastrei, validar novamente". Ao cair nesse estado, o tutorial abre automaticamente.
- **Link tutorial** (botão de texto 14px/600, sublinhado): "Não tenho o CPF como chave Pix" / "Ocultar passo a passo". Abre uma lista ordenada (borda 1px, raio 20px, padding `clamp(16px,4vw,24px)`, gap 16px). Cada item: círculo de 28px `#ffcd7d` com número (13px/700) + título 15px/600 + texto 14px `#5e5c5b`:
  1. Abra o app do seu banco — Use a conta que está no seu nome e CPF.
  2. Entre em Pix › Minhas chaves — O nome pode variar: Área Pix, Gerenciar chaves ou Cadastrar chave.
  3. Cadastre a chave CPF — Escolha CPF como tipo de chave e confirme com a senha do app.
  4. Volte e valide aqui — A chave fica ativa na hora. Toque em validar para seguir.
- **Contato** (título 15px/600 "Contato para acompanhar a contratação"):
  - Input "E-mail" (type email) — erro "Informe um e-mail válido." (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`).
  - Input "Celular" — máscara `(00) 00000-0000`; erro "Informe o celular com DDD." (≠ 11 dígitos); descrição: "Você receberá o código de assinatura e o protocolo por SMS."
  - Cada Input que pode mostrar erro ou descrição fica num wrapper com `padding-bottom:22px`, porque o helper do DS é `position:absolute` e não reserva espaço.
- **Aviso de prazo:** tile `#fef7ed`, raio 12px, padding 16px: ícone `scheduleBold` + "Pagamento estimado em até **{N} horas úteis** após a assinatura da CCB." (N configurável; padrão 2).
- Ações: Voltar | "Seguir para assinatura" — habilitado só com CPF válido do titular **e** Pix `ok` **e** e-mail válido **e** celular com 11 dígitos.

### 04 · Assinatura da CCB
- **H1:** "Assine a sua Cédula de Crédito Bancário". Lead: "A CCB é o contrato do seu empréstimo. Revise os pontos principais e assine com o código enviado ao seu celular."
- **Card CCB:** borda 1px, raio 20px, `overflow:hidden`.
  - Cabeçalho `#f5f5f4`, padding `16px clamp(16px,4vw,24px)`, com wrap: "CCB nº 513-2026-0048213" (14px/600) + link "Ler documento completo" (13px/600).
  - Corpo: scroll vertical `max-height:280px`, padding `clamp(16px,4vw,24px)`, gap 16px. Cada cláusula: título overline 12px/700, tracking .06em, maiúsculas, `#5e5c5b` + texto 14px/1.6.
    - PARTES — Emitente: {nome}, CPF {cpf}. Credora: ATF SCD S.A., instituição 513.
    - VALOR E LIBERAÇÃO — {valor} creditados via Pix na chave CPF da emitente, em {banco}.
    - ENCARGOS — Taxa de 1,89% a.m. (25,19% a.a.), CET de 2,05% a.m. (27,58% a.a.) e IOF de R$ 98,40.
    - PAGAMENTO — 36 parcelas mensais de R$ 308,34, descontadas em folha por {empregador}, a partir de dezembro de 2026.
    - RESCISÃO DO VÍNCULO — Em caso de desligamento, o saldo devedor poderá ser abatido das verbas rescisórias, nos limites da lei, e o restante seguirá em boleto.
    - LIQUIDAÇÃO ANTECIPADA — Você pode quitar a qualquer momento, com redução proporcional dos juros.
- **Aceite:** `Checkbox` + "Li a CCB e concordo com as condições de valor, taxa, prazo e desconto em folha."
- **OTP:**
  - Antes do envio: CTA "Enviar código por SMS" (desabilitado sem o aceite).
  - Depois do envio: Input "Código de 6 dígitos" (só dígitos, maxLength 6), descrição "Enviado por SMS para (11) •••••-4321", link "Reenviar código". O CTA vira "Assinar CCB" (ícone `doneBold`), habilitado com 6 dígitos; durante o envio mostra "Assinando…" (mock de 1.200ms) e depois avança para o passo 5.

### 05 · Concluído
Coluna centrada, `text-align:center`, gap 32px.
- **Check animado (estilo "compra concluída"):** 112×112.
  - Disco `#159130` com `cpPop` .5s `cubic-bezier(.2,.9,.3,1.3)`: scale 0 → 1.08 → 1.
  - Anel `#5bbd64` atrás com `cpRing` .9s ease-out, delay .35s: scale .8→1.5, opacity .5→0.
  - Traço do V em branco, path `M34 58 L49 73 L79 41`, stroke 9, cantos arredondados, `stroke-dasharray:70`, desenhado por `cpDraw` .4s ease-out, delay .45s (dashoffset 70→0).
  - Respeitar `prefers-reduced-motion`: mostrar o estado final sem animação.
- **H1:** "Pronto, {primeiroNome}! Contratação concluída." + "{valor} serão enviados por Pix para {banco} em até {N horas úteis}." — entrada `cpFade` com delay .7s.
- **Protocolo:** tile `#fef7ed`, raio 20px, padding `clamp(16px,4vw,24px)`: "Número do protocolo" (13px `#5e5c5b`) + "CP 2026 1016 48213" (`clamp(22px,6.4vw,28px)`/600, tracking .02em, `overflow-wrap:anywhere`). Delay .85s.
- **Card de envios** (alinhado à esquerda, delay 1s). Cada linha: ícone 22px num quadrado de 40px, fundo `#f5f5f4`, raio 12px + título 15px/600 + texto 14px `#5e5c5b`:
  - `chat` — "SMS enviado" — "Para {celular}, com o protocolo e o link para acompanhar a contratação."
  - `mail` — "CCB assinada no seu e-mail" — "Enviamos a cédula em PDF para {email}."
  - `pix` — "Pix em até {N horas úteis}" — "Avisamos por SMS assim que o valor for creditado na sua conta."
- **Ações:** grid `repeat(auto-fit,minmax(min(100%,220px),1fr))`, gap 12px (delay 1.1s): `Button outline lg` "Ver CCB assinada" (`download`) + `Button brand lg` "Acompanhar protocolo" (`arrowForward`), ambos em largura 100%.
- "Reiniciar demonstração" existe **só no protótipo** — não implementar.

### Modal de documento (Termos / Privacidade)
- Overlay fixo `rgba(0,0,0,.4)`, padding 24px; fecha ao clicar fora.
- Caixa `max-width:560px`, `max-height:80vh`, fundo #fff, raio 20px, `var(--shadow-3)`.
- Cabeçalho: título 20px/600 + `IconButton icon="close"`.
- Corpo com scroll: parágrafos 14px/1.6.
- Rodapé com borda superior e `Button brand md` "Entendi".
- O texto atual é **provisório** — substituir pelo texto do jurídico. Em produção, preferir o `Modal`/`Dialog` do DS.

---

## Interactions & Behavior (resumo)
- Navegação linear. "Voltar" mantém o estado preenchido. Ao trocar de passo: `window.scrollTo({top:0, behavior:'smooth'})`.
- Gates: consentimento (passo 1); CPF + Pix + e-mail + celular (passo 3); aceite da CCB → OTP de 6 dígitos (passo 4).
- Na URL do produto, sugere-se espelhar o passo (`?step=3`) e bloquear o acesso direto a passos sem os pré-requisitos.
- **Responsivo:** fluido de 320px até desktop, via `clamp()` em tipografia e paddings. CTAs em largura total no celular; linhas de valor quebram; textos longos com `overflow-wrap:anywhere`; `html,body{overflow-x:hidden}`.

## State Management
```ts
step: 1|2|3|4|5
consent: boolean
doc: null | 'termos' | 'privacidade'
cpfPix: string            // mascarado
pix: 'idle'|'loading'|'ok'|'notfound'
tutorial: boolean
email: string; phone: string  // phone mascarado
ccbAceite: boolean
otpSent: boolean; otp: string; signing: boolean
```
**Integrações esperadas:**
- `GET /proposta` — valor, prazo, taxa, CET, IOF, parcela, total, primeiro desconto; dados do trabalhador e do empregador.
- `POST /consentimentos` — registrar aceite + versão dos termos + timestamp + IP.
- `POST /pix/validar` — consulta DICT da chave CPF; retorna instituição (nome + código/ISPB) e titular mascarado; 404 → estado `notfound`.
- `POST /ccb/otp` e `POST /ccb/assinar` — envio e verificação do OTP; a assinatura retorna protocolo e URL da CCB.
- Disparos pós-assinatura (SMS com protocolo + link de acompanhamento; e-mail com o PDF da CCB) são feitos no back-end.

## Design Tokens
- **Brand gold:** `#ffcd7d` (canônico; não usar o `#ffd28b` antigo que ainda aparece em `tokens/colors.css` deste pacote).
- **Amber:** secondary-20 `#a96f00` (hover de link) · secondary-90 `#fef7ed` (tiles de destaque).
- **Neutros quentes:** 20 `#343332` (texto) · 40 `#5e5c5b` (texto secundário) · 50 `#90887f` (terciário) · 90 `#ecebe9` (hairline) · 95 `#f5f5f4` (superfície sutil) · 100 `#ffffff`.
- **Success:** 90 `#e7f7e7` · 50 `#5bbd64` · 40 `#159130` · 10 `#1d3d1f`.
- **Error:** 90 `#ffe6df` · 10 `#4a0000`.
- **Tipografia:** Plus Jakarta Sans (400/500/600/700), `font-variant-ligatures:none`. H1 semibold 600 com tracking negativo; corpo 14–16px.
- **Raios:** card 20px · tile 12px · botão 8px (DS) · pill/círculos 999px.
- **Espaçamento (escala 4px):** seção 32px · padding de card 24px (com lista: 24/24/12) · tile 16px · pilha 12px · inline 8px · micro 4px.
- **Sombra:** apenas no modal (`--shadow-3`).
- **Links:** `#343332`, sublinhado com offset 3px; hover `#a96f00`.

## Assets
- `assets/logo.svg` — wordmark oficial da ATF (`currentColor`). Não modificar.
- `assets/atf-symbol.png` — símbolo da ATF (não usado nesta tela; incluído para referência).
- Ícones do `Icon` do DS: `arrowForward`, `pix`, `check`, `scheduleBold`, `doneBold`, `download`, `chat`, `mail`, `close`. Não existe um glifo `sms` no set; usar `chat`.
- Fontes em `_ds/.../assets/fonts`.

## Files
- `Consignado Privado.dc.html` — protótipo completo (template + lógica + mocks). Props de simulação: `pixResultado` ("CPF cadastrado" | "Sem chave CPF") e `horasUteis` (int).
- `support.js` — runtime do protótipo (não faz parte do produto).
- `_ds/atf-design-system-.../` — tokens, CSS e bundle dos componentes ATF usados no protótipo.

## Pendências de produto
- Todos os dados são mock (nome, CPF 123.456.789-09, empregador, valores, banco, protocolo).
- Textos de Termos, Privacidade e cláusulas da CCB precisam do jurídico.
- "Ler documento completo", "Ver CCB assinada" e "Acompanhar protocolo" ainda não têm destino.
