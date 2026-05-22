"use client";

interface Toast {
  id: number;
  message: string;
  active: boolean;
}

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.active ? "active" : ""}`}>
          <div className="w-6 h-6 rounded-full bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center text-xs font-extrabold">
            ✓
          </div>
          <div>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
