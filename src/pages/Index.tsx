import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dna, Microscope, FlaskConical, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background dna-pattern">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-fade-up">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Class of 2008 Biology Platform</span>
            </div>

            {/* Main heading */}
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Master Biology with
              <span className="text-gradient block mt-2">MS Kifah</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              An interactive learning platform designed for students born in 2008, 
              featuring weekly challenges and a competitive leaderboard system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to={isAuthenticated ? "/challenges" : "/signup"}>
                <Button size="lg" className="glow-primary gap-2 px-8">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <Button variant="outline" size="lg" className="gap-2 px-8">
                    Already have an account?
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-8 md:p-12 rounded-2xl max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Icon/Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center glow-primary">
                  <Microscope className="w-16 h-16 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <h2 className="font-serif text-3xl font-bold">About the Platform</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This educational platform is supervised by a dedicated biology teacher from 
                  <span className="text-primary font-semibold"> King Abdullah II Schools of Excellence - Al-Muqabalain</span>. 
                  Designed specifically for students born in 2008, it offers an engaging way to study 
                  biology through weekly challenges and interactive quizzes.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">Weekly Challenges</span>
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">Leaderboard</span>
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm">Track Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="font-serif text-4xl font-bold text-center mb-12">
            How It <span className="text-gradient">Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: 'Weekly Challenges',
                description: 'Complete 15 multiple-choice questions each week. One attempt per question - choose wisely!',
              },
              {
                icon: FlaskConical,
                title: 'Learn from Mistakes',
                description: 'Review all questions after answering. See correct answers and learn from your mistakes.',
              },
              {
                icon: Dna,
                title: 'Climb the Ranks',
                description: 'Compete with classmates on the leaderboard. Earn points for correct answers!',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Dna className="w-4 h-4 text-primary" />
            <span>KifahBiology © 2024 - King Abdullah II Schools of Excellence</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
