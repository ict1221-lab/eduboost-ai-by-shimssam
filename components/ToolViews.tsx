
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  generateReportComments, 
  generateLessonPlan, 
  generateParentNotice,
  generateQuiz,
  LessonPlanResult,
  getCommemorationMaterials,
  askStudentRecordGuide,
  parseCalendarFromText,
  parseCalendarFromImage
} from '../services/geminiService';
import { 
  Loader2, 
  Copy, 
  Send, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle,
  FileText,
  MessageSquare,
  HelpCircle,
  Video,
  ExternalLink,
  Presentation,
  Flag,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Shuffle,
  Monitor,
  Gift,
  Search,
  UserPlus,
  ClipboardCheck,
  Plane,
  BookMarked,
  Info,
  Upload,
  QrCode,
  X
} from 'lucide-react';
import { ToolType, UserProfile, SchoolEvent, StudentBirthday, AttendanceRecord, Task } from '../types';

const SuccessToast = ({ message }: { message: string }) => (
  <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 z-50">
    <Check size={18} className="text-green-400" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// Special Days List for Korea
const SPECIAL_DAYS = [
  { month: 3, day: 1, name: '3·1절 (독립운동 기념일)' },
  { month: 4, day: 3, name: '제주 4·3 희생자 추념일' },
  { month: 4, day: 16, name: '국민안전의 날 (세월호 참사 추모)' },
  { month: 4, day: 19, name: '4·19 혁명 기념일' },
  { month: 4, day: 20, name: '장애인의 날' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 5, day: 8, name: '어버이날' },
  { month: 5, day: 15, name: '스승의 날' },
  { month: 5, day: 18, name: '5·18 민주화운동 기념일' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 9, day: 18, name: '철도의 날' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 11, day: 3, name: '학생독립운동 기념일' },
  { month: 11, day: 17, name: '순국선열의 날' },
];

export const DashboardView: React.FC<{ 
  onNavigate: (tab: ToolType) => void; 
  profile: UserProfile;
  events: SchoolEvent[];
  birthdays: StudentBirthday[];
  attendance: AttendanceRecord[];
  tasks: Task[];
  onUpdateTasks: (newTasks: Task[]) => void;
}> = ({ onNavigate, profile, events, birthdays, attendance, tasks, onUpdateTasks }) => {
  const stats = [
    { label: '완료된 행발', value: '18/24', percent: 75, color: 'bg-green-500' },
    { label: '수업준비 진척도', value: '4/5', percent: 80, color: 'bg-blue-500' },
    { label: '오늘 결석/체험', value: `${attendance.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.startDate <= today && r.endDate >= today;
    }).length}명`, percent: 100, color: 'bg-orange-500' },
  ];

  const getUpcomingOccasion = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    return SPECIAL_DAYS.find(sd => (sd.month > currentMonth) || (sd.month === currentMonth && sd.day >= currentDay)) || SPECIAL_DAYS[0];
  };

  const getMonthlyEvents = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;
    return events.filter(e => e.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getUpcomingBirthdays = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    return birthdays
      .filter(b => {
        if (b.month > currentMonth) return true;
        if (b.month === currentMonth && b.day >= currentDay) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      })
      .slice(0, 3);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeAttendance = attendance.filter(r => r.startDate <= todayStr && r.endDate >= todayStr);

  const upcoming = getUpcomingOccasion();
  const monthlyEvents = getMonthlyEvents();
  const upcomingBirthdays = getUpcomingBirthdays();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="text-sm font-medium text-slate-500 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-slate-800 mb-4">{stat.value}</div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`${stat.color} h-full transition-all duration-1000`} style={{ width: `${stat.percent}%` }}></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">오늘의 업무 리스트</h3>
              <button className="text-sm text-blue-600 font-semibold hover:underline" onClick={() => onNavigate(ToolType.DASHBOARD)}>관리</button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${task.done ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 hover:border-blue-200'}`} onClick={() => onUpdateTasks(tasks.map(t => t.id === task.id ? {...t, done: !t.done} : t))}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                      {task.done && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.text}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Med' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck size={20} className="text-orange-600" /> 오늘 출결 특이사항
              </h3>
              <button onClick={() => onNavigate(ToolType.ATTENDANCE)} className="text-sm text-blue-600 font-semibold hover:underline">상세 관리</button>
            </div>
            <div className="space-y-3">
              {activeAttendance.length > 0 ? (
                activeAttendance.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm font-black text-xs uppercase tracking-tight">
                        {r.type === 'EXPERIENTIAL' ? '체험' : r.type === 'ABSENCE' ? '결석' : r.type === 'SICKNESS' ? '병결' : '조퇴'}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{r.studentName}</span>
                    </div>
                    <span className="text-xs text-slate-500 italic">{r.reason}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">오늘의 출결 특이사항이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div onClick={() => onNavigate(ToolType.STUDENT_RECORD_GUIDE)} className="bg-gradient-to-br from-indigo-500 to-blue-600 p-8 rounded-2xl shadow-lg shadow-indigo-100 text-white flex flex-col justify-between h-48 cursor-pointer transform transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookMarked size={20} className="text-indigo-100" />
                <h3 className="text-lg font-bold">2026 기재요령 Q&A</h3>
              </div>
              <p className="text-indigo-50 text-sm font-medium leading-relaxed">
                2026학년도 생기부 지침 중 궁금한 점을 즉시 물어보세요.
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">질문하기 <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => onNavigate(ToolType.STUDENT_BIRTHDAY)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer transform transition-all hover:border-pink-200 hover:bg-pink-50/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><Gift size={18} className="text-pink-500" /> 다가오는 생일</h3>
              <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-bold">Party</span>
            </div>
            <div className="space-y-3">
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">{b.name[0]}</div>
                      <span className="text-sm font-bold text-slate-700">{b.name}</span>
                    </div>
                    <span className="text-xs text-pink-500 font-black">{b.month}월 {b.day}일</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 text-[11px] font-medium border border-dashed border-slate-200 rounded-xl">등록된 다가오는 생일이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentRecordGuideView: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; links: { title: string; uri: string }[] } | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const data = await askStudentRecordGuide(question);
      setResult(data);
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "2026학년도 행동발달 의견 기재 시 글자 수 제한이 어떻게 되나요?",
    "교외 수상 경력을 생기부에 입력해도 되나요?",
    "체험학습 기간 동안의 출결 기재 방법을 알려주세요.",
    "영재학급 수료 여부는 어디에 기재하나요?"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <BookMarked className="text-indigo-600" size={28} />
          2026학년도 학교생활기록부 기재요령 Q&A
        </h2>
        
        <div className="space-y-6">
          <div className="relative">
            <textarea 
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="궁금한 기재 요령에 대해 질문해보세요. (예: 행동발달 및 종합의견 기재 요령)"
              className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-medium h-32 resize-none"
            />
            <button 
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              <span className="text-sm font-bold pr-1">질문하기</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">추천 질문</span>
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => setQuestion(q)}
                className="text-xs px-4 py-2 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-full font-bold transition-all border border-transparent hover:border-indigo-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">AI 전문가 답변 (2026 지침 기반)</h3>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-sm font-medium">
              {result.text}
            </div>
          </div>

          {result.links.length > 0 && (
            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
              <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ExternalLink size={14} /> 관련 근거 및 외부 링크
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-2xl hover:shadow-md transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">{link.title}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-1">{link.uri}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AttendanceView: React.FC<{
  records: AttendanceRecord[];
  onUpdateRecords: (newRecords: AttendanceRecord[]) => void;
}> = ({ records, onUpdateRecords }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AttendanceRecord['type']>('ABSENCE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const addRecord = () => {
    if (!name.trim()) return;
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      studentName: name.trim(),
      type,
      startDate,
      endDate,
      reason: reason.trim(),
      isTaskCreated: false
    };
    onUpdateRecords([...records, newRecord]);
    setName('');
    setReason('');
  };

  const removeRecord = (id: string) => {
    onUpdateRecords(records.filter(r => r.id !== id));
  };

  const sortedRecords = [...records].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-orange-500" /> 신규 출결 등록
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">학생 이름</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 김철수" className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">출결 구분</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold">
                  <option value="ABSENCE">일반 결석</option>
                  <option value="EXPERIENTIAL">교외체험학습 (자동 할 일 연동)</option>
                  <option value="SICKNESS">병결 / 법정감염병</option>
                  <option value="EARLY_LEAVE">조퇴 / 결과</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">시작일</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">종료일</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">사유</label>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="사유를 입력하세요 (예: 감기, 가족여행 등)" className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" />
              </div>
              <button onClick={addRecord} disabled={!name.trim()} className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-[0.98] disabled:bg-slate-200">등록 및 업무 자동 연동</button>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4 items-start">
            <div className="bg-white p-2 rounded-xl text-orange-600 shadow-sm"><Plane size={20}/></div>
            <div>
              <h4 className="text-sm font-bold text-orange-800 mb-1">체험학습 자동화</h4>
              <p className="text-xs text-orange-600 leading-relaxed">체험학습을 등록하면 대시보드 할 일 목록에 '결과 보고서 수합' 업무가 자동으로 생성됩니다.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">출결 관리 이력</h3>
            <div className="space-y-4">
              {sortedRecords.length > 0 ? (
                sortedRecords.map((r) => (
                  <div key={r.id} className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-orange-200 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`p-3 rounded-2xl font-black text-xs uppercase ${r.type === 'EXPERIENTIAL' ? 'bg-blue-50 text-blue-600' : r.type === 'SICKNESS' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                        {r.type === 'EXPERIENTIAL' ? '체험' : r.type === 'ABSENCE' ? '결석' : r.type === 'SICKNESS' ? '병결' : '조퇴'}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{r.studentName} <span className="text-xs font-normal text-slate-400 ml-2">{r.reason}</span></div>
                        <div className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
                          <Calendar size={12}/> {r.startDate} ~ {r.endDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {r.type === 'EXPERIENTIAL' && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.isTaskCreated ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          {r.isTaskCreated ? '업무 연동됨' : '연동 대기'}
                        </span>
                      )}
                      <button onClick={() => removeRecord(r.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl">
                  <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold">등록된 출결 기록이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentBirthdayView: React.FC<{
  birthdays: StudentBirthday[];
  onUpdateBirthdays: (newBirthdays: StudentBirthday[]) => void;
}> = ({ birthdays, onUpdateBirthdays }) => {
  const [name, setName] = useState('');
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');

  const addBirthday = () => {
    if (!name.trim()) return;
    const newBirthday: StudentBirthday = { id: crypto.randomUUID(), name: name.trim(), month, day };
    onUpdateBirthdays([...birthdays, newBirthday]);
    setName('');
  };

  const removeBirthday = (id: string) => onUpdateBirthdays(birthdays.filter(b => b.id !== id));

  const filteredBirthdays = birthdays
    .filter(b => b.name.includes(searchTerm))
    .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><UserPlus size={20} className="text-pink-500" /> 생일 정보 등록</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">학생 이름</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 홍길동" className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-bold" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">월</label>
                  <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-bold">
                    {Array.from({ length: 12 }, (_, i) => (<option key={i+1} value={i+1}>{i+1}월</option>))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">일</label>
                  <select value={day} onChange={e => setDay(parseInt(e.target.value))} className="w-full p-4 mt-1 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-bold">
                    {Array.from({ length: 31 }, (_, i) => (<option key={i+1} value={i+1}>{i+1}일</option>))}
                  </select>
                </div>
              </div>
              <button onClick={addBirthday} disabled={!name.trim()} className="w-full py-4 bg-pink-500 text-white font-bold rounded-2xl hover:bg-pink-600 shadow-lg shadow-pink-100 transition-all active:scale-[0.98] mt-2">등록하기</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">생일 목록</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="이름으로 검색..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBirthdays.length > 0 ? (filteredBirthdays.map((b) => (
                <div key={b.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-pink-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-black text-lg">{b.name[0]}</div>
                    <div><div className="text-md font-bold text-slate-800">{b.name}</div><div className="text-xs text-slate-400 font-bold tracking-wider">{b.month}월 {b.day}일</div></div>
                  </div>
                  <button onClick={() => removeBirthday(b.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
              ))) : (<div className="col-span-full py-20 text-center text-slate-300">생일 정보가 없습니다.</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SeatArrangementView: React.FC = () => {
  const [studentCount, setStudentCount] = useState<number>(24);
  const [seats, setSeats] = useState<(number | null)[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const generateSeats = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const arr = Array.from({ length: studentCount }, (_, i) => i + 1);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setSeats(arr);
      setIsShuffling(false);
    }, 800);
  };
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4"><div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Users size={24} /></div><div><h2 className="text-xl font-black text-slate-800 tracking-tight">랜덤 자리 배치</h2><p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Student Seat Arrangement</p></div></div>
        <div className="flex items-center gap-4 w-full md:w-auto"><div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-2xl"><span className="text-xs font-bold text-slate-400 px-2">총 학생 수</span><input type="number" value={studentCount} onChange={e => setStudentCount(parseInt(e.target.value) || 0)} className="w-16 p-2 bg-white border border-slate-200 rounded-xl outline-none text-center font-bold text-slate-700" /></div><button onClick={generateSeats} disabled={isShuffling || studentCount <= 0} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:bg-slate-200 transition-all">{isShuffling ? <RefreshCw className="animate-spin" /> : <Shuffle size={20} />}배치하기</button></div>
      </div>
      {seats.length > 0 && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm relative">
          <div className="flex justify-center mb-16"><div className="w-64 h-8 bg-slate-800 rounded-b-3xl flex items-center justify-center text-white gap-2 shadow-2xl tracking-widest text-[10px] uppercase">FRONT / TV</div></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 max-w-4xl mx-auto">
            {Array.from({ length: Math.ceil(seats.length / 2) }).map((_, deskIdx) => (
              <div key={deskIdx} className="flex flex-col gap-2">
                <div className="text-[10px] font-black text-slate-300 text-center uppercase">Desk {deskIdx + 1}</div>
                <div className="flex gap-2 p-3 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                  <div className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl text-center text-2xl font-black text-indigo-600">{seats[deskIdx*2]}</div>
                  <div className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl text-center text-2xl font-black text-indigo-600">{seats[deskIdx*2+1] || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CalendarView: React.FC<{ events: SchoolEvent[]; onUpdateEvents: (newEvents: SchoolEvent[]) => void; }> = ({ events, onUpdateEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventInput, setEventInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const handleDayClick = (d: number) => {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSelectedDate(s);
    setEventInput(events.find(e => e.date === s)?.title || '');
  };

  const saveEvent = () => {
    if (!selectedDate) return;
    const filtered = events.filter(e => e.date !== selectedDate);
    if (eventInput.trim()) filtered.push({ date: selectedDate, title: eventInput.trim() });
    onUpdateEvents(filtered);
    setSelectedDate(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let extractedEvents: SchoolEvent[] = [];
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          extractedEvents = await parseCalendarFromImage(base64, file.type);
          if (extractedEvents.length > 0) {
            onUpdateEvents([...events, ...extractedEvents]);
            alert(`${extractedEvents.length}개의 일정이 추가되었습니다.`);
          } else {
            alert('일정을 추출하지 못했습니다. 파일 내용을 확인해주세요.');
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        extractedEvents = await parseCalendarFromText(text);
        if (extractedEvents.length > 0) {
          onUpdateEvents([...events, ...extractedEvents]);
          alert(`${extractedEvents.length}개의 일정이 추가되었습니다.`);
        } else {
          alert('일정을 추출하지 못했습니다. 파일 내용을 확인해주세요.');
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error(error);
      alert('파일 처리 중 오류가 발생했습니다.');
      setIsUploading(false);
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-24 sm:h-32 border-b border-r border-slate-100 bg-slate-50/30"></div>);
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ev = events.find(e => e.date === s);
    const today = new Date().toDateString() === new Date(year, month, d).toDateString();
    days.push(<div key={d} onClick={() => handleDayClick(d)} className={`h-24 sm:h-32 border-b border-r border-slate-100 p-2 cursor-pointer hover:bg-blue-50/50 ${today ? 'bg-blue-50/30' : 'bg-white'}`}><div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${today ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{d}</div>{ev && <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-200 truncate mt-1">{ev.title}</div>}</div>);
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800">{year}년 {month + 1}월</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold">오늘</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight/></button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".txt,.csv,.png,.jpg,.jpeg"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all disabled:bg-slate-300"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              학사 일정 업로드
            </button>
            <div className="text-[10px] text-slate-400 font-medium max-w-[150px] leading-tight">
              텍스트 파일이나 이미지(식단표/가정통신문 등)를 업로드하면 일정을 자동 추출합니다.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 border-l border-slate-100">{days}</div>
      </div>
      {selectedDate && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"><div className="bg-white w-full max-w-sm rounded-3xl p-8"><h3 className="font-bold mb-4">{selectedDate} 일정</h3><input value={eventInput} onChange={e => setEventInput(e.target.value)} placeholder="행사명" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-200 mb-6" /><div className="flex gap-2"><button onClick={() => setSelectedDate(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">취소</button><button onClick={saveEvent} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">저장</button></div></div></div>}
    </div>
  );
};

export const ReportCardView: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try { const t = await generateReportComments(studentInfo, keywords); setResult(t || ''); } catch (e) { alert('오류 발생'); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"><h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-blue-600 rounded-full"></span>생기부 자동완성</h2><div className="space-y-4"><div><label className="block text-sm font-bold text-slate-700 mb-2">학생 기초 정보 및 관찰 내용</label><textarea value={studentInfo} onChange={e => setStudentInfo(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl h-40 text-sm" placeholder="학생 특징..." /></div><div><label className="block text-sm font-bold text-slate-700 mb-2">키워드</label><input value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl" placeholder="키워드..." /></div><button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'AI 생성'}</button></div></div>
      {result && <div className="bg-white p-8 rounded-2xl border-2 border-blue-50 shadow-xl"><div className="p-6 bg-slate-50 rounded-xl text-sm leading-8 whitespace-pre-wrap">{result}</div></div>}
    </div>
  );
};

export const LessonPlanView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState(profile.grade);
  const [result, setResult] = useState<LessonPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setTopic(topic);
    setLoading(true);
    try { const d = await generateLessonPlan(topic, grade); setResult(d); } catch (e) { alert('오류'); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"><h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-indigo-600 rounded-full"></span>수업 지도안 설계</h2><div className="grid grid-cols-2 gap-4 mb-4"><input placeholder="학년" value={grade} onChange={e => setGrade(e.target.value)} className="p-4 bg-slate-50 rounded-xl outline-none" /><input placeholder="주제" value={topic} onChange={e => setTopic(e.target.value)} className="p-4 bg-slate-50 rounded-xl outline-none" /></div><button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl">{loading ? <Loader2 className="animate-spin mx-auto"/> : '지도안 생성'}</button></div>
      {result && <div className="space-y-6"><div className="bg-white p-10 rounded-2xl border border-slate-200 whitespace-pre-wrap text-sm">{result.text}</div><div className="bg-white p-10 rounded-2xl border border-indigo-100"><h3 className="font-bold mb-4">외부 자료 추천</h3><div className="grid grid-cols-2 gap-4">{result.links.map((l, i) => (<a key={i} href={l.uri} target="_blank" className="p-4 border rounded-xl hover:bg-indigo-50 block truncate text-sm font-bold">{l.title}</a>))}</div></div></div>}
    </div>
  );
};

export const CommemorationView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [occasion, setOccasion] = useState('');
  const [result, setResult] = useState<{text: string; links: any[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try { const d = await getCommemorationMaterials(occasion); setResult(d); } catch (e) { alert('오류'); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border"><h2 className="text-2xl font-bold mb-6">계기교육 자료실</h2><div className="flex gap-4"><input value={occasion} onChange={e => setOccasion(e.target.value)} className="flex-1 p-4 bg-slate-50 rounded-xl outline-none" placeholder="기념일 입력..." /><button onClick={handleGenerate} className="px-8 bg-red-600 text-white font-bold rounded-xl">{loading ? <Loader2 className="animate-spin"/> : '자료 생성'}</button></div></div>
      {result && <div className="space-y-6"><div className="bg-white p-10 rounded-2xl border text-sm whitespace-pre-wrap">{result.text}</div></div>}
    </div>
  );
};

export const QuizGenView: React.FC = () => {
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try { 
      const t = await generateQuiz(content, 5); 
      setResult(t || ''); 
    } catch (e) { 
      alert('오류'); 
    } finally { 
      setLoading(false); 
    }
  };

  const getQRUrl = () => {
    const encodedData = btoa(encodeURIComponent(result));
    return `${window.location.origin}${window.location.pathname}?view=quiz&data=${encodedData}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
          AI 퀴즈 생성기
        </h2>
        <div className="space-y-4">
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl h-48 focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-400 outline-none transition-all text-sm font-medium" 
            placeholder="수업 내용이나 텍스트를 입력하면 AI가 퀴즈를 만들어 드립니다." 
          />
          <button 
            onClick={handleGenerate} 
            disabled={loading || !content.trim()}
            className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all active:scale-[0.98] disabled:bg-slate-200"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '맞춤형 퀴즈 생성하기'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest">생성된 퀴즈</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowQR(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"
                >
                  <QrCode size={14} /> QR로 공유하기
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    alert('클립보드에 복사되었습니다.');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  <Copy size={14} /> 복사하기
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm font-medium">
              {result}
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">학생용 퀴즈 QR 코드</h3>
              <button onClick={() => setShowQR(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-10 flex flex-col items-center gap-6">
              <div className="p-4 bg-white border-4 border-slate-50 rounded-3xl shadow-inner">
                <QRCodeSVG value={getQRUrl()} size={200} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">학생들이 카메라로 스캔하면</p>
                <p className="text-xs text-slate-400 mt-1">퀴즈를 바로 확인할 수 있습니다.</p>
              </div>
              <button 
                onClick={() => setShowQR(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ParentNoticeView: React.FC = () => {
  const [context, setContext] = useState('');
  const [grade, setGrade] = useState('1학년');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try { const t = await generateParentNotice(context, grade); setResult(t || ''); } catch (e) { alert('오류'); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
          알림장 도우미
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">대상 학년 선택</label>
            <div className="flex flex-wrap gap-2">
              {['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    grade === g 
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-100' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">알림장 상황 입력</label>
            <textarea 
              value={context} 
              onChange={e => setContext(e.target.value)} 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl h-40 focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm" 
              placeholder="예: 내일 현장체험학습 준비물 안내, 미세먼지 심할 때 등교 안내 등" 
            />
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loading || !context.trim()}
            className="w-full py-4 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 shadow-lg shadow-pink-100 transition-all active:scale-[0.98] disabled:bg-slate-200"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '맞춤형 알림장 문구 생성'}
          </button>
        </div>
      </div>
      {result && (
        <div className="bg-white p-10 rounded-2xl border-2 border-pink-50 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-pink-600 uppercase tracking-widest">생성된 알림장 초안</h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('클립보드에 복사되었습니다.');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors"
            >
              <Copy size={14} /> 복사하기
            </button>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl text-sm leading-8 whitespace-pre-wrap text-slate-700 font-medium">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};
