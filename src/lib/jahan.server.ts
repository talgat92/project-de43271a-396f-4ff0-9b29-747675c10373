// Серверные помощники: доступ к backend API cars-wash.kz и к настройкам MQTT.
// Все секреты читаются ТОЛЬКО внутри функций (env инжектится на запрос).

import { ALL_BAYS, buildingOfBay, type TxnType } from "@/config";

export interface JahanEnv {
  apiBase: string;
  token: string;
  mqttHost: string;
  mqttPort: string;
  mqttUser: string;
  dbSchema: string;
}

export function readEnv(): JahanEnv {
  return {
    apiBase: process.env["JAHAN_API_BASE"] ?? "https://cars-wash.kz",
    token: process.env["JAHAN_API_TOKEN"] ?? "",
    mqttHost: process.env["JAHAN_MQTT_HOST"] ?? "",
    mqttPort: process.env["JAHAN_MQTT_PORT"] ?? "1883",
    mqttUser: process.env["JAHAN_MQTT_USER"] ?? "",
    dbSchema: process.env["JAHAN_DB_SCHEMA"] ?? "carwash_db",
  };
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env["JAHAN_ADMIN_PASSWORD"] ?? "";
  if (!expected || password.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ password.charCodeAt(i);
  return diff === 0;
}

export function mqttTopic(bayId: number): string {
  return `carwash/bay_${bayId}/pay`;
}

/** Запрос к PHP-бэкенду с Bearer-авторизацией. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiBase, token } = readEnv();
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export async function apiFetchOr<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch {
    return fallback;
  }
}

/* ---------------- Лента событий Kaspi (in-memory, для live-превью) ------------- */

export interface PayEvent {
  txn_id: string;
  bay_id: number;
  building: 1 | 2;
  amount: number;
  card_uid: string | null;
  type: TxnType;
  topic: string;
  created_at: string;
}

const EVENTS: PayEvent[] = [];

export function pushEvent(e: PayEvent) {
  EVENTS.unshift(e);
  if (EVENTS.length > 50) EVENTS.length = 50;
}

export function listEvents(): PayEvent[] {
  return EVENTS.slice(0, 30);
}

/* ---------------- Демо-данные, если бэкенд недоступен ------------------------- */

export interface Card {
  id: number;
  card_uid: string;
  phone: string;
  name: string;
  balance: number;
  created_at: string;
  topups_count?: number;
}

export interface Transaction {
  id: number;
  card_uid: string | null;
  bay_id: number;
  amount: number;
  type: TxnType;
  txn_id: string | null;
  created_at: string;
}

export interface BayState {
  bay_id: number;
  building: 1 | 2;
  busy: boolean;
  last_amount: number;
  day_total: number;
  day_kaspi: number;
  day_cash: number;
  month_total: number;
  /** Накоплено наличных в купюроприёмнике (к инкассации). Не влияет на доход. */
  current_cash_box: number;
  updated_at: string;
}

export const DEMO_CARDS: Card[] = [
  { id: 1, card_uid: "04A2B1C3", phone: "77000000000", name: "Асхат Ким", balance: 12500, created_at: "2026-01-12", topups_count: 14 },
  { id: 2, card_uid: "04B7D2E9", phone: "77011111111", name: "Ержан Абай", balance: 8750, created_at: "2026-02-03", topups_count: 9 },
  { id: 3, card_uid: "04C1F5A7", phone: "77072222222", name: "Мадина С.", balance: 3200, created_at: "2026-03-21", topups_count: 21 },
  { id: 4, card_uid: "04D9E3B2", phone: "77475556677", name: "Талгат С.", balance: 24000, created_at: "2026-04-05", topups_count: 5 },
];

/** Локальное добавление карты (когда PHP-бэкенд недоступен). */
export function demoAddCard(input: { card_uid: string; name: string; phone: string; balance: number }): Card {
  const card: Card = {
    id: Math.max(0, ...DEMO_CARDS.map((c) => c.id)) + 1,
    card_uid: input.card_uid,
    name: input.name,
    phone: input.phone,
    balance: input.balance,
    created_at: new Date().toISOString().slice(0, 10),
    topups_count: 0,
  };
  DEMO_CARDS.unshift(card);
  return card;
}

/** Локальное удаление карты (когда PHP-бэкенд недоступен). */
export function demoDeleteCard(cardUid: string): boolean {
  const i = DEMO_CARDS.findIndex((c) => c.card_uid === cardUid);
  if (i >= 0) DEMO_CARDS.splice(i, 1);
  return i >= 0;
}

/* ------- Накопленные наличные в купюроприёмнике (отдельно от дохода) --------- */

/** Переопределения current_cash_box после инкассации (демо-режим). */
const CASH_BOX_OVERRIDE = new Map<number, number>();

/** Транзакции инкассации, созданные локально (демо-режим). */
const COLLECTIONS: Transaction[] = [];

function defaultCashBox(bay_id: number): number {
  return 3800 + bay_id * 450;
}

/** Обнулить накопленные наличные по постам. Доход (day_cash/month) не меняется. */
export function demoCollectCash(bayIds: number[]): { collected: number; bays: number[] } {
  let collected = 0;
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  for (const bay_id of bayIds) {
    const amount = CASH_BOX_OVERRIDE.get(bay_id) ?? defaultCashBox(bay_id);
    if (amount <= 0) continue;
    collected += amount;
    CASH_BOX_OVERRIDE.set(bay_id, 0);
    COLLECTIONS.unshift({
      id: Date.now() + bay_id,
      card_uid: null,
      bay_id,
      amount,
      type: "cash_collection",
      txn_id: `COLLECT-${bay_id}-${Date.now()}`,
      created_at: now,
    });
  }
  if (COLLECTIONS.length > 200) COLLECTIONS.length = 200;
  return { collected, bays: bayIds };
}

/** Сброс счётчика выемки купюр без влияния на статистику доходов. */
export function demoResetCashCounter(bayIds: number[]): { ok: boolean } {
  for (const bay_id of bayIds) CASH_BOX_OVERRIDE.set(bay_id, 0);
  return { ok: true };
}

export function demoBayStates(): BayState[] {
  return ALL_BAYS.map((bay_id) => {
    const day_kaspi = 8000 + bay_id * 900;
    const day_cash = 4200 + bay_id * 500;
    return {
      bay_id,
      building: buildingOfBay(bay_id),
      busy: bay_id % 3 === 0,
      last_amount: 500 + bay_id * 100,
      day_kaspi,
      day_cash,
      day_total: day_kaspi + day_cash,
      month_total: (day_kaspi + day_cash) * 26,
      current_cash_box: CASH_BOX_OVERRIDE.get(bay_id) ?? defaultCashBox(bay_id),
      updated_at: "—",
    };
  });
}

export function demoTransactions(): Transaction[] {
  const types: TxnType[] = ["kaspi_direct", "kaspi_topup", "card_wash", "cash_pay"];
  const base = ALL_BAYS.flatMap((bay_id, i) =>
    types.map((type, j) => ({
      id: i * 10 + j,
      card_uid: type === "kaspi_direct" ? null : DEMO_CARDS[(i + j) % DEMO_CARDS.length]!.card_uid,
      bay_id,
      amount: 500 * ((j % 4) + 1),
      type,
      txn_id: `DEMO-${bay_id}-${j}`,
      created_at: `2026-08-26 1${j}:0${i % 6}:00`,
    })),
  );
  return [...COLLECTIONS, ...base];
}
