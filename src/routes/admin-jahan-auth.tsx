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
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { BUILDINGS, TXN_TYPES } from "@/config";
import {
  adjustBalance,
  adminLogin,
  createCard,
  deleteCard,
  getBayStates,
  getLiveEvents,
  getTransactions,
  searchCards,
  type Card,
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

const PAGE_BG =
  "min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#1e3a8a_0%,transparent_60%),radial-gradient(1000px_500px_at_110%_10%,#0e7490_0%,transparent_55%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)] text-slate-100";
const PANEL = "rounded-2xl border border-sky-500/20 bg-slate-900/70 shadow-[0_0_40px_-20px_rgba(56,189,248,0.6)] backdrop-blur";
const ACCENT_BTN =
  "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 shadow-[0_8px_24px_-10px_rgba(56,189,248,0.9)] transition hover:from-sky-300 hover:to-cyan-200";

function AdminPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPw(sessionStorage.getItem(KEY));
    setHydrated(true);
  }, []);

  if (!hydrated) return <div className={PAGE_BG} />;
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
    <div className={`${PAGE_BG} flex items-center justify-center px-4`}>
      <form
        className={`${PANEL} w-full max-w-sm p-7`}
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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-950">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Служебный доступ</h1>
        <p className="mt-1 text-sm text-slate-400">Введите пароль администратора JAHAN</p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
          placeholder="••••••••"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button disabled={loading} className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${ACCENT_BTN}`}>
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
  const [cardsOpen, setCardsOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);

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
    <div className={PAGE_BG}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              Панель JAHAN
            </h1>
            <p className="mt-1 text-sm text-slate-400">12 постов · 2 здания · Kaspi QR + MQTT</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </header>

        {/* Переключатель зданий */}
        <div className="mt-6 inline-flex rounded-2xl border border-sky-500/20 bg-slate-900/70 p-1">
          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBuilding(b.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                building === b.id ? ACCENT_BTN : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Building2 className="h-4 w-4" />
              {b.name} ({b.short})
            </button>
          ))}
        </div>

        {/* Клубные карты + инкассация */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCardsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(217,70,239,0.9)] transition hover:from-fuchsia-400 hover:to-violet-400"
          >
            <CreditCard className="h-4 w-4" /> Клубные карты
          </button>
          <button
            onClick={() => setCashOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-12px_rgba(245,158,11,0.9)] transition hover:from-amber-400 hover:to-orange-300"
          >
            <Banknote className="h-4 w-4" /> Снять наличные
          </button>
        </div>

        {/* KPI */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Activity className="h-5 w-5" />} tone="from-emerald-400 to-teal-300" label="Активных постов" value={`${activeBays} / ${current.bays.length}`} />
          <Kpi icon={<Wallet className="h-5 w-5" />} tone="from-sky-400 to-cyan-300" label="Выручка за день" value={money(dayTotal)} />
          <Kpi icon={<CreditCard className="h-5 w-5" />} tone="from-fuchsia-400 to-violet-400" label="Kaspi за день" value={money(dayKaspi)} />
          <Kpi icon={<Banknote className="h-5 w-5" />} tone="from-amber-400 to-orange-300" label="Наличные за день" value={money(dayCash)} />
        </section>

        {/* Посты + live-лента */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className={`${PANEL} p-5 lg:col-span-2`}>
            <h2 className="text-sm font-semibold text-slate-200">Состояние постов — {current.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {bayList.map((b) => (
                <div
                  key={b.bay_id}
                  className={`rounded-xl border p-4 transition ${
                    b.busy
                      ? "border-emerald-400/40 bg-emerald-500/10"
                      : "border-slate-700/70 bg-slate-950/60 hover:border-sky-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Пост {b.bay_id}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                        b.busy ? "bg-emerald-400/20 text-emerald-200" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${b.busy ? "animate-pulse bg-emerald-300" : "bg-slate-600"}`} />
                      {b.busy ? "Мойка идёт" : "Свободен"}
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-cyan-300">{money(b.day_total)}</p>
                  <p className="text-xs text-slate-500">за сегодня · Kaspi {money(b.day_kaspi)}</p>
                </div>
              ))}
              {bayList.length === 0 && <p className="text-sm text-slate-500">Нет данных по постам.</p>}
            </div>
          </div>

          <div className={`${PANEL} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <RadioTower className="h-4 w-4 text-cyan-300" /> Живые платежи Kaspi
            </h2>
            <p className="mt-1 text-xs text-slate-500">Обновление каждые 4 сек · topic carwash/bay_N/pay</p>
            <ul className="mt-4 space-y-2">
              {liveEvents.map((e) => (
                <li key={e.txn_id + e.created_at} className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Zap className="h-3.5 w-3.5 text-amber-300" /> Пост {e.bay_id}
                    </span>
                    <span className="font-semibold text-cyan-300">{money(e.amount)}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{e.topic}</p>
                  <p className="font-mono text-[11px] text-slate-600">{e.txn_id}</p>
                </li>
              ))}
              {liveEvents.length === 0 && (
                <li className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
                  Ожидание платежей…
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Транзакции */}
        <section className={`${PANEL} mt-6 p-5`}>
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
                    txnType === t.value ? ACCENT_BTN : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                    <td className="py-3 font-semibold text-cyan-300">{money(t.amount)}</td>
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

      {cardsOpen && (
        <CardsModal
          password={password}
          query={query}
          setQuery={setQuery}
          cards={cards.data ?? []}
          loading={cards.isLoading}
          refetch={() => cards.refetch()}
          onClose={() => setCardsOpen(false)}
        />
      )}
    </div>
  );
}

function CardsModal({
  password,
  query,
  setQuery,
  cards,
  loading,
  refetch,
  onClose,
}: {
  password: string;
  query: string;
  setQuery: (v: string) => void;
  cards: Card[];
  loading: boolean;
  refetch: () => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<Card | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ card_uid: "", name: "", phone: "", balance: "" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.card_uid || !form.name || !form.phone) {
      setError("Заполните UID, имя и телефон");
      return;
    }
    setBusy(true);
    try {
      await createCard({
        data: {
          password,
          card_uid: form.card_uid,
          name: form.name,
          phone: form.phone,
          balance: Number(form.balance) || 0,
        },
      });
      setForm({ card_uid: "", name: "", phone: "", balance: "" });
      refetch();
    } catch {
      setError("Не удалось добавить карту");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteCard({ data: { password, card_uid: pending.card_uid } });
      setPending(null);
      refetch();
    } catch {
      setError("Не удалось удалить карту");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Клубные карты"
        className={`${PANEL} my-8 w-full max-w-3xl p-6`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-lg font-bold text-transparent">
              Клубные карты
            </h2>
            <p className="mt-1 text-xs text-slate-400">Добавление, поиск, коррекция баланса и удаление RFID-карт</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Форма добавления */}
        <form onSubmit={submit} className="mt-5 grid gap-2 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-4 sm:grid-cols-5">
          <input
            value={form.card_uid}
            onChange={(e) => setForm({ ...form, card_uid: e.target.value.toUpperCase() })}
            placeholder="card_uid"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-xs outline-none focus:border-fuchsia-400"
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Имя"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-fuchsia-400"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
            placeholder="77001234567"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-fuchsia-400"
          />
          <input
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value.replace(/\D/g, "") })}
            placeholder="Баланс ₸"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-fuchsia-400"
          />
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:from-fuchsia-400 hover:to-violet-400 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Добавить
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {/* Поиск */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: card_uid, имя, телефон"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-sky-400"
          />
        </div>

        {/* Список */}
        <div className="mt-4 max-h-[45vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">card_uid</th>
                <th className="py-2 pr-4">Имя</th>
                <th className="py-2 pr-4">Телефон</th>
                <th className="py-2 pr-4">Баланс</th>
                <th className="py-2 pr-4">Коррекция</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.card_uid} className="border-t border-slate-800/80">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">{c.card_uid}</td>
                  <td className="py-3 pr-4">{c.name}</td>
                  <td className="py-3 pr-4 text-slate-300">{formatPhone(c.phone)}</td>
                  <td className="py-3 pr-4 font-semibold text-cyan-300">{money(c.balance)}</td>
                  <td className="py-3 pr-4">
                    <BalanceAdjuster password={password} cardUid={c.card_uid} onDone={refetch} />
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setPending(c)}
                      aria-label={`Удалить карту ${c.card_uid}`}
                      className="rounded-lg bg-red-500/15 p-1.5 text-red-300 transition hover:bg-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    {loading ? "Загрузка…" : "Ничего не найдено"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
          <div className={`${PANEL} w-full max-w-sm p-6`}>
            <h3 className="text-base font-bold text-slate-100">Удалить карту?</h3>
            <p className="mt-2 text-sm text-slate-400">
              Вы действительно хотите удалить карту{" "}
              <span className="font-mono text-slate-200">{pending.card_uid}</span> ({pending.name})? Действие
              необратимо.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                disabled={busy}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {busy ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
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
        className="w-20 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs outline-none focus:border-sky-400"
      />
      <button
        disabled={busy}
        onClick={() => apply(1)}
        aria-label="Пополнить"
        className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300 transition hover:bg-emerald-500/35 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        disabled={busy}
        onClick={() => apply(-1)}
        aria-label="Списать"
        className="rounded-lg bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/35 disabled:opacity-50"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={`${PANEL} p-5`}>
      <div className="flex items-center gap-2 text-slate-400">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${tone} text-slate-950`}>
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-50">{value}</p>
    </div>
  );
}
