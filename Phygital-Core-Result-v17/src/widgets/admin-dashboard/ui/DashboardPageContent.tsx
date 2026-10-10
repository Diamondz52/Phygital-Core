"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  usePlatformStore,
  getStatisticsRange,
  getStatisticsMetrics,
  getStatisticsChart,
  inRange,
  safeDate,
  type Period,
} from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { DataTable } from "@/shared/ui/DataTable";

const labels: Record<Period, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  month: "Месяц",
  year: "Год",
  custom: "Свой период",
};

export function DashboardPageContent() {
  const { state } = usePlatformStore();
  const [period, setPeriod] = useState<Period>("7d"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const range = useMemo(() => getStatisticsRange(period, from, to), [period, from, to]);
  const inside = (value?: string) => inRange(value, range.start, range.end);
  const metrics = useMemo(() => getStatisticsMetrics(state, range), [state, range]);
  const chart = useMemo(() => getStatisticsChart(state, range), [state, range]);
  return (
    <>
      <AdminPageHeader
        title="АДМИН-ПАНЕЛЬ"
        description="Все показатели рассчитаны из фактических локальных данных."
      />
      <div className="periods stats-periods">
        {(Object.keys(labels) as Period[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={key === period ? "active" : ""}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="custom-period glass">
          <label>
            Дата от
            <input
              type="date"
              value={from}
              onInput={(event) => setFrom(event.currentTarget.value)}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            Дата до
            <input
              type="date"
              value={to}
              min={from}
              onInput={(event) => setTo(event.currentTarget.value)}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      )}
      <div className="stats-grid">
        {[
          ["НОВЫЕ ПОЛЬЗОВАТЕЛИ", metrics.users],
          ["СОЗДАННЫЕ КОМАНДЫ", metrics.teams],
          ["ТУРНИРЫ", metrics.tournaments],
          ["ЗАЯВКИ", metrics.applications],
          ["ОДОБРЕНО", metrics.approved],
          ["ПРИГЛАШЕНИЯ", metrics.invitations],
          ["ОБРАЩЕНИЯ", metrics.feedback],
        ].map(([title, value]) => (
          <article className="stat-card glass" key={title}>
            <small>{title}</small>
            <strong>{value}</strong>
            <span>{value === 0 ? "Нет данных за период" : labels[period]}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="chart-card glass">
          <h2>АКТИВНОСТЬ · {labels[period]}</h2>
          {chart.some(
            (item) =>
              item.users || item.teams || item.invitations || item.feedback || item.activity,
          ) ? (
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="statsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a32cff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#a32cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#38204d" />
                <XAxis dataKey="d" stroke="#9d8bac" />
                <YAxis allowDecimals={false} stroke="#9d8bac" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Пользователи"
                  stroke="#9b5cff"
                  fill="url(#statsFill)"
                />
                <Area
                  type="monotone"
                  dataKey="teams"
                  name="Команды"
                  stroke="#ef4fc6"
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="invitations"
                  name="Приглашения"
                  stroke="#48dff0"
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="feedback"
                  name="Обращения"
                  stroke="#d9a3ff"
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="activity"
                  name="Действия"
                  stroke="#69d397"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <b>0 событий</b>
              <p>За выбранный период активности нет.</p>
            </div>
          )}
        </section>
        <aside className="quick glass">
          <h2>БЫСТРЫЕ ДЕЙСТВИЯ</h2>
          <Link className="primary" href="/admin/users">
            Управление пользователями →
          </Link>
          <Link className="primary" href="/admin/tournaments">
            Создать турнир →
          </Link>
          <Link className="primary" href="/admin/teams">
            Управление командами →
          </Link>
          <Link className="secondary" href="/admin/invitations">
            Приглашения →
          </Link>
        </aside>
      </div>
      <section>
        <h2>ПОСЛЕДНИЕ ДЕЙСТВИЯ · {metrics.activity}</h2>
        {state.logs.filter((item) => inside(item.date)).length ? (
          <DataTable
            headers={["Действие", "Объект", "Пользователь", "Дата"]}
            rows={state.logs
              .filter((item) => inside(item.date))
              .slice(0, 7)
              .map((item) => [
                item.action,
                item.details,
                item.admin,
                safeDate(item.date)?.toLocaleString("ru-RU") ?? item.date,
              ])}
          />
        ) : (
          <div className="admin-empty glass">
            <p>За выбранный период действий нет.</p>
          </div>
        )}
      </section>
    </>
  );
}
