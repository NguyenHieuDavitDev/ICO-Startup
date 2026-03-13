import { useEffect } from "react";

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container-custom">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icon = toast.type === "success"
    ? "fa-check-circle"
    : toast.type === "error"
    ? "fa-times-circle"
    : "fa-info-circle";

  return (
    <div className={`toast-custom ${toast.type}`}>
      <i className={`fas ${icon}`}></i>
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}
