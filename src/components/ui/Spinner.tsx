// src/components/ui/Spinner.tsx
export default function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );
}
