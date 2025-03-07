import React from 'react';
import { Link } from 'wouter';
import { Menu } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="text-xl font-bold hover:text-primary transition-colors">
            Infinity Gaming
          </a>
        </Link>

        <nav className="hidden md:flex space-x-6">
          <Link href="/customer/portal">
            <a className="text-sm hover:text-primary transition-colors">Customer Portal</a>
          </Link>
          <Link href="/staff/login">
            <a className="text-sm hover:text-primary transition-colors">Staff Login</a>
          </Link>
          <Link href="/pos/dashboard">
            <a className="text-sm hover:text-primary transition-colors">POS Dashboard</a>
          </Link>
        </nav>

        <button 
          className="md:hidden hover:text-primary transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}