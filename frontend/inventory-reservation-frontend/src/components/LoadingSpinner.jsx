import { LoaderCircle } from "lucide-react";

const LoadingSpinner = ({
  message = "Loading...",
  fullPage = false,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${
        fullPage ? "min-h-[60vh]" : "py-12"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
        <LoaderCircle
          size={28}
          className="animate-spin text-indigo-600"
        />
      </div>

      <p className="text-sm font-medium text-slate-500">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;