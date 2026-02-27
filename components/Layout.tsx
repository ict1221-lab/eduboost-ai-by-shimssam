
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Bell, 
  Settings, 
  Sparkles,
  HelpCircle,
  Flag,
  Edit2,
  Calendar as CalendarIcon,
  Users,
  Gift,
  ClipboardCheck,
  BookMarked
} from 'lucide-react';
import { ToolType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: ToolType;
  setActiveTab: (tab: ToolType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: ToolType.DASHBOARD, label: '대시보드', icon: LayoutDashboard },
    { id: ToolType.CALENDAR, label: '학사 일정 관리', icon: CalendarIcon },
    { id: ToolType.ATTENDANCE, label: '출결 및 체험학습', icon: ClipboardCheck },
    { id: ToolType.REPORT_CARD, label: '생기부 자동완성', icon: FileText },
    { id: ToolType.STUDENT_RECORD_GUIDE, label: '생기부 기재요령 Q&A', icon: BookMarked },
    { id: ToolType.LESSON_PLAN, label: '수업 지도안 생성', icon: BookOpen },
    { id: ToolType.COMMEMORATION, label: '계기교육 자료실', icon: Flag },
    { id: ToolType.QUIZ_GEN, label: 'AI 퀴즈 생성기', icon: HelpCircle },
    { id: ToolType.PARENT_NOTICE, label: '알림장 도우미', icon: Bell },
    { id: ToolType.SEAT_ARRANGEMENT, label: '학생 자리 배치', icon: Users },
    { id: ToolType.STUDENT_BIRTHDAY, label: '학생 생일 알림판', icon: Gift },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          EduBoost AI
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all">
          <Settings size={18} />
          <span className="text-sm font-medium">환경 설정</span>
        </button>
      </div>
    </aside>
  );
};

interface HeaderProps {
  profile: UserProfile;
  onEditProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onEditProfile }) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayStr = days[today.getDay()];

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</span>
        <span className="text-sm font-medium text-slate-400">{dateStr} {dayStr}요일</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onEditProfile}>
          <div className="flex flex-col items-end">
            <div className="text-sm font-bold text-slate-700">{profile.name} <span className="text-blue-500">선생님</span></div>
            <div className="text-[11px] text-slate-400">{profile.schoolName} {profile.grade}</div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md">
              {profile.name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white border border-slate-100 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={10} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
