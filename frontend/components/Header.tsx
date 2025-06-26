import { Shield, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-gray-800 bg-opacity-40 p-4 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold tracking-wider text-white">
            FireWatch Algeria
          </h1>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Button
            variant={location.pathname === "/" ? "default" : "ghost"}
            onClick={() => navigate("/")}
            className={`font-mono font-bold ${location.pathname === "/" ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
          >
            <Home className="h-4 w-4 mr-2" />
            DASHBOARD
          </Button>
          <Button
            variant={location.pathname === "/ScrapingControl" ? "default" : "ghost"}
            onClick={() => navigate("/ScrapingControl")}
            className={`font-mono font-bold ${location.pathname === "/ScrapingControl" ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
          >
            <Settings className="h-4 w-4 mr-2" />
            CONTROL
          </Button>
        </nav>
      </div>
    </header>
  );
};
