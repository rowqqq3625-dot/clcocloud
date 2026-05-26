import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function AdminDataTable<T extends Record<string, unknown>>({ columns, rows, emptyMessage }: Props<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-[#15140F] text-xs uppercase tracking-[0.16em] text-cream/40">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3 font-mono">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream/5">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-cream/40">
                {emptyMessage || "표시할 데이터가 없습니다."}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="text-cream/85">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 align-top">
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
