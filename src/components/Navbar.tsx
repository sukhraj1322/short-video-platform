import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Upload, User, LogOut, Search, Video, BarChart3, IndianRupee, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 group">
            <div className="relative">
              <Video className="h-8 w-8 text-primary group-hover:animate-glow-pulse" />
              <div className="absolute inset-0 blur-xl bg-primary/20 group-hover:bg-primary/40 transition-all"></div>
            </div>
            <span className="text-2xl font-bold text-gradient">ShortlyX</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Link to="/feed">
              <Button
                variant={isActive('/feed') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </Button>
            </Link>

            <Link to="/search">
              <Button
                variant={isActive('/search') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </Link>

            <Link to="/upload">
              <Button
                variant={isActive('/upload') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </Link>

            <Link to="/analytics">
              <Button
                variant={isActive('/analytics') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Analytics</span>
              </Button>
            </Link>

            <Link to="/revenue">
              <Button
                variant={isActive('/revenue') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <IndianRupee className="h-4 w-4" />
                <span className="hidden lg:inline">Revenue</span>
              </Button>
            </Link>

            <Link to="/logs">
              <Button
                variant={isActive('/logs') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Logs</span>
              </Button>
            </Link>

            <Link to="/profile">
              <Button
                variant={isActive('/profile') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Profile</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
