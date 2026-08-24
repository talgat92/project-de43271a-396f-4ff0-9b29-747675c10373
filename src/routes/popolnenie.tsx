import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatPhone, isValidPhone } from "@/lib/phone";

export const Route = createFileRoute("/popolnenie")({
  head: () => ({
    meta: [
      { title: "Пополнение карты — JAHAN" },
      { name: "description", content: "Пополните клубную карту JAHAN через QR-код. Быстро, удобно, без очередей." },
      { property: "og:title", content: "Пополнение карты — JAHAN" },
      { property: "og:description", content: "Пополните клубную карту JAHAN через QR-код. Быстро, удобно, без очередей." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TopUpPage,
});

const AMOUNT_PRESETS = [1000, 2000, 5000, 10000];

function TopUpPage() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number | "">(2000);
  const phoneError = phone && !isValidPhone(phone);

  const qrValue = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    const sum = typeof amount === "number" ? amount : 0;
    // Заглушка для платёжной ссылки. Замените на реальный URL от вашего провайдера оплаты.
    return `https://cars-wash.kz/pay?phone=${digits}&amount=${sum}`;
  }, [phone, amount]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
      return;
    }
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (!Number.isNaN(num)) {
      setAmount(num);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-wash-foam px-4 py-12">
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-wash-sky-light blur-3xl" />
        <div className="absolute bottom-20 right-0 h-96 w-96 rounded-full bg-wash-sky/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-xl shadow-wash-sky/10 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wash-sky/10 text-wash-sky">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
                <path d="M7 15h.01" />
                <path d="M11 15h2" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Пополнение клубной карты
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Введите номер телефона и сумму, затем отсканируйте QR-код
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                  Номер телефона
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+7 (700) 000-00-00"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-wash-sky focus:ring-2 focus:ring-wash-sky/20"
                  maxLength={20}
                  autoComplete="tel"
                />
                {phoneError && (
                  <p className="mt-2 text-sm text-destructive">
                    Введите корректный номер в формате +7 (XXX) XXX-XX-XX
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="amount" className="mb-2 block text-sm font-medium text-foreground">
                  Сумма пополнения, ₸
                </label>
                <input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="2000"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-wash-sky focus:ring-2 focus:ring-wash-sky/20"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        amount === preset
                          ? "bg-wash-sky text-white"
                          : "border border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {preset.toLocaleString("ru-KZ")} ₸
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <h2 className="text-sm font-medium text-foreground">Как пополнить</h2>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash-sky/10 text-xs font-semibold text-wash-sky">
                      1
                    </span>
                    Введите номер телефона, привязанный к карте
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash-sky/10 text-xs font-semibold text-wash-sky">
                      2
                    </span>
                    Выберите сумму пополнения
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash-sky/10 text-xs font-semibold text-wash-sky">
                      3
                    </span>
                    Отсканируйте QR-код камерой телефона
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash-sky/10 text-xs font-semibold text-wash-sky">
                      4
                    </span>
                    Оплатите удобным способом — баланс обновится в течение минуты
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-wash-foam p-6">
              <div className="rounded-2xl border-4 border-white bg-white p-3 shadow-lg">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0EA5E9"
                  includeMargin={false}
                />
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Сканируйте код и следуйте подсказкам платёжной системы
              </p>
              <div className="mt-4 rounded-lg border border-wash-sky/20 bg-wash-sky/10 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-wash-sky-dark">
                  {typeof amount === "number" ? amount.toLocaleString("ru-KZ") : 0} ₸
                </p>
                <p className="text-xs text-wash-sky-dark/80">{phone || "номер не указан"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Демо-режим:</span> QR-код ведёт на
              заглушку платёжной ссылки. В реальной версии здесь будет подключение к Kaspi Pay,
              CloudPayments или другому провайдеру.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Проблемы с пополнением? Позвоните оператору на мойке.
        </p>
      </div>
    </div>
  );
}
