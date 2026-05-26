"use client";

import { useEffect, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

type Note = {
  id: string;
  author_email: string;
  body: string;
  created_at: string;
};

type Props = {
  provider: string;
  accountId: string;
};

function formatKstDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function CustomerNotes({ provider, accountId }: Props) {
  const base = `/api/admin/customers/${encodeURIComponent(provider)}/${encodeURIComponent(accountId)}/notes`;

  const [notes, setNotes] = useState<Note[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(base, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        setError("메모를 불러오지 못했습니다.");
        return;
      }
      const data = (await response.json()) as { notes: Note[] };
      setNotes(data.notes);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, accountId]);

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.trim().length < 2) {
      setError("메모는 2자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(base, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "권한이 만료되었습니다." : "메모 작성에 실패했습니다.");
        return;
      }
      setDraft("");
      await reload();
    } catch {
      setError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async (reason: string) => {
    if (!deleteTarget) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${base}/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        setError("삭제에 실패했습니다.");
        return;
      }
      await reload();
    } catch {
      setError("네트워크 오류");
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-cream/80">운영자 메모 (CRM)</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
          {notes === null ? "..." : `${notes.length}건`}
        </span>
      </div>

      <form onSubmit={submitNote} className="mb-3 grid gap-2 rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="이 고객과의 통화 / 메일 / 특이사항을 기록하세요. 모든 작성·삭제는 감사 로그에 남습니다."
          disabled={submitting}
          className="rounded-xl border border-cream/15 bg-black/40 px-3 py-2 text-xs text-cream outline-none focus:border-[#D97757] disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-cream/40">
            {draft.trim().length}/2000자 · 최소 2자
          </span>
          <button
            type="submit"
            disabled={submitting || draft.trim().length < 2}
            className="rounded-full bg-[#D97757] px-4 py-1.5 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "메모 추가"}
          </button>
        </div>
        {error ? (
          <p className="rounded-xl border border-[#D97757]/30 bg-[#D97757]/10 px-3 py-2 text-[10px] text-[#F0E2D2]">
            {error}
          </p>
        ) : null}
      </form>

      {loading && notes === null ? (
        <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
          불러오는 중...
        </p>
      ) : notes && notes.length === 0 ? (
        <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
          작성된 메모가 없습니다.
        </p>
      ) : (
        <ul className="grid gap-2">
          {(notes || []).map((note) => (
            <li key={note.id} className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-3 text-[11px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] text-cream/55">{note.author_email}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-cream/40">
                    {formatKstDateTime(note.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(note)}
                    disabled={submitting}
                    className="rounded-full border border-[#D97757]/30 px-2 py-0.5 text-[9px] font-bold text-[#F0E2D2] transition hover:border-[#D97757] disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-cream/85">{note.body}</p>
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="운영자 메모 삭제"
        message={
          deleteTarget
            ? `이 메모를 삭제합니다. 소프트 삭제이므로 DB 레코드는 보존되지만 콘솔에서는 더 이상 노출되지 않습니다. 사유는 감사 로그에 기록됩니다.\n\n"${deleteTarget.body.slice(0, 80)}${
                deleteTarget.body.length > 80 ? "..." : ""
              }"`
            : ""
        }
        confirmPhrase="DELETE_NOTE"
        onConfirm={performDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
