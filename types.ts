
export enum ToolType {
  REPORT_CARD = 'REPORT_CARD',
  LESSON_PLAN = 'LESSON_PLAN',
  PARENT_NOTICE = 'PARENT_NOTICE',
  QUIZ_GEN = 'QUIZ_GEN',
  DASHBOARD = 'DASHBOARD',
  COMMEMORATION = 'COMMEMORATION',
  CALENDAR = 'CALENDAR',
  SEAT_ARRANGEMENT = 'SEAT_ARRANGEMENT',
  STUDENT_BIRTHDAY = 'STUDENT_BIRTHDAY',
  ATTENDANCE = 'ATTENDANCE',
  STUDENT_RECORD_GUIDE = 'STUDENT_RECORD_GUIDE'
}

export interface UserProfile {
  name: string;
  schoolName: string;
  grade: string;
}

export interface StudentBirthday {
  id: string;
  name: string;
  month: number;
  day: number;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  type: 'ABSENCE' | 'EXPERIENTIAL' | 'SICKNESS' | 'EARLY_LEAVE';
  startDate: string;
  endDate: string;
  reason: string;
  isTaskCreated: boolean;
}

export interface SchoolEvent {
  date: string; // YYYY-MM-DD
  title: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'High' | 'Med' | 'Low';
}

export interface AIResponse {
  content: string;
  timestamp: Date;
}
