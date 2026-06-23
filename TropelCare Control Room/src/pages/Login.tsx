import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [teamCode, setTeamCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(teamCode, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-green-800 bg-gray-900 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-widest text-green-400">
          🐾 TropelCare
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-900/50 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs text-green-600">TEAM CODE</label>
          <input
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-green-600">EMAIL</label>
          <input
            type="email"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-xs text-green-600">PASSWORD</label>
          <input
            type="password"
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? "Conectando..." : "Encender consola"}
        </button>
      </form>
    </div>
  );
}