
import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from './components/Layout';
import { 
  DashboardView, 
  ReportCardView, 
  LessonPlanView, 
  QuizGenView, 
  ParentNoticeView,
  CommemorationView,
  CalendarView,
  SeatArrangementView,
  StudentBirthdayView,
  AttendanceView,
  StudentRecordGuideView
} from './components/ToolViews';
import { ToolType, UserProfile, SchoolEvent, StudentBirthday, AttendanceRecord, Task } from './types';
import { Sparkles, User, School, GraduationCap, ArrowRight, BookOpenCheck, X } from 'lucide-react';

const StudentQuizView: React.FC<{ data: string }> = ({ data }) => {
  const decodedData = decodeURIComponent(atob(data));
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-purple-600 p-8 text-white flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <BookOpenCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">AI 생성 퀴즈</h1>
            <p className="text-purple-100 text-sm font-medium">선생님이 공유해주신 퀴즈입니다. 함께 풀어보아요!</p>
          </div>
        </div>
        <div className="p-8 md:p-12">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
              {decodedData}
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">EduBoost AI Quiz Service</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.DASHBOARD);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [birthdays, setBirthdays] = useState<StudentBirthday[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: `생활기록부 문장 검토`, done: false, priority: 'High' },
    { id: '2', text: '내일 수업용 퀴즈 출력하기', done: true, priority: 'Med' },
    { id: '3', text: '공문 확인 및 접수', done: false, priority: 'Low' },
  ]);

  // Check for student view
  const searchParams = new URLSearchParams(window.location.search);
  const view = searchParams.get('view');
  const quizData = searchParams.get('data');

  useEffect(() => {
    if (view === 'quiz') return; // Skip setup for student view
    const savedProfile = localStorage.getItem('edu_boost_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    else setIsSetupOpen(true);

    const savedEvents = localStorage.getItem('edu_boost_events');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedBirthdays = localStorage.getItem('edu_boost_birthdays');
    if (savedBirthdays) setBirthdays(JSON.parse(savedBirthdays));

    const savedAttendance = localStorage.getItem('edu_boost_attendance');
    if (savedAttendance) setAttendanceRecords(JSON.parse(savedAttendance));

    const savedTasks = localStorage.getItem('edu_boost_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  const handleSaveProfile = () => {
    if (!formName || !formSchool || !formGrade) return;
    const newProfile = { name: formName, schoolName: formSchool, grade: formGrade };
    setUserProfile(newProfile);
    localStorage.setItem('edu_boost_profile', JSON.stringify(newProfile));
    setIsSetupOpen(false);
  };

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('edu_boost_tasks', JSON.stringify(newTasks));
  };

  const handleUpdateEvents = (newEvents: SchoolEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('edu_boost_events', JSON.stringify(newEvents));
  };

  const handleUpdateBirthdays = (newBirthdays: StudentBirthday[]) => {
    setBirthdays(newBirthdays);
    localStorage.setItem('edu_boost_birthdays', JSON.stringify(newBirthdays));
  };

  const handleUpdateAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords(newRecords);
    localStorage.setItem('edu_boost_attendance', JSON.stringify(newRecords));

    // Automation: If a new experiential learning record is added, create a task
    const latest = newRecords[newRecords.length - 1];
    if (latest && !latest.isTaskCreated && latest.type === 'EXPERIENTIAL') {
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: `[출결] ${latest.studentName} 학생 체험학습 결과 보고서 수합`,
        done: false,
        priority: 'High'
      };
      const updatedRecords = newRecords.map(r => r.id === latest.id ? { ...r, isTaskCreated: true } : r);
      setAttendanceRecords(updatedRecords);
      localStorage.setItem('edu_boost_attendance', JSON.stringify(updatedRecords));
      updateTasks([...tasks, newTask]);
    }
  };

  // Onboarding Form States
  const [formName, setFormName] = useState('');
  const [formSchool, setFormSchool] = useState('');
  const [formGrade, setFormGrade] = useState('');

  const renderContent = () => {
    if (!userProfile) return null;
    switch (activeTab) {
      case ToolType.DASHBOARD:
        return <DashboardView onNavigate={setActiveTab} profile={userProfile} events={events} birthdays={birthdays} attendance={attendanceRecords} tasks={tasks} onUpdateTasks={updateTasks} />;
      case ToolType.ATTENDANCE:
        return <AttendanceView records={attendanceRecords} onUpdateRecords={handleUpdateAttendance} />;
      case ToolType.REPORT_CARD:
        return <ReportCardView />;
      case ToolType.LESSON_PLAN:
        return <LessonPlanView profile={userProfile} />;
      case ToolType.COMMEMORATION:
        return <CommemorationView profile={userProfile} />;
      case ToolType.QUIZ_GEN:
        return <QuizGenView />;
      case ToolType.PARENT_NOTICE:
        return <ParentNoticeView />;
      case ToolType.CALENDAR:
        return <CalendarView events={events} onUpdateEvents={handleUpdateEvents} />;
      case ToolType.SEAT_ARRANGEMENT:
        return <SeatArrangementView />;
      case ToolType.STUDENT_BIRTHDAY:
        return <StudentBirthdayView birthdays={birthdays} onUpdateBirthdays={handleUpdateBirthdays} />;
      case ToolType.STUDENT_RECORD_GUIDE:
        return <StudentRecordGuideView />;
      default:
        return <DashboardView onNavigate={setActiveTab} profile={userProfile} events={events} birthdays={birthdays} attendance={attendanceRecords} tasks={tasks} onUpdateTasks={updateTasks} />;
    }
  };

  const getPageTitle = () => {
    if (!userProfile) return "EduBoost AI";
    switch (activeTab) {
      case ToolType.DASHBOARD: return `${userProfile.name} 선생님, 오늘도 힘내세요! 👋`;
      case ToolType.ATTENDANCE: return "출결 및 체험학습 관리";
      case ToolType.REPORT_CARD: return "생활기록부 자동완성";
      case ToolType.LESSON_PLAN: return "AI 수업 지도안 설계";
      case ToolType.COMMEMORATION: return "계기교육 자료실";
      case ToolType.QUIZ_GEN: return "AI 맞춤형 퀴즈 생성";
      case ToolType.PARENT_NOTICE: return "학부모 알림장 도우미";
      case ToolType.CALENDAR: return "학사 일정 관리";
      case ToolType.SEAT_ARRANGEMENT: return "학생 자리 배치";
      case ToolType.STUDENT_BIRTHDAY: return "우리 반 생일 알림판";
      case ToolType.STUDENT_RECORD_GUIDE: return "생기부 기재요령 Q&A";
      default: return "EduBoost AI";
    }
  };

  // getPageDesc function returns a brief description for the currently active tool.
  const getPageDesc = () => {
    if (!userProfile) return "";
    switch (activeTab) {
      case ToolType.DASHBOARD: return "오늘의 주요 일정과 업무 현황을 한눈에 파악하세요.";
      case ToolType.ATTENDANCE: return "학생들의 출석 상태와 교외 체험학습 이력을 체계적으로 관리합니다.";
      case ToolType.REPORT_CARD: return "관찰 기록과 키워드를 바탕으로 전문적인 행동발달 의견을 생성합니다.";
      case ToolType.LESSON_PLAN: return "주제에 맞는 체계적인 수업 지도안과 관련 학습 자료를 AI가 추천합니다.";
      case ToolType.COMMEMORATION: return "기념일과 계기교육에 필요한 배경 지식 및 활동 자료를 제공합니다.";
      case ToolType.QUIZ_GEN: return "수업 내용이나 텍스트를 입력하면 수준별 맞춤 퀴즈를 즉시 생성합니다.";
      case ToolType.PARENT_NOTICE: return "학부모님께 전달할 신뢰감 있고 따뜻한 안내 문구를 작성해 드립니다.";
      case ToolType.CALENDAR: return "연간 학사 일정과 우리 반만의 특별한 일정을 캘린더에서 관리하세요.";
      case ToolType.SEAT_ARRANGEMENT: return "공정하고 재미있는 방식으로 우리 반 학생들의 자리를 배치합니다.";
      case ToolType.STUDENT_BIRTHDAY: return "사랑스러운 우리 반 아이들의 생일을 미리 챙기고 축하해 주세요.";
      case ToolType.STUDENT_RECORD_GUIDE: return "2026학년도 학교생활기록부 기재요령에 대한 궁금증을 AI 전문가에게 물어보세요.";
      default: return "선생님의 더 나은 교직 생활을 위한 AI 업무 보조 툴킷입니다.";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {view === 'quiz' && quizData ? (
        <StudentQuizView data={quizData} />
      ) : (
        <>
          {isSetupOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
                  <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">반가워요, 선생님!</h2>
                  <p className="text-blue-100 mt-2 text-sm">원활한 업무 지원을 위해 <br/>기본 정보를 알려주세요.</p>
                </div>
                <div className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><User size={14} /> 이름</label>
                    <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="예: 홍길동" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><School size={14} /> 학교명</label>
                    <input value={formSchool} onChange={e => setFormSchool(e.target.value)} placeholder="예: 다빛초등학교" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><GraduationCap size={14} /> 학년 및 담당</label>
                    <input value={formGrade} onChange={e => setFormGrade(e.target.value)} placeholder="예: 초등 6학년 2반" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={!formName || !formSchool || !formGrade} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-200 flex items-center justify-center gap-2 mt-4">업무 공간 시작하기 <ArrowRight size={18} /></button>
                </div>
              </div>
            </div>
          )}

          {userProfile && (
            <>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="flex-1 flex flex-col">
                <Header profile={userProfile} onEditProfile={() => setIsSetupOpen(true)} />
                <main className="p-8 lg:p-12 flex-1 overflow-y-auto">
                  <div className="max-w-6xl mx-auto">
                    <header className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
                      <h1 className="text-4xl font-black text-slate-800 tracking-tight">{getPageTitle()}</h1>
                      <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed max-w-2xl">{getPageDesc()}</p>
                    </header>
                    {renderContent()}
                  </div>
                </main>
                <footer className="p-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
                  <p>© 2024 EduBoost AI Workspace. <span className="text-blue-500 font-semibold">Teacher's Better Life Project.</span></p>
                </footer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
