import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth, User } from '@/contexts/AuthContext';
import { Trophy, Medal, Award, Crown, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load leaderboard', err);
        setLoading(false);
      });
  }, []);

  // Filter out teachers and admins, and sort by score (highest first)
  const sortedUsers = [...users]
    .filter(u => u.role !== 'teacher' && u.role !== 'admin')
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTimeRaw = a.scoreAchievedAt ? Date.parse(a.scoreAchievedAt) : NaN;
      const bTimeRaw = b.scoreAchievedAt ? Date.parse(b.scoreAchievedAt) : NaN;
      const aTime = Number.isFinite(aTimeRaw) ? aTimeRaw : Number.POSITIVE_INFINITY;
      const bTime = Number.isFinite(bTimeRaw) ? bTimeRaw : Number.POSITIVE_INFINITY;
      if (aTime !== bTime) return aTime - bTime;
      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background dna-pattern flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background dna-pattern">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-6">
            <Trophy className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            See how you rank against other biology students
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-3xl mx-auto">
          {sortedUsers.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-2">No scores yet!</h3>
              <p className="text-muted-foreground">
                Be the first to complete some challenges and appear on the leaderboard.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUsers.map((user, index) => {
                const rank = index + 1;
                const isCurrentUser = user.id === currentUser?.id;
                const answeredCount = Object.keys(user.answeredQuestions).length;
                const correctCount = Object.values(user.answeredQuestions).filter(q => q.correct).length;

                return (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-4 p-5 rounded-xl border-2 transition-all hover:scale-[1.02]',
                      getRankBg(rank),
                      isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
                      rank === 1 && 'bg-yellow-500 text-yellow-950',
                      rank === 2 && 'bg-gray-400 text-gray-950',
                      rank === 3 && 'bg-amber-600 text-amber-950',
                      rank > 3 && 'bg-primary/20 text-primary'
                    )}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{user.name}</h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {correctCount}/{answeredCount} correct answers
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <p className={cn(
                        'text-2xl font-bold',
                        rank === 1 && 'text-yellow-500',
                        rank === 2 && 'text-gray-400',
                        rank === 3 && 'text-amber-600',
                        rank > 3 && 'text-foreground'
                      )}>
                        {user.score}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
