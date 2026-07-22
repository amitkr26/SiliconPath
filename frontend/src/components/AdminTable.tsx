import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  className?: string;
}

export default function AdminTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "No records found.",
  className = "",
}: AdminTableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[var(--border)] ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--text-tertiary)] text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-[var(--text)] ${col.className ?? ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
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
