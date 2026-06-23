import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute() {
  const { operator, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <span className="animate-pulse text-green-400 text-lg">Iniciando consola...</span>
      </div>
    );
  }

  return operator ? <Outlet /> : <Navigate to="/login" replace />;
}