import { useState } from 'react';
import { Check, X, Lock, HelpCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WazariQuestion } from '@/data/wazariQuestions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface WazariChallengeBoxProps {
  question: WazariQuestion;
  questionNumber: number;
}

export default function WazariChallengeBox({ question, questionNumber }: WazariChallengeBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const { user, updateWazariScore, isTeacher } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canViewAnswers = isTeacher || isAdmin;

  const questionKey = String(question.id);
  const answeredData = user?.wazariAnsweredQuestions?.[questionKey];
  const isAnswered = !!answeredData;
  const isCorrect = answeredData?.correct;

  const handleSubmit = () => {
    if (selectedAnswer === null || isAnswered || canViewAnswers) return;
    const correct = selectedAnswer === question.correctAnswer;
    updateWazariScore(question.id, question.points, correct);
  };

  const getBoxStatus = () => {
    if (canViewAnswers) return 'teacher';
    if (!isAnswered) return 'locked';
    return isCorrect ? 'correct' : 'incorrect';
  };

  const status = getBoxStatus();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'challenge-box aspect-square flex flex-col items-center justify-center p-4 gap-2',
          status === 'locked' && 'border-border bg-card hover:border-primary/50',
          status === 'correct' && 'border-success bg-success/10',
          status === 'incorrect' && 'border-destructive bg-destructive/10',
          status === 'teacher' && 'border-accent bg-accent/10 hover:border-accent/50'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          status === 'locked' && 'bg-muted',
          status === 'correct' && 'bg-success',
          status === 'incorrect' && 'bg-destructive',
          status === 'teacher' && 'bg-accent'
        )}>
          {status === 'locked' && <HelpCircle className="w-5 h-5 text-muted-foreground" />}
          {status === 'correct' && <Check className="w-5 h-5 text-success-foreground" />}
          {status === 'incorrect' && <X className="w-5 h-5 text-destructive-foreground" />}
          {status === 'teacher' && <Eye className="w-5 h-5 text-accent-foreground" />}
        </div>
        <span className="text-lg font-bold">S{questionNumber}</span>
        <span className="text-xs text-muted-foreground">{question.points} pts</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm',
                status === 'locked' && 'bg-primary/20 text-primary',
                status === 'correct' && 'bg-success/20 text-success',
                status === 'incorrect' && 'bg-destructive/20 text-destructive',
                status === 'teacher' && 'bg-accent/20 text-accent'
              )}>
                سؤال {questionNumber}
              </span>
              <span className="text-muted-foreground text-sm font-sans">
                {question.points} نقطة
              </span>
              {canViewAnswers && (
                <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                  {isAdmin ? 'عرض الأدمن' : 'عرض المعلم'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4" dir="rtl">
            {question.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border">
                <img
                  src={question.imageUrl}
                  alt="صورة السؤال"
                  className="w-full max-h-64 object-contain bg-muted"
                />
              </div>
            )}
            <p className="text-lg text-foreground leading-relaxed">
              {question.question}
            </p>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === question.correctAnswer;
                const showResult = isAnswered || canViewAnswers;

                return (
                  <button
                    key={index}
                    onClick={() => !isAnswered && !canViewAnswers && setSelectedAnswer(index)}
                    disabled={isAnswered || canViewAnswers}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-right transition-all',
                      'hover:scale-[1.02] disabled:hover:scale-100',
                      !showResult && !isSelected && 'border-border bg-secondary/50 hover:border-primary/50',
                      !showResult && isSelected && 'border-primary bg-primary/10',
                      showResult && isCorrectOption && 'border-success bg-success/10',
                      showResult && !isCorrectOption && isSelected && 'border-destructive bg-destructive/10',
                      showResult && !isCorrectOption && !isSelected && 'border-border bg-secondary/30 opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                        !showResult && !isSelected && 'bg-muted text-muted-foreground',
                        !showResult && isSelected && 'bg-primary text-primary-foreground',
                        showResult && isCorrectOption && 'bg-success text-success-foreground',
                        showResult && !isCorrectOption && isSelected && 'bg-destructive text-destructive-foreground',
                        showResult && !isCorrectOption && !isSelected && 'bg-muted text-muted-foreground'
                      )}>
                        {String.fromCharCode(1575 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrectOption && <Check className="w-5 h-5 text-success" />}
                      {showResult && !isCorrectOption && isSelected && <X className="w-5 h-5 text-destructive" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {!isAnswered && !canViewAnswers && (
              <Button onClick={handleSubmit} disabled={selectedAnswer === null} className="w-full" size="lg">
                تأكيد الإجابة
              </Button>
            )}

            {canViewAnswers && (
              <div className="p-4 rounded-xl bg-accent/10 text-accent text-center">
                <p className="font-semibold">👁️ {isAdmin ? 'وضع الأدمن' : 'وضع المعلم'}: الإجابة الصحيحة محددة</p>
              </div>
            )}

            {isAnswered && !isTeacher && (
              <div className={cn(
                'p-4 rounded-xl text-center',
                isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}>
                {isCorrect ? (
                  <p className="font-semibold">🎉 إجابة صحيحة! +{question.points} نقطة</p>
                ) : (
                  <p className="font-semibold">❌ إجابة خاطئة. الإجابة الصحيحة: {question.options[question.correctAnswer]}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
