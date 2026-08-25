import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CreditCard,
  Plus,
  QrCode,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  createCard,
  deleteCard,
  getAllCards,
  getBayStats,
  type Card as CardType,
} from "@/lib/api";
import { formatPhone, normalizePhoneDigits } from "@/lib/phone";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Панель управления — JAHAN" },
      { name: "description", content: "Админ-панель мойки JAHAN: клубные карты, доходы по боксам, Kaspi и наличные." },
      { property: "og:title", content: "Панель управления — JAHAN" },
      { property: "og:description", content: "Админ-панель мойки JAHAN: клубные карты, доходы по боксам, Kaspi и наличные." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const money = (n: number) => Number(n || 0).toLocaleString("ru-KZ") + " ₸";

function AdminPage() {
  const qc = useQueryClient();
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: getAllCards });
  const { data: bays = [] } = useQuery({ queryKey: ["bay-stats"], queryFn: getBayStats });

  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", card_uid: "", balance: "" });

  const addCard = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      setForm({ name: "", phone: "", card_uid: "", balance: "" });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });

  const removeCard = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    const digits = q.replace(/\D/g, "");
    return cards.filter(
      (c: CardType) =>
        c.name.toLowerCase().includes(q) ||
        c.card_uid.toLowerCase().includes(q) ||
        (digits.length > 0 && c.phone.includes(digits)),
    );
  }, [cards, query]);

  const totalBalance = cards.reduce((s: number, c: CardType) => s + Number(c.balance || 0), 0);
  const topCards = [...cards]
    .sort((a, b) => (b.topups_count ?? 0) - (a.topups_count ?? 0))
    .slice(0, 5);

  const dayKaspi = bays.reduce((s, b) => s + b.day_kaspi, 0);
  const dayCash = bays.reduce((s, b) => s + b.day_cash, 0);
  const monthTotal = bays.reduce((s, b) => s + b.month_total, 0);

  const chartData = bays.map((b) => ({
    name: `Бокс ${b.bay_id}`,
    Kaspi: b.day_kaspi,
    Наличные: b.day_cash,
  }));
  const pieData = [
    { name: "Kaspi QR", value: dayKaspi, color: "#0EA5E9" },
    { name: "Наличные", value: dayCash, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Панель управления JAHAN</h1>
            <p className="mt-1 text-sm text-slate-400">
              Клубные карты, доходы по боксам и разбивка по способам оплаты
            </p>
          </div>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
            cars-wash.kz/api
          </span>
        </header>

        {/* KPI */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<CreditCard className="h-5 w-5" />} label="Всего карт" value={String(cards.length)} />
          <Kpi icon={<Wallet className="h-5 w-5" />} label="Баланс у клиентов" value={money(totalBalance)} />
          <Kpi icon={<QrCode className="h-5 w-5" />} label="Kaspi за сегодня" value={money(dayKaspi)} />
          <Kpi icon={<Banknote className="h-5 w-5" />} label="Наличные за сегодня" value={money(dayCash)} />
        </section>

        {/* Charts */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-200">Доход за день по боксам</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="Kaspi" stackId="a" fill="#0EA5E9" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Наличные" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Структура оплат сегодня</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm text-slate-400">
              Доход за месяц: <span className="font-semibold text-slate-100">{money(monthTotal)}</span>
            </p>
          </div>
        </section>

        {/* Bays */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bays.map((b) => (
            <div key={b.bay_id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Бокс {b.bay_id}</h3>
                <TrendingUp className="h-4 w-4 text-sky-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-sky-400">{money(b.day_total)}</p>
              <p className="text-xs text-slate-400">за сегодня</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-sky-500/10 p-2 text-sky-300">Kaspi: {money(b.day_kaspi)}</div>
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300">Нал.: {money(b.day_cash)}</div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                За месяц: <span className="font-medium text-slate-200">{money(b.month_total)}</span>
              </p>
            </div>
          ))}
        </section>

        {/* Add card + top cards */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <form
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              addCard.mutate({
                name: form.name.trim(),
                phone: normalizePhoneDigits(form.phone),
                card_uid: form.card_uid.trim().toUpperCase(),
                balance: Number(form.balance) || 0,
              });
            }}
          >
            <h2 className="text-sm font-semibold text-slate-200">Добавить карту</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Имя" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field
                label="Телефон"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: formatPhone(v) })}
                placeholder="+7 (700) 000-00-00"
                required
              />
              <Field
                label="UID карты"
                value={form.card_uid}
                onChange={(v) => setForm({ ...form, card_uid: v })}
                placeholder="04A2B1C3"
                required
              />
              <Field
                label="Начальный баланс, ₸"
                value={form.balance}
                onChange={(v) => setForm({ ...form, balance: v.replace(/\D/g, "") })}
                placeholder="0"
              />
            </div>
            <button
              type="submit"
              disabled={addCard.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {addCard.isPending ? "Сохраняем..." : "Добавить карту"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Топ карт по пополнениям</h2>
            <ul className="mt-4 space-y-3">
              {topCards.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs">
                      {i + 1}
                    </span>
                    {c.name || c.card_uid}
                  </span>
                  <span className="font-semibold text-sky-400">{c.topups_count ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cards table */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">Выпущенные карты</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: телефон, имя или UID"
                className="w-64 rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Имя</th>
                  <th className="py-2 pr-4">Телефон</th>
                  <th className="py-2 pr-4">UID</th>
                  <th className="py-2 pr-4">Баланс</th>
                  <th className="py-2 pr-4">Создана</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: CardType) => (
                  <tr key={c.id} className="border-t border-slate-800/80">
                    <td className="py-3 pr-4">{c.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatPhone(c.phone)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400">{c.card_uid}</td>
                    <td className="py-3 pr-4 font-semibold text-sky-400">{money(c.balance)}</td>
                    <td className="py-3 pr-4 text-slate-400">{String(c.created_at).slice(0, 10)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => removeCard.mutate(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Удалить
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Ничего не найдено
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500"
      />
    </label>
  );
}
