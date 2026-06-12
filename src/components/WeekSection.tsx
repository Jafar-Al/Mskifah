import { Week } from '@/data/questions';
import ChallengeBox from './ChallengeBox';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Lock } from 'lucide-react';

interface WeekSectionProps {
  week: Week;
}

export default function WeekSection({ week }: WeekSectionProps) {
  const { user } = useAuth();

  // Calculate progress for this week
  const answeredCount = week.questions.filter(q => {
    const key = String(q.id);
    return user?.answeredQuestions[key];
  }).length;

  const correctCount = week.questions.filter(q => {
    const key = String(q.id);
    return user?.answeredQuestions[key]?.correct;
  }).length;

  const progressPercent = (answeredCount / week.questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
            {week.title}
            {!week.isUnlocked && (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </h2>
          {week.isUnlocked ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-success font-medium">{correctCount}</span>
              <span>/</span>
              <span>{week.questions.length}</span>
              <span>correct</span>
            </div>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Locked
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      {week.isUnlocked ? (
        <>
          {/* Progress bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Challenge grid */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-15 gap-3">
            {week.questions.map(question => (
              <ChallengeBox
                key={question.id}
                question={question}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card p-8 rounded-xl text-center border border-dashed border-muted-foreground/30">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            This week is locked. It will be unlocked by the teacher soon.
          </p>
        </div>
      )}
    </div>
  );
}
