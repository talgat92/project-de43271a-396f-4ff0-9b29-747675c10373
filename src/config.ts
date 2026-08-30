// Публичная конфигурация мойки JAHAN (cars-wash.kz).
// Секреты (Bearer-токен, доступ к MQTT и БД) хранятся в переменных окружения
// и читаются только на сервере — см. src/lib/jahan.server.ts

export const BRAND = "JAHAN";

export interface Building {
  id: 1 | 2;
  name: string;
  short: string;
  bays: number[];
}

export const BUILDINGS: Building[] = [
  { id: 1, name: "Здание 1", short: "Посты 1–6", bays: [1, 2, 3, 4, 5, 6] },
  { id: 2, name: "Здание 2", short: "Посты 7–12", bays: [7, 8, 9, 10, 11, 12] },
];

export const ALL_BAYS = BUILDINGS.flatMap((b) => b.bays);

export function buildingOfBay(bayId: number): 1 | 2 {
  return bayId <= 6 ? 1 : 2;
}

export const TXN_TYPES = [
  { value: "kaspi_direct", label: "Kaspi (прямая оплата поста)" },
  { value: "kaspi_topup", label: "Kaspi (пополнение карты)" },
  { value: "card_wash", label: "Списание с карты" },
  { value: "cash_pay", label: "Наличные" },
  { value: "cash_collection", label: "Инкассация" },
] as const;

export type TxnType = (typeof TXN_TYPES)[number]["value"];
