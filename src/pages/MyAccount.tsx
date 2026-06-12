import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { weeksData } from '@/data/questions';
import { User, CheckCircle2, XCircle, Clock, Trophy, Dna } from 'lucide-react';

export default function MyAccount() {
  const { user } = useAuth();

  // Get all answered questions with their details
  const answeredQuestions = Object.entries(user?.answeredQuestions || {}).map(([key, value]) => {
    const match = key.match(/week(\d+)_q(\d+)/);
    if (!match) return null;
    
    const weekId = parseInt(match[1]);
    const questionId = parseInt(match[2]);
    
    const week = weeksData.find(w => w.id === weekId);
    const question = week?.questions.find(q => q.id === questionId);
    
    if (!week || !question) return null;
    
    return {
      key,
      weekTitle: week.title,
      question: question.question,
      correct: value.correct,
      answeredAt: value.answeredAt,
      points: question.points,
    };
  }).filter(Boolean);

  const totalCorrect = answeredQuestions.filter(q => q?.correct).length;
  const totalWrong = answeredQuestions.filter(q => !q?.correct).length;

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{answeredQuestions.length}</p>
            <p className="text-sm text-muted-foreground">Questions Answered</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalCorrect}</p>
            <p className="text-sm text-muted-foreground">Correct</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 mb-3">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-foreground">{totalWrong}</p>
            <p className="text-sm text-muted-foreground">Wrong</p>
          </div>
        </div>

        {/* Answered Questions List */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary" />
            Your Answered Questions
          </h3>
          
          {answeredQuestions.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Dna className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">No Questions Answered Yet</h3>
              <p className="text-muted-foreground">
                Start solving challenges to see your progress here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {answeredQuestions.map((item) => (
                <div
                  key={item?.key}
                  className={`glass-card p-4 rounded-xl border-l-4 ${
                    item?.correct ? 'border-l-success' : 'border-l-destructive'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item?.weekTitle}
                        </span>
                        {item?.correct ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            +{item?.points} pts
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Wrong
                          </span>
                        )}
                      </div>
                      <p className="text-foreground">{item?.question}</p>
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
