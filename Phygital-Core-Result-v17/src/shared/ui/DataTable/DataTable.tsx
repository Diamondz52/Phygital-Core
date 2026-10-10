"use client";

import { type ReactNode } from "react";
export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="data-table glass">
      <div className="table-row table-head">
        {headers.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div className="table-row" key={i}>
          {r.map((c, j) => (
            <span key={j}>{c}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
