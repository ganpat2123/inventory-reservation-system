import { AlertCircle, X } from "lucide-react";

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          size={20}
          className="mt-0.5 shrink-0 text-rose-600"
        />

        <div>
          <p className="text-sm font-bold text-rose-800">
            Something went wrong
          </p>

          <p className="mt-1 text-sm leading-6 text-rose-700">
            {message}
          </p>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss error"
          className="shrink-0 rounded-lg p-1 text-rose-500 transition hover:bg-rose-100"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;