import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { weeksData } from '@/data/questions';
import { WazariLesson } from '@/data/wazariQuestions';
import { User, XCircle, Clock, Trophy, Dna } from 'lucide-react';

interface WrongQuestion {
  key: string;
  source: string;
  question: string;
  answeredAt: string;
}

export default function MyAccount() {
  const { user, token } = useAuth();
  const [wazariLessons, setWazariLessons] = useState<WazariLesson[]>([]);

  useEffect(() => {
    fetch('/api/wazari/lessons', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then(res => res.json())
      .then(data => setWazariLessons(data))
      .catch(() => {});
  }, [token]);

  const regularWrong: WrongQuestion[] = Object.entries(user?.answeredQuestions || {})
    .filter(([, value]) => !value.correct)
    .map(([key, value]) => {
      const qId = parseInt(key);
      let questionText = '';
      let weekTitle = '';
      for (const week of weeksData) {
        const q = week.questions.find(q => q.id === qId);
        if (q) { questionText = q.question; weekTitle = week.title; break; }
      }
      if (!questionText) return null;
      return { key: `regular_${key}`, source: weekTitle, question: questionText, answeredAt: value.answeredAt };
    })
    .filter(Boolean) as WrongQuestion[];

  const wazariWrong: WrongQuestion[] = Object.entries(user?.wazariAnsweredQuestions || {})
    .filter(([, value]) => !value.correct)
    .map(([key, value]) => {
      const qId = parseInt(key);
      let questionText = '';
      let lessonTitle = '';
      for (const lesson of wazariLessons) {
        const q = lesson.questions.find(q => q.id === qId);
        if (q) { questionText = q.question; lessonTitle = lesson.title; break; }
      }
      if (!questionText) return null;
      return { key: `wazari_${key}`, source: `وزاري - ${lessonTitle}`, question: questionText, answeredAt: value.answeredAt };
    })
    .filter(Boolean) as WrongQuestion[];

  const allWrong = [...regularWrong, ...wazariWrong];
  const totalAnswered = Object.keys(user?.answeredQuestions || {}).length + Object.keys(user?.wazariAnsweredQuestions || {}).length;

  return (
    <div className="min-h-screen bg-background dna-pattern">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Account Details</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            My <span className="text-gradient">Account</span>
          </h1>
        </div>

        {/* User Info Card */}
        <div className="glass-card p-8 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-serif text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-xl font-bold text-accent">{user?.score || 0} points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalAnswered}</p>
            <p className="text-sm text-muted-foreground">Questions Answered</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 mb-3">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-foreground">{allWrong.length}</p>
            <p className="text-sm text-muted-foreground">Wrong</p>
          </div>
        </div>

        {/* Wrong Answered Questions List */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary" />
            Your Wrong Answered Questions
          </h3>

          {allWrong.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Dna className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">No Wrong Answers</h3>
              <p className="text-muted-foreground">
                Great job! You haven't gotten any questions wrong yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allWrong.map((item) => (
                <div
                  key={item.key}
                  className="glass-card p-4 rounded-xl border-l-4 border-l-destructive"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.source}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Wrong
                        </span>
                      </div>
                      <p className="text-foreground">{item.question}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
