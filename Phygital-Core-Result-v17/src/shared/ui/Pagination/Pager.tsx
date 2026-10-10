"use client";

export function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹
      </button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((value) => (
        <button
          className={value === page ? "active" : ""}
          onClick={() => onChange(value)}
          key={value}
        >
          {value}
        </button>
      ))}
      <button disabled={page === pages} onClick={() => onChange(page + 1)}>
        ›
      </button>
    </div>
  );
}
