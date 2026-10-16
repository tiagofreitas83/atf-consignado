import { describe, expect, it } from "vitest";
import { cpfValido } from "../lib/cpf";
import { brl, celularMascarado, mesAno, taxaAmAa } from "../lib/format";
import { maskCPF, maskPhoneBR } from "../ds/masks";
import { createMockApi, pmt } from "../api/mock";
import { detectarChave } from "../lib/pix";
import { lerToken } from "../lib/token";

describe("cpf", () => {
  it("valida dígitos verificadores", () => {
    expect(cpfValido("12345678909")).toBe(true);
    expect(cpfValido("12345678900")).toBe(false);
    expect(cpfValido("11111111111")).toBe(false);
    expect(cpfValido("1234567890")).toBe(false);
  });
});

describe("máscaras", () => {
  it("CPF e celular", () => {
    expect(maskCPF("12345678909999")).toBe("123.456.789-09");
    expect(maskPhoneBR("11987654321")).toBe("(11) 98765-4321");
  });
});

describe("formatação", () => {
  it("valores da proposta", () => {
    expect(brl(8000)).toBe("R$ 8.000,00");
    expect(brl(11100.24)).toBe("R$ 11.100,24");
    expect(taxaAmAa(0.0189, 0.2519)).toBe("1,89% a.m. · 25,19% a.a.");
    expect(mesAno("2026-12")).toBe("dezembro de 2026");
    expect(celularMascarado("11987654321")).toBe("(11) •••••-4321");
  });
});

describe("mock da proposta", () => {
  it("Tabela Price bate com o handoff", async () => {
    expect(pmt(8000, 0.0189, 36)).toBeCloseTo(308.345, 3);
    const r = await createMockApi({ latency: 0 }).verificarCpf({ token: "t", cpf: "12345678909" });
    if (r.status !== "ok") throw new Error("CPF de teste deveria conferir");
    expect(r.proposta.parcela).toBe(308.34);
    expect(r.proposta.total).toBe(11100.24);
  });
});

describe("detecção da chave Pix", () => {
  it.each([
    ["mariana.lima@email.com", "email", "mariana.lima@email.com"],
    ["  Mariana.Lima@Email.com ", "email", "mariana.lima@email.com"],
    ["(11) 98765-4321", "celular", "+5511987654321"],
    ["+55 11 98765-4321", "celular", "+5511987654321"],
    ["11987654321", "celular", "+5511987654321"],
    ["123.456.789-09", "cpf", "12345678909"],
    ["12345678909", "cpf", "12345678909"],
    ["12.345.678/0001-95", "cnpj", "12345678000195"],
    ["123E4567-E89B-12D3-A456-426614174000", "evp", "123e4567-e89b-12d3-a456-426614174000"],
    ["123e4567e89b12d3a456426614174000", "evp", "123e4567-e89b-12d3-a456-426614174000"],
  ])("%s → %s", (entrada, tipo, normalizada) => {
    expect(detectarChave(entrada)).toMatchObject({ tipo, normalizada });
  });

  it.each(["", "mariana@", "1198765", "abc", "(11) 3456-7890"])("não reconhece %j", (entrada) => {
    expect(detectarChave(entrada)).toBeNull();
  });
});

describe("token do link", () => {
  it("lê o token do caminho /consignado/<token>, sem interpretá-lo", () => {
    expect(lerToken({ pathname: "/consignado/k7Qx2mLw9ZvR4nH6", search: "" }, "/")).toBe("k7Qx2mLw9ZvR4nH6");
    expect(lerToken({ pathname: "/atf-consignado/k7Qx2mLw9ZvR4nH6", search: "?step=2" }, "/atf-consignado/")).toBe("k7Qx2mLw9ZvR4nH6");
    expect(lerToken({ pathname: "/", search: "?t=abc" }, "/")).toBe("abc");
    expect(lerToken({ pathname: "/atf-consignado/", search: "" }, "/atf-consignado/")).toBe("demo");
  });
});
