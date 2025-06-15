
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-amber-400">404</h1>
        <p className="text-xl text-slate-300 mb-6">Oops! Página não encontrada</p>
        <Button 
          onClick={() => window.location.href = "/"}
          className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-semibold px-6 py-3"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
