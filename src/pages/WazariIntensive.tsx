import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import WazariLessonSection from '@/components/WazariLessonSection';
import { WazariLesson } from '@/data/wazariQuestions';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Trophy, Zap, Loader2, GraduationCap } from 'lucide-react';

export default function WazariIntensive() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<WazariLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wazari/lessons')
      .then(res => res.json())
      .then(data => { setLessons(data); setLoading(false); })
      .catch(err => { console.error('Failed to load wazari lessons', err); setLoading(false); });
  }, []);

  // Group lessons by unit
  const unitGroups = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.unitTitle]) acc[lesson.unitTitle] = [];
    acc[lesson.unitTitle].push(lesson);
    return acc;
  }, {} as Record<string, WazariLesson[]>);

  const totalQuestions = lessons.reduce((acc, l) => acc + l.questions.length, 0);
  const answeredQuestions = lessons.reduce((acc, l) => {
    return acc + l.questions.filter(q => user?.wazariAnsweredQuestions?.[String(q.id)]).length;
  }, 0);
  const correctAnswers = lessons.reduce((acc, l) => {
    return acc + l.questions.filter(q => user?.wazariAnsweredQuestions?.[String(q.id)]?.correct).length;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dna-pattern flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dna-pattern" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <GraduationCap className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold">
                مكثف <span className="text-gradient">وزاري</span>
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                أسئلة وزارية متوقعة – مقسّمة حسب الدروس
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{answeredQuestions}/{totalQuestions}</p>
            <p className="text-sm text-muted-foreground">الأسئلة المحاولة</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-3">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">{correctAnswers}</p>
            <p className="text-sm text-muted-foreground">الإجابات الصحيحة</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-3">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">{user?.score || 0}</p>
            <p className="text-sm text-muted-foreground">مجموع النقاط</p>
          </div>
        </div>

        {/* Lessons grouped by unit */}
        <div className="space-y-16">
          {Object.entries(unitGroups).map(([unitTitle, unitLessons]) => (
            <div key={unitTitle} className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-serif text-xl font-bold text-primary px-4 py-2 rounded-full bg-primary/10 whitespace-nowrap">
                  {unitTitle}
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-12">
                {unitLessons.map(lesson => (
                  <WazariLessonSection key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
