import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { createMockApi } from "../api/mock";

const seguir = () => screen.getByRole("button", { name: /^Seguir$/ });

async function ateRecebimento(pix: "cadastrado" | "sem-chave" = "cadastrado") {
  const user = userEvent.setup();
  render(<App api={createMockApi({ latency: 0, pixResultado: pix })} />);
  expect(seguir()).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(seguir()).toBeEnabled());
  await user.click(seguir());
  await screen.findByRole("heading", { name: "R$ 8.000,00" });
  expect(screen.getByText("1,89% a.m. · 25,19% a.a.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Confirmar proposta/ }));
  await screen.findByRole("heading", { name: "Onde você quer receber?" });
  return user;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn() as never;
});

describe("jornada", () => {
  it("vai do consentimento ao protocolo", async () => {
    const user = await ateRecebimento();
    expect(window.location.search).toBe("?step=3");
    const cpf = screen.getByLabelText("Chave Pix (CPF)");
    const proximo = screen.getByRole("button", { name: /Seguir para assinatura/ });

    await user.type(cpf, "11111111111");
    expect(screen.getByText("CPF inválido.")).toBeInTheDocument();
    await user.clear(cpf);
    await user.type(cpf, "52998224725");
    expect(screen.getByText("A chave precisa ser o CPF do titular do crédito.")).toBeInTheDocument();
    await user.clear(cpf);
    await user.type(cpf, "12345678909");
    expect(cpf).toHaveValue("123.456.789-09");
    expect(proximo).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
    await screen.findByText("Chave validada");
    expect(screen.getByText(/Nu Pagamentos S\.A\. \(260\)/)).toBeInTheDocument();
    expect(proximo).toBeEnabled();

    await user.click(proximo);
    await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
    const enviar = screen.getByRole("button", { name: /Enviar código por SMS/ });
    expect(enviar).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(enviar);

    const otp = await screen.findByLabelText("Código de 6 dígitos");
    expect(screen.getByText("Enviado por SMS para (11) •••••-4321")).toBeInTheDocument();
    await user.type(otp, "12a3456789");
    expect(otp).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: /Assinar CCB/ }));

    await screen.findByRole("heading", { name: /Pronto, Mariana!/ });
    expect(screen.getByText("CP 2026 1016 48213")).toBeInTheDocument();
    expect(window.location.search).toBe("?step=5");
  });

  it("CPF sem chave Pix abre o tutorial e permite validar de novo", async () => {
    const user = await ateRecebimento("sem-chave");
    await user.type(screen.getByLabelText("Chave Pix (CPF)"), "12345678909");
    await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
    await screen.findByText("Seu CPF ainda não é uma chave Pix");
    expect(screen.getByText("Cadastre a chave CPF")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /validar novamente/ }));
    await screen.findByText("Chave validada");
  });

  it("OTP inválido mostra erro e não avança", async () => {
    const user = await ateRecebimento();
    await user.type(screen.getByLabelText("Chave Pix (CPF)"), "12345678909");
    await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
    await screen.findByText("Chave validada");
    await user.click(screen.getByRole("button", { name: /Seguir para assinatura/ }));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar código por SMS/ }));
    await user.type(await screen.findByLabelText("Código de 6 dígitos"), "000000");
    await user.click(screen.getByRole("button", { name: /Assinar CCB/ }));
    await screen.findByText(/Código inválido/);
  });

  it("acesso direto a ?step=4 cai no passo 1", async () => {
    window.history.replaceState(null, "", "/?step=4");
    render(<App api={createMockApi({ latency: 0 })} />);
    expect(screen.getByRole("heading", { name: /Consignado privado/ })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=1");
  });

  it("voltar do navegador não pula gates", async () => {
    await ateRecebimento();
    act(() => {
      window.history.pushState(null, "", "/?step=4");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("heading", { name: "Onde você quer receber?" })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=3");
  });

  it("modal de termos abre e fecha com Esc", async () => {
    const user = userEvent.setup();
    render(<App api={createMockApi({ latency: 0 })} />);
    await user.click(screen.getAllByRole("button", { name: "Termo de consentimento" })[0]);
    expect(screen.getByRole("dialog", { name: "Termo de consentimento" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
