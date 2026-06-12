import { WazariLesson } from '@/data/wazariQuestions';
import WazariChallengeBox from './WazariChallengeBox';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Lock } from 'lucide-react';

interface WazariLessonSectionProps {
  lesson: WazariLesson;
}

export default function WazariLessonSection({ lesson }: WazariLessonSectionProps) {
  const { user } = useAuth();

  const answeredCount = lesson.questions.filter(q => {
    const key = String(q.id);
    return user?.wazariAnsweredQuestions?.[key];
  }).length;

  const correctCount = lesson.questions.filter(q => {
    const key = String(q.id);
    return user?.wazariAnsweredQuestions?.[key]?.correct;
  }).length;

  const progressPercent = lesson.questions.length > 0
    ? (answeredCount / lesson.questions.length) * 100
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
            {lesson.title}
            {!lesson.isUnlocked && <Lock className="w-5 h-5 text-muted-foreground" />}
          </h2>
          {lesson.isUnlocked && lesson.questions.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-success font-medium">{correctCount}</span>
              <span>/</span>
              <span>{lesson.questions.length}</span>
              <span>صحيح</span>
            </div>
          ) : lesson.isUnlocked && lesson.questions.length === 0 ? null : (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              مغلق
            </span>
          )}
        </div>
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
      </div>

      {lesson.isUnlocked ? (
        lesson.questions.length > 0 ? (
          <>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-3">
              {lesson.questions.map((question, index) => (
                <WazariChallengeBox
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card p-8 rounded-xl text-center border border-dashed border-muted-foreground/30">
            <p className="text-muted-foreground">لم تُضف أسئلة لهذا الدرس بعد.</p>
          </div>
        )
      ) : (
        <div className="glass-card p-8 rounded-xl text-center border border-dashed border-muted-foreground/30">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">هذا الدرس مغلق. سيتم فتحه من قِبل المعلم قريباً.</p>
        </div>
      )}
    </div>
  );
}
