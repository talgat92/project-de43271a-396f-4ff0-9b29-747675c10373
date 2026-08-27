import { createServerFn } from "@tanstack/react-start";

import type { BayState, Card, PayEvent, Transaction } from "./jahan.server";

export type { BayState, Card, PayEvent, Transaction };

/* ------------------------------- Публичные ---------------------------------- */

export const getCardsByPhone = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string }) => ({ phone: String(d.phone).replace(/\D/g, "").slice(0, 15) }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    return s.apiFetchOr<Card[]>(
      `/api/cards.php?phone=${encodeURIComponent(data.phone)}`,
      s.DEMO_CARDS.filter((c) => c.phone === data.phone),
    );
  });

/* ------------------------------- Админские ---------------------------------- */

interface Auth {
  password: string;
}

const authInput = (d: Auth) => ({ password: String(d.password ?? "") });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(authInput)
  .handler(async ({ data }) => {
    const { checkAdminPassword } = await import("./jahan.server");
    return { ok: checkAdminPassword(data.password) };
  });

export const getBayStates = createServerFn({ method: "POST" })
  .inputValidator(authInput)
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    return s.apiFetchOr<BayState[]>("/api/bays.php", s.demoBayStates());
  });

export const getTransactions = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { building?: number; type?: string }) => ({
    password: String(d.password ?? ""),
    building: d.building === 2 ? 2 : 1,
    type: typeof d.type === "string" ? d.type : "all",
  }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    const all = await s.apiFetchOr<Transaction[]>(
      `/api/transactions.php?building=${data.building}&type=${encodeURIComponent(data.type)}`,
      s.demoTransactions(),
    );
    const range = data.building === 1 ? [1, 6] : [7, 12];
    return all
      .filter((t) => t.bay_id >= range[0]! && t.bay_id <= range[1]!)
      .filter((t) => data.type === "all" || t.type === data.type)
      .slice(0, 200);
  });

export const searchCards = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { q?: string }) => ({ password: String(d.password ?? ""), q: String(d.q ?? "") }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    const cards = await s.apiFetchOr<Card[]>(
      `/api/cards.php?q=${encodeURIComponent(data.q)}`,
      s.DEMO_CARDS,
    );
    const q = data.q.trim().toLowerCase();
    if (!q) return cards;
    const digits = q.replace(/\D/g, "");
    return cards.filter(
      (c) =>
        c.card_uid.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (digits.length > 0 && c.phone.includes(digits)),
    );
  });

export const adjustBalance = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { card_uid: string; delta: number }) => ({
    password: String(d.password ?? ""),
    card_uid: String(d.card_uid ?? "").toUpperCase(),
    delta: Number(d.delta) || 0,
  }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    return s.apiFetchOr<{ ok: boolean; balance?: number }>(
      "/api/cards.php",
      { ok: true },
      { method: "PATCH", body: JSON.stringify({ card_uid: data.card_uid, delta: data.delta }) },
    );
  });

export const createCard = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { card_uid: string; name: string; phone: string; balance?: number }) => ({
    password: String(d.password ?? ""),
    card_uid: String(d.card_uid ?? "").toUpperCase().trim(),
    name: String(d.name ?? "").trim(),
    phone: String(d.phone ?? "").replace(/\D/g, "").slice(0, 15),
    balance: Number(d.balance) || 0,
  }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    if (!data.card_uid || !data.name || !data.phone) throw new Error("Заполните все поля");
    const { password: _pw, ...payload } = data;
    return s.apiFetchOr<{ ok: boolean }>(
      "/api/cards.php",
      (() => {
        s.demoAddCard(payload);
        return { ok: true };
      })(),
      { method: "POST", body: JSON.stringify(payload) },
    );
  });

export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { card_uid: string }) => ({
    password: String(d.password ?? ""),
    card_uid: String(d.card_uid ?? "").toUpperCase().trim(),
  }))
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    return s.apiFetchOr<{ ok: boolean }>(
      `/api/cards.php?card_uid=${encodeURIComponent(data.card_uid)}`,
      (() => {
        s.demoDeleteCard(data.card_uid);
        return { ok: true };
      })(),
      { method: "DELETE" },
    );
  });

export const getLiveEvents = createServerFn({ method: "POST" })
  .inputValidator(authInput)
  .handler(async ({ data }) => {
    const s = await import("./jahan.server");
    if (!s.checkAdminPassword(data.password)) throw new Error("Unauthorized");
    return s.listEvents();
  });
