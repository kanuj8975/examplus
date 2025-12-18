
import React, { useState, useEffect } from 'react';
import { ExamType, Language, Question, UserPerformance, Difficulty, UserProfile, Transaction } from './types';
import { generateFullExamPaper } from './geminiService';

import Sidebar from './components/Sidebar';
import ExamSelector from './components/ExamSelector';
import QuizEngine from './components/QuizEngine';
import ResultsView from './components/ResultsView';
import Dashboard from './components/Dashboard';
import SubscriptionModal from './components/SubscriptionModal';
import Instructions from './components/Instructions';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'selector' | 'instructions' | 'quiz' | 'results' | 'history' | 'plans'>('dashboard');
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [language, setLanguage] = useState<Language>('Hindi');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState("");
  const [performanceHistory, setPerformanceHistory] = useState<UserPerformance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Aspirant",
    avatar: "",
    plan: 'Free',
    masteryPoints: 0,
    joinedAt: Date.now(),
    streak: 0,
    lastActive: Date.now()
  });

  useEffect(() => {
    const session = localStorage.getItem('examGenie_session');
    if (session) {
      setIsLoggedIn(true);
      loadUserData('local_user', 'Aspirant', '');
    }
    setAuthLoading(false);
  }, []);

  const loadUserData = (uid: string, defaultName: string | null, defaultAvatar: string | null) => {
    const savedProfile = localStorage.getItem(`examGenie_profile_${uid}`);
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    } else {
      setUserProfile(prev => ({
        ...prev,
        name: defaultName || "Aspirant",
        avatar: defaultAvatar || ""
      }));
    }

    const savedHistory = localStorage.getItem(`examGenie_history_${uid}`);
    if (savedHistory) setPerformanceHistory(JSON.parse(savedHistory));

    const savedTxns = localStorage.getItem(`examGenie_txns_${uid}`);
    if (savedTxns) setTransactions(JSON.parse(savedTxns));
  };

  const handleUpdateProfile = (newProfile: UserProfile, newTxn?: Transaction) => {
    setUserProfile(newProfile);
    const uid = 'local_user';
    localStorage.setItem(`examGenie_profile_${uid}`, JSON.stringify(newProfile));
    if (newTxn) {
      const updatedTxns = [newTxn, ...transactions];
      setTransactions(updatedTxns);
      localStorage.setItem(`examGenie_txns_${uid}`, JSON.stringify(updatedTxns));
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('examGenie_session', 'active');
    loadUserData('local_user', 'Aspirant', '');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('examGenie_session');
    setView('dashboard');
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleStartExamFlow = async (examType: ExamType, lang: Language, diff: Difficulty) => {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }

    setLoading(true);
    setSelectedExam(examType);
    setLanguage(lang);
    setDifficulty(diff);
    
    try {
      const questions = await generateFullExamPaper(examType, lang, diff, [], (section) => {
        setLoadingSection(section);
      });
      setCurrentQuestions(questions);
      setView('instructions');
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("Requested entity was not found")) {
        alert("API Key error. Please re-select your key.");
        await aistudio.openSelectKey();
      } else {
        alert("AI Synthesis Error. Please try again.");
      }
      setView('selector');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRevisionVault = () => {
    const allWrong: Question[] = [];
    const seenIds = new Set();
    performanceHistory.forEach(perf => {
      perf.questions.forEach(q => {
        if (perf.userAnswers[q.id] !== q.correctAnswer && !seenIds.has(q.id)) {
          allWrong.push(q);
          seenIds.add(q.id);
        }
      });
    });

    if (allWrong.length === 0) {
      alert("No mistakes found in history!");
      return;
    }

    setSelectedExam(performanceHistory[0]?.examType || 'SSC CGL');
    setCurrentQuestions(allWrong.slice(0, 20).sort(() => Math.random() - 0.5));
    setView('instructions');
  };

  const handleQuizComplete = (answers: Record<string, number>, timeTaken: number) => {
    setUserAnswers(answers);
    if (!selectedExam) return;

    let score = 0;
    const subjectsMap: Record<string, { correct: number, total: number }> = {};
    currentQuestions.forEach(q => {
      if (!subjectsMap[q.subject]) subjectsMap[q.subject] = { correct: 0, total: 0 };
      subjectsMap[q.subject].total++;
      if (answers[q.id] === q.correctAnswer) {
        score++;
        subjectsMap[q.subject].correct++;
      }
    });

    const masteryGained = Math.round((score / currentQuestions.length) * 100);
    const newPerf: UserPerformance = {
      id: `paper-${Date.now()}`,
      examType: selectedExam,
      difficulty: difficulty,
      totalScore: score,
      totalQuestions: currentQuestions.length,
      questions: currentQuestions,
      userAnswers: answers,
      weakSubjects: Object.entries(subjectsMap).filter(([_, s]) => (s.correct/s.total) < 0.6).map(([sub]) => sub),
      masteryGained: masteryGained,
      lastTestedAt: Date.now(),
      timeSpentSeconds: timeTaken
    };

    const updatedProfile = { 
      ...userProfile, 
      masteryPoints: userProfile.masteryPoints + masteryGained 
    };
    handleUpdateProfile(updatedProfile);

    const updatedHistory = [newPerf, ...performanceHistory];
    setPerformanceHistory(updatedHistory);
    localStorage.setItem(`examGenie_history_local_user`, JSON.stringify(updatedHistory));
    setView('results');
  };

  if (authLoading) return null;

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbfaf8] p-4">
        <div className="max-w-md w-full text-center p-8 md:p-12 bg-white rounded-[40px] border border-stone-200">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6">G</div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tighter mb-2">ExamGenie Pro</h1>
          <p className="text-stone-500 mb-8 font-medium text-sm">15Y Pattern Prediction + Real-Time Grounding</p>
          <button onClick={handleLogin} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Enter Command Center</button>
        </div>
      </div>
    );
  }

  const isExamView = view === 'quiz' || view === 'instructions';

  return (
    <div className={`flex h-screen overflow-hidden ${isExamView ? 'bg-stone-200' : 'bg-[#fbfaf8]'}`}>
      {!isExamView && (
        <Sidebar 
          currentView={view} 
          onNavigate={(v) => setView(v as any)} 
          userProfile={userProfile} 
          onAdminTrigger={() => setIsAdminOpen(true)} 
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 overflow-y-auto w-full flex flex-col">
        {!isExamView && (
          <header className="lg:hidden flex justify-between items-center p-4 bg-[#fbfaf8] border-b border-stone-200 sticky top-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2">
              <svg className="w-6 h-6 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="font-black text-stone-900 uppercase tracking-tighter text-sm">ExamGenie AI</span>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white text-xs font-black">G</div>
          </header>
        )}

        {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} onResetApp={handleReset} />}
        
        <div className={isExamView ? "w-full h-full" : "max-w-6xl mx-auto px-4 py-6 md:py-8 w-full"}>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white rounded-[40px] border border-stone-100">
              <div className="h-12 w-12 border-4 border-stone-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-black text-stone-900 mb-2 tracking-tighter uppercase">Synthesis...</h2>
              <p className="text-stone-400 text-xs font-medium italic mb-6">"Verifying 2024-25 latest trends..."</p>
              <div className="px-5 py-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest">{loadingSection || "Syncing Web"}</span>
              </div>
            </div>
          ) : (
            <>
              {view === 'dashboard' && <Dashboard history={performanceHistory} onStart={() => setView('selector')} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onOpenPlans={() => setView('plans')} onReAttempt={(p) => { setSelectedExam(p.examType); setCurrentQuestions(p.questions); setView('instructions'); }} onOpenVault={handleStartRevisionVault} onOpenMicro={() => setView('selector')} />}
              {view === 'selector' && <ExamSelector onSelect={handleStartExamFlow} />}
              {view === 'instructions' && selectedExam && <Instructions examType={selectedExam} language={language} onProceed={() => setView('quiz')} onCancel={() => setView('selector')} />}
              {view === 'quiz' && selectedExam && <QuizEngine examType={selectedExam} language={language} questions={currentQuestions} onComplete={handleQuizComplete} onCancel={() => setView('dashboard')} userProfile={userProfile} />}
              {view === 'results' && selectedExam && <ResultsView questions={currentQuestions} userAnswers={userAnswers} onBack={() => setView('dashboard')} examType={selectedExam} />}
              {view === 'plans' && <SubscriptionModal userProfile={userProfile} onUpdate={handleUpdateProfile} onBack={() => setView('dashboard')} />}
              {view === 'history' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tighter uppercase mb-6">Simulation History</h2>
                  {performanceHistory.length === 0 ? (
                    <div className="p-12 text-center bg-stone-50 rounded-[32px] border-2 border-dashed border-stone-200">
                      <p className="text-stone-400 font-bold uppercase text-xs tracking-widest">No history found</p>
                    </div>
                  ) : (
                    performanceHistory.map((h, i) => (
                      <div key={i} className="bg-white p-5 rounded-[28px] border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center text-lg font-black">{h.examType.charAt(0)}</div>
                          <div>
                            <h3 className="font-black text-stone-900 text-sm uppercase tracking-tight">{h.examType}</h3>
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{new Date(h.lastTestedAt).toLocaleDateString()} • {h.totalScore}/{h.totalQuestions}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedExam(h.examType); setCurrentQuestions(h.questions); setView('instructions'); }} className="w-full sm:w-auto px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-black text-[9px] uppercase tracking-widest">Review</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
