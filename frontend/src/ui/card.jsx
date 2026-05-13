export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-900 border-slate-800 rounded-xl shadow-md p-6 ${className}`}
    >
      {children}
    </div>
  );
}
