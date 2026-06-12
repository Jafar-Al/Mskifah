import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, Target, LogOut, User, Video, ClipboardList, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img src="/newlogo.png" alt="Kifah Biology" className="w-6 h-6" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              Kifah<span className="text-primary">Biology</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/challenges">
                  <Button variant={isActive('/challenges') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Challenges</span>
                  </Button>
                </Link>
                <Link to="/wazari">
                  <Button variant={isActive('/wazari') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span className="hidden sm:inline">مكثف وزاري</span>
                  </Button>
                </Link>
                <Link to="/videos">
                  <Button variant={isActive('/videos') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Videos</span>
                  </Button>
                </Link>
                <Link to="/files">
                  <Button variant={isActive('/files') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <span className="hidden sm:inline">Files</span>
                  </Button>
                </Link>
                <Link to="/exams">
                  <Button variant={isActive('/exams') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">Exams</span>
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/secure-msk-admin">
                    <Button variant={isActive('/secure-msk-admin') ? 'default' : 'ghost'} size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <Link to="/leaderboard">
                  <Button variant={isActive('/leaderboard') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Leaderboard</span>
                  </Button>
                </Link>
                <Link to="/my-account">
                  <Button variant={isActive('/my-account') ? 'default' : 'ghost'} size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user?.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {user?.score} pts
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/signup"><Button size="sm">Sign Up</Button></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
