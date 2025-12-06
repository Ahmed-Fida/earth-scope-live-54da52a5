import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Industries', href: '#industries' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' : 'bg-transparent')}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
              <Leaf className="w-8 h-8 text-primary" />
              <motion.div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight">
              <span className="gradient-text">Enviro</span>
              <span className="text-foreground">Sense</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="nav-link px-4 py-2 text-sm font-medium">{item.label}</a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/sign-in"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/sign-up"><Button variant="hero" size="sm">Get Started Free</Button></Link>
          </div>

          <button className="lg:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="block px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</a>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <Link to="/sign-in" onClick={() => setIsMobileMenuOpen(false)}><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link to="/sign-up" onClick={() => setIsMobileMenuOpen(false)}><Button variant="hero" className="w-full">Get Started Free</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
