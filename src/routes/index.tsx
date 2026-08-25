import { createFileRoute, Link } from "@tanstack/react-router";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JAHAN — Мойка самообслуживания" },
      { name: "description", content: "Современная мойка самообслуживания в Таразе. Проверьте баланс клубной карты JAHAN и мойте автомобиль выгодно." },
      { property: "og:title", content: "JAHAN — Мойка самообслуживания" },
      { property: "og:description", content: "Современная мойка самообслуживания в Таразе. Проверьте баланс клубной карты JAHAN и мойте автомобиль выгодно." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-wash-foam px-4 pb-20 pt-16 sm:pt-24">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-wash-sky-light blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-wash-sky/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-wash-sky/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-wash-sky-dark backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wash-sky opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-wash-sky" />
            </span>
            <div className="flex flex-col text-left">
              <span>Работаем 24/7</span>
              <span className="text-xs opacity-80">наш адрес г.Тараз</span>
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Мойка самообслуживания
            <span className="block text-wash-sky uppercase tracking-wider">JAHAN</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Современное оборудование, чистая вода и удобная клубная карта. Мойте автомобиль быстро,
            экономьте время и деньги.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/balance"
              className="inline-flex items-center justify-center rounded-xl bg-wash-sky px-8 py-4 text-base font-semibold text-white shadow-lg shadow-wash-sky/25 transition-all hover:bg-wash-sky-dark hover:shadow-wash-sky/35"
            >
              Проверить баланс карты
            </Link>
            <Link
              to="/popolnenie"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Пополнить карту
            </Link>
          </div>
        </div>
      </section>


      {/* Features */}

      <section id="features" className="bg-background px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Почему выбирают нас
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Всё для комфортной и быстрой мойки вашего автомобиля
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<DropIcon />}
              title="Чистая вода"
              description="Многоступенчатая фильтрация и качественная химия для бережного ухода за кузовом."
            />
            <FeatureCard
              icon={<CardIcon />}
              title="Клубная карта"
              description="Пополняйте баланс и оплачивайте мойку по номеру телефона — быстро и без наличных."
            />
            <FeatureCard
              icon={<ClockIcon />}
              title="Круглосуточно"
              description="Мойка работает 24 часа в сутки, 7 дней в неделю. Приезжайте в удобное время."
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="Бережная химия"
              description="Используем средства, безопасные для лакокрасочного покрытия и стёкол."
            />
            <FeatureCard
              icon={<PhoneIcon />}
              title="Проверка баланса"
              description="Узнайте остаток средств на клубной карте за несколько секунд через сайт."
            />
            <FeatureCard
              icon={<SparklesIcon />}
              title="Современное оборудование"
              description="Новые посты с удобным управлением и мощным напором для качественной мойки."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-wash-sky px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Уже есть клубная карта?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Проверьте баланс прямо сейчас — просто введите номер телефона.
          </p>
          <Link
            to="/balance"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-wash-sky-dark shadow-lg transition-all hover:bg-wash-foam"
          >
            Проверить баланс
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} JAHAN — Мойка самообслуживания
          </p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Главная
            </Link>
            <Link to="/balance" className="text-sm text-muted-foreground hover:text-foreground">
              Проверка баланса
            </Link>
            <Link to="/popolnenie" className="text-sm text-muted-foreground hover:text-foreground">
              Пополнение
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


function DropIcon() {

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-6.5C14.5 6.8 13 4 12 2 11 4 9.5 6.8 8 8.5 6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
