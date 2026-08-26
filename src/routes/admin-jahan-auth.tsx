import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Banknote,
  Building2,
  CreditCard,
  Lock,
  LogOut,
  Minus,
  Plus,
  RadioTower,
  Search,
  Wallet,
  Zap,
} from "lucide-react";

import { BUILDINGS, TXN_TYPES } from "@/config";
import {
  adjustBalance,
  adminLogin,
  getBayStates,
  getLiveEvents,
  getTransactions,
  searchCards,
} from "@/lib/jahan.functions";
import { formatPhone } from "@/lib/phone";

export const Route = createFileRoute("/admin-jahan-auth")({
  head: () => ({
    meta: [
      { title: "Служебная панель — JAHAN" },
      { name: "description", content: "Служебный доступ. Управление постами, картами и транзакциями мойки JAHAN." },
      { property: "og:title", content: "Служебная панель — JAHAN" },
      { property: "og:description", content: "Служебный доступ мойки JAHAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const KEY = "jahan_admin_pw";
const money = (n: number) => Number(n || 0).toLocaleString("ru-KZ") + " ₸";

function AdminPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPw(sessionStorage.getItem(KEY));
    setHydrated(true);
  }, []);

  if (!hydrated) return <div className="min-h-screen bg-slate-950" />;
  if (!pw) return <LoginScreen onSuccess={setPw} />;
  return (
    <Dashboard
      password={pw}
      onLogout={() => {
        sessionStorage.removeItem(KEY);
        setPw(null);
      }}
    />
  );
}

function LoginScreen({ onSuccess }: { onSuccess: (pw: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-7"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          try {
            const res = await adminLogin({ data: { password: value } });
            if (res.ok) {
              sessionStorage.setItem(KEY, value);
              onSuccess(value);
            } else setError("Неверный пароль");
          } catch {
            setError("Ошибка соединения");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Служебный доступ</h1>
        <p className="mt-1 text-sm text-slate-400">Введите пароль администратора JAHAN</p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          className="mt-5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
          placeholder="••••••••"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? "Проверяем..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [building, setBuilding] = useState<1 | 2>(1);
  const [txnType, setTxnType] = useState<string>("all");
  const [query, setQuery] = useState("");

  const bays = useQuery({
    queryKey: ["bays"],
    queryFn: () => getBayStates({ data: { password } }),
    refetchInterval: 5000,
  });
  const events = useQuery({
    queryKey: ["events"],
    queryFn: () => getLiveEvents({ data: { password } }),
    refetchInterval: 4000,
  });
  const txns = useQuery({
    queryKey: ["txns", building, txnType],
    queryFn: () => getTransactions({ data: { password, building, type: txnType } }),
    refetchInterval: 15000,
  });
  const cards = useQuery({
    queryKey: ["cards", query],
    queryFn: () => searchCards({ data: { password, q: query } }),
  });

  const current = BUILDINGS.find((b) => b.id === building)!;
  const bayList = useMemo(
    () => (bays.data ?? []).filter((b) => current.bays.includes(b.bay_id)),
    [bays.data, current],
  );
  const liveEvents = (events.data ?? []).filter((e) => e.building === building);

  const dayTotal = bayList.reduce((s, b) => s + b.day_total, 0);
  const dayKaspi = bayList.reduce((s, b) => s + b.day_kaspi, 0);
  const dayCash = bayList.reduce((s, b) => s + b.day_cash, 0);
  const activeBays = bayList.filter((b) => b.busy).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Панель JAHAN</h1>
            <p className="mt-1 text-sm text-slate-400">12 постов · 2 здания · Kaspi QR + MQTT</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </header>

        {/* Переключатель зданий */}
        <div className="mt-6 inline-flex rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBuilding(b.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                building === b.id ? "bg-sky-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Building2 className="h-4 w-4" />
              {b.name} ({b.short})
            </button>
          ))}
        </div>

        {/* KPI */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Activity className="h-5 w-5" />} label="Активных постов" value={`${activeBays} / ${current.bays.length}`} />
          <Kpi icon={<Wallet className="h-5 w-5" />} label="Выручка за день" value={money(dayTotal)} />
          <Kpi icon={<CreditCard className="h-5 w-5" />} label="Kaspi за день" value={money(dayKaspi)} />
          <Kpi icon={<Banknote className="h-5 w-5" />} label="Наличные за день" value={money(dayCash)} />
        </section>

        {/* Посты + live-лента */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-200">Состояние постов — {current.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {bayList.map((b) => (
                <div key={b.bay_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Пост {b.bay_id}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                        b.busy ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${b.busy ? "bg-emerald-400" : "bg-slate-600"}`} />
                      {b.busy ? "Мойка идёт" : "Свободен"}
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-sky-400">{money(b.day_total)}</p>
                  <p className="text-xs text-slate-500">за сегодня · Kaspi {money(b.day_kaspi)}</p>
                </div>
              ))}
              {bayList.length === 0 && <p className="text-sm text-slate-500">Нет данных по постам.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <RadioTower className="h-4 w-4 text-sky-400" /> Живые платежи Kaspi
            </h2>
            <p className="mt-1 text-xs text-slate-500">Обновление каждые 4 сек · topic carwash/bay_N/pay</p>
            <ul className="mt-4 space-y-2">
              {liveEvents.map((e) => (
                <li key={e.txn_id + e.created_at} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Zap className="h-3.5 w-3.5 text-amber-400" /> Пост {e.bay_id}
                    </span>
                    <span className="font-semibold text-sky-400">{money(e.amount)}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{e.topic}</p>
                  <p className="font-mono text-[11px] text-slate-600">{e.txn_id}</p>
                </li>
              ))}
              {liveEvents.length === 0 && (
                <li className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                  Ожидание платежей…
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Карты */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">RFID-карты</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: card_uid, имя, телефон"
                className="w-full min-w-56 rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-sky-500 sm:w-72"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">card_uid</th>
                  <th className="py-2 pr-4">Имя</th>
                  <th className="py-2 pr-4">Телефон</th>
                  <th className="py-2 pr-4">Баланс</th>
                  <th className="py-2">Коррекция</th>
                </tr>
              </thead>
              <tbody>
                {(cards.data ?? []).map((c) => (
                  <tr key={c.card_uid} className="border-t border-slate-800/80">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400">{c.card_uid}</td>
                    <td className="py-3 pr-4">{c.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatPhone(c.phone)}</td>
                    <td className="py-3 pr-4 font-semibold text-sky-400">{money(c.balance)}</td>
                    <td className="py-3">
                      <BalanceAdjuster
                        password={password}
                        cardUid={c.card_uid}
                        onDone={() => cards.refetch()}
                      />
                    </td>
                  </tr>
                ))}
                {(cards.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Ничего не найдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Транзакции */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Транзакции — {current.name} ({current.short})
            </h2>
            <div className="flex flex-wrap gap-2">
              {[{ value: "all", label: "Все" }, ...TXN_TYPES].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTxnType(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    txnType === t.value ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Время</th>
                  <th className="py-2 pr-4">Пост</th>
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Карта</th>
                  <th className="py-2 pr-4">txn_id</th>
                  <th className="py-2">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {(txns.data ?? []).map((t) => (
                  <tr key={`${t.id}-${t.txn_id}`} className="border-t border-slate-800/80">
                    <td className="py-3 pr-4 text-slate-400">{String(t.created_at).slice(0, 19)}</td>
                    <td className="py-3 pr-4">{t.bay_id}</td>
                    <td className="py-3 pr-4 text-slate-300">
                      {TXN_TYPES.find((x) => x.value === t.type)?.label ?? t.type}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{t.card_uid ?? "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{t.txn_id ?? "—"}</td>
                    <td className="py-3 font-semibold text-sky-400">{money(t.amount)}</td>
                  </tr>
                ))}
                {(txns.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Транзакций нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function BalanceAdjuster({
  password,
  cardUid,
  onDone,
}: {
  password: string;
  cardUid: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async (sign: 1 | -1) => {
    const value = Number(amount);
    if (!value) return;
    setBusy(true);
    try {
      await adjustBalance({ data: { password, card_uid: cardUid, delta: sign * value } });
      setAmount("");
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
        placeholder="₸"
        className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs outline-none focus:border-sky-500"
      />
      <button
        disabled={busy}
        onClick={() => apply(1)}
        aria-label="Пополнить"
        className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        disabled={busy}
        onClick={() => apply(-1)}
        aria-label="Списать"
        className="rounded-lg bg-red-500/15 p-1.5 text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-sky-400">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-50">{value}</p>
    </div>
  );
}
