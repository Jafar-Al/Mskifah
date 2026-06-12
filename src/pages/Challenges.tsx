import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import WeekSection from '@/components/WeekSection';
import { Week } from '@/data/questions';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Trophy, Zap, Loader2 } from 'lucide-react';

export default function Challenges() {
  const { user } = useAuth();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        setWeeks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load questions', err);
        setLoading(false);
      });
  }, []);

  // Calculate total stats
  const totalQuestions = weeks.reduce((acc, week) => acc + week.questions.length, 0);
  const answeredQuestions = Object.keys(user?.answeredQuestions || {}).length;
  const correctAnswers = Object.values(user?.answeredQuestions || {}).filter(q => q.correct).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background dna-pattern flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dna-pattern">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Weekly <span className="text-gradient">Challenges</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Complete the challenges to earn points. You have one attempt per question -
            think carefully before submitting!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{answeredQuestions}/{totalQuestions}</p>
            <p className="text-sm text-muted-foreground">Questions Attempted</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-3">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{correctAnswers}</p>
            <p className="text-sm text-muted-foreground">Correct Answers</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-3">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">{user?.score || 0}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
        </div>

        {/* Week Sections */}
        <div className="space-y-16">
          {weeks.map(week => (
            <WeekSection key={week.id} week={week} />
          ))}
        </div>
      </main>
    </div>
  );
}
