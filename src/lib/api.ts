import { API_BASE_URL, BAYS, USE_DEMO_FALLBACK } from "@/config.js";

export type TxnType = "kaspi_direct" | "kaspi_topup" | "card_wash" | "cash_pay";

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

export interface BayStat {
  bay_id: number;
  day_total: number;
  month_total: number;
  day_kaspi: number;
  day_cash: number;
  month_kaspi: number;
  month_cash: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Ошибка API (${res.status})`);
  return (await res.json()) as T;
}

/* ---------- Демо-данные (используются, если API недоступен) ---------- */

const DEMO_CARDS: Card[] = [
  { id: 1, card_uid: "04A2B1C3", phone: "77000000000", name: "Асхат Ким", balance: 12500, created_at: "2026-01-12", topups_count: 14 },
  { id: 2, card_uid: "04B7D2E9", phone: "77011111111", name: "Ержан Абай", balance: 8750, created_at: "2026-02-03", topups_count: 9 },
  { id: 3, card_uid: "04C1F5A7", phone: "77072222222", name: "Мадина С.", balance: 3200, created_at: "2026-03-21", topups_count: 21 },
  { id: 4, card_uid: "04D9E3B2", phone: "77475556677", name: "Талгат С.", balance: 24000, created_at: "2026-04-05", topups_count: 5 },
];

function demoBayStats(): BayStat[] {
  return BAYS.map((bay_id) => {
    const day_kaspi = 9000 + bay_id * 1400;
    const day_cash = 5200 + bay_id * 900;
    return {
      bay_id,
      day_kaspi,
      day_cash,
      day_total: day_kaspi + day_cash,
      month_kaspi: day_kaspi * 26,
      month_cash: day_cash * 26,
      month_total: (day_kaspi + day_cash) * 26,
    };
  });
}

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (USE_DEMO_FALLBACK) return fallback;
    throw e;
  }
}

/* ---------- Публичные методы ---------- */

export function getCardsByPhone(phoneDigits: string) {
  return withFallback(
    () => request<Card[]>(`/cards.php?phone=${encodeURIComponent(phoneDigits)}`),
    DEMO_CARDS.filter((c) => c.phone === phoneDigits),
  );
}

export function getAllCards() {
  return withFallback(() => request<Card[]>(`/cards.php`), DEMO_CARDS);
}

export function createCard(payload: { name: string; phone: string; card_uid: string; balance: number }) {
  return withFallback(
    () => request<Card>(`/cards.php`, { method: "POST", body: JSON.stringify(payload) }),
    { id: Date.now(), created_at: new Date().toISOString().slice(0, 10), topups_count: 0, ...payload } as Card,
  );
}

export function deleteCard(id: number) {
  return withFallback(
    () => request<{ ok: boolean }>(`/cards.php?id=${id}`, { method: "DELETE" }),
    { ok: true },
  );
}

export function getBayStats() {
  return withFallback(() => request<BayStat[]>(`/stats.php?group=bays`), demoBayStats());
}
