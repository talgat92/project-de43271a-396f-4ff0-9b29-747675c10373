import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/balance")({
  head: () => ({
    meta: [
      { title: "Проверка баланса — cars-wash.kz" },
      { name: "description", content: "Проверьте баланс клубной карты cars-wash.kz по номеру телефона." },
      { property: "og:title", content: "Проверка баланса — cars-wash.kz" },
      { property: "og:description", content: "Проверьте баланс клубной карты cars-wash.kz по номеру телефона." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BalancePage,
});

const DEMO_BALANCES: Record<string, number> = {
  "+7 (700) 000-00-00": 12500,
  "+7 (701) 111-11-11": 8750,
  "+7 (707) 222-22-22": 3200,
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const country = digits[0] === "7" ? "7" : "";
  const rest = country ? digits.slice(1) : digits;

  let formatted = country === "7" ? "+7" : "";
  if (rest.length > 0) formatted += " (" + rest.slice(0, 3);
  if (rest.length >= 3) formatted += ")";
  if (rest.length > 3) formatted += " " + rest.slice(3, 6);
  if (rest.length > 6) formatted += "-" + rest.slice(6, 8);
  if (rest.length > 8) formatted += "-" + rest.slice(8, 10);

  return formatted;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("7");
}

function BalancePage() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [balance, setBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatPhone(raw);
    setPhone(formatted);
    if (status !== "idle") {
      setStatus("idle");
      setBalance(null);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhone(phone)) {
      setStatus("error");
      setErrorMessage("Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX");
      return;
    }

    setStatus("loading");
    setBalance(null);
    setErrorMessage("");

    // Имитация запроса к API. Замените на реальный вызов к бэкенду.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const foundBalance = DEMO_BALANCES[phone];
    if (foundBalance !== undefined) {
      setBalance(foundBalance);
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage("Карта по этому номеру не найдена. Проверьте номер или обратитесь на мойку.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-wash-foam px-4 py-12">
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-wash-sky-light blur-3xl" />
        <div className="absolute bottom-20 right-0 h-96 w-96 rounded-full bg-wash-sky/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-xl shadow-wash-sky/10">
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
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Проверка баланса
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Введите номер телефона, привязанный к клубной карте
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                onChange={handleChange}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-wash-sky focus:ring-2 focus:ring-wash-sky/20"
                maxLength={20}
                autoComplete="tel"
              />
              {status === "error" && (
                <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center rounded-xl bg-wash-sky px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-wash-sky/25 transition-all hover:bg-wash-sky-dark hover:shadow-wash-sky/35 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Проверяем...
                </>
              ) : (
                "Проверить баланс"
              )}
            </button>
          </form>

          {status === "success" && balance !== null && (
            <div className="mt-6 rounded-2xl bg-wash-sky/10 p-6 text-center">
              <p className="text-sm font-medium text-wash-sky-dark">Баланс карты</p>
              <p className="mt-2 text-4xl font-extrabold text-wash-sky">
                {balance.toLocaleString("ru-KZ")} ₸
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Номер: {phone}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Демо-режим:</span> попробуйте номера{" "}
              <span className="font-mono text-wash-sky-dark">+7 (700) 000-00-00</span>,{" "}
              <span className="font-mono text-wash-sky-dark">+7 (701) 111-11-11</span> или{" "}
              <span className="font-mono text-wash-sky-dark">+7 (707) 222-22-22</span>. В реальной
              версии здесь будет подключение к вашему API.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нужна помощь? Обратитесь к оператору на мойке.
        </p>
      </div>
    </div>
  );
}
