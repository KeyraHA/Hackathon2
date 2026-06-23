import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { operator, logout } = useAuth();

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-green-900 bg-gray-900 px-6 py-3">
        <span className="text-lg font-bold tracking-widest text-green-400">
          🐾 TropelCare Control Room
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/dashboard" className={({ isActive }) =>
            isActive ? "text-green-400 underline" : "text-gray-400 hover:text-white"
          }>Dashboard</NavLink>
          <NavLink to="/tropels" className={({ isActive }) =>
            isActive ? "text-green-400 underline" : "text-gray-400 hover:text-white"
          }>Tropeles</NavLink>
          <NavLink to="/signals" className={({ isActive }) =>
            isActive ? "text-green-400 underline" : "text-gray-400 hover:text-white"
          }>Señales</NavLink>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500 text-xs">{operator?.email}</span>
          <button
            onClick={logout}
            className="rounded border border-red-800 px-3 py-1 text-red-400 hover:bg-red-900/30 text-sm"
          >
            Salir
          </button>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}