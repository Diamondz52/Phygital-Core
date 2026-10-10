import Link from "next/link";
export default function NotFound() {
  return (
    <main className="forbidden">
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link className="primary" href="/">
        Вернуться на главную
      </Link>
    </main>
  );
}
