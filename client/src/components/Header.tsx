import React from 'react';
import { Link } from 'wouter';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 px-6 py-4">
      <nav className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-semibold">Portico Netzwerk</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-primary hover:text-secondary transition-colors">
            Dashboard
          </Link>
          <Link href="/" className="text-primary hover:text-secondary transition-colors">
            Netzwerk
          </Link>
          <Link href="/" className="text-primary hover:text-secondary transition-colors">
            Kontakte
          </Link>
          <Link href="/" className="text-primary hover:text-secondary transition-colors">
            Einstellungen
          </Link>
        </div>
        
        <button 
          className="block md:hidden p-2 rounded-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {isMobileMenuOpen && (
          <div className="w-full md:hidden mt-4">
            <div className="flex flex-col space-y-3 p-2 bg-white bg-opacity-90 rounded-lg">
              <Link 
                href="/" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Netzwerk
              </Link>
              <Link 
                href="/" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kontakte
              </Link>
              <Link 
                href="/" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Einstellungen
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
