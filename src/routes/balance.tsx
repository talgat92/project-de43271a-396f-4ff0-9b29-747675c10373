import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatPhone, isValidPhone, normalizePhoneDigits } from "@/lib/phone";
import { getCardsByPhone, type Card } from "@/lib/jahan.functions";

export const Route = createFileRoute("/balance")({
  head: () => ({
    meta: [
      { title: "Проверка баланса — JAHAN" },
      { name: "description", content: "Проверьте баланс клубной карты JAHAN по номеру телефона." },
      { property: "og:title", content: "Проверка баланса — JAHAN" },
      { property: "og:description", content: "Проверьте баланс клубной карты JAHAN по номеру телефона." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BalancePage,
});

function BalancePage() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [cards, setCards] = useState<Card[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    if (status !== "idle") {
      setStatus("idle");
      setCards([]);
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
    setCards([]);
    setErrorMessage("");

    try {
      const found = await getCardsByPhone(normalizePhoneDigits(phone));
      if (found.length === 0) {
        setStatus("error");
        setErrorMessage("Карта по этому номеру не найдена. Проверьте номер или обратитесь на мойку.");
        return;
      }
      setCards(found);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Не удалось связаться с сервером. Попробуйте позже.");
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
              {status === "error" && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center rounded-xl bg-wash-sky px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-wash-sky/25 transition-all hover:bg-wash-sky-dark hover:shadow-wash-sky/35 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Проверяем..." : "Проверить баланс"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-6 space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="rounded-2xl bg-wash-sky/10 p-6 text-center">
                  <p className="text-sm font-medium text-wash-sky-dark">
                    {card.name || "Клубная карта"}
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-wash-sky">
                    {Number(card.balance).toLocaleString("ru-KZ")} ₸
                  </p>
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    UID: {card.card_uid}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нужна помощь? Обратитесь к оператору на мойке.
        </p>
      </div>
    </div>
  );
}
