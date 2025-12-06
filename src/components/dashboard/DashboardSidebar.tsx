import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  History,
  HelpCircle,
  Info,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Map, label: 'My Areas', href: '/dashboard/areas' },
  { icon: History, label: 'History', href: '/dashboard/history' },
  { icon: HelpCircle, label: 'Support', href: '/dashboard/support' },
  { icon: Info, label: 'About', href: '/dashboard/about' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ isCollapsed, onToggle }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    localStorage.removeItem('envirosense_user');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
    navigate('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <Leaf className="w-8 h-8 text-primary shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xl font-bold whitespace-nowrap"
              >
                <span className="gradient-text">Enviro</span>
                <span className="text-sidebar-foreground">Sense</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="shrink-0 text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-sidebar-accent',
                    isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                    !isActive && 'text-sidebar-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'hover:bg-sidebar-accent text-sidebar-foreground'
          )}
        >
          {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'hover:bg-destructive/10 text-destructive'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
