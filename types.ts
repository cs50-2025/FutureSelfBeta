
export interface UserHabits {
  sleepHours: number;    // 4-10
  studyHours: number;    // 0-30
  screenTime: number;    // 0-10
  exerciseDays: number;  // 0-7
  stressLevel: number;   // 1-10
}

export interface SimulationMetrics {
  academicScore: number;
  burnoutRisk: number;
  healthScore: number;
  projectionData: ProjectionPoint[];
  biggestImpact: string;
}

export interface ProjectionPoint {
  year: number;
  academic: number;
  burnout: number;
  health: number;
}

export enum MetricType {
  ACADEMIC = 'ACADEMIC',
  BURNOUT = 'BURNOUT',
  HEALTH = 'HEALTH'
}

// --- User & Auth Types ---

export interface UserStats {
  level: number;
  xp: number;
  // Cumulative Stats (Start at 0, grow with action)
  intelligence: number; 
  vitality: number;
  strength: number;
  discipline: number;
  peace: number; 
  // Session Counts
  totalStudySessions: number;
  totalWorkouts: number;
  totalMeditations: number;
  // Stress Management (Starts at 10, goes down)
  currentStress: number;
}

export interface ActivityLog {
  id: string;
  type: 'study' | 'workout' | 'meditate';
  description: string;
  timestamp: number;
  xpEarned: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface StudyProfile {
  role: 'School' | 'College' | 'Job';
  detail: string;
}

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  age: number;
  avatarUrl?: string; // Base64 string
  friends: string[]; // List of friend IDs
  stats: UserStats;
  chatHistory: ChatMessage[];
  activityLog: ActivityLog[];
  studyProfile?: StudyProfile;
}

export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  avatar?: string;
}

// --- Workout Types ---

export interface Drill {
  name: string;
  reps: number;
  instruction: string;
}

export interface WorkoutPlan {
  sport: string;
  drills: Drill[];
}

// --- Yoga/Meditation Types ---

export interface YogaPose {
  name: string;
  durationSeconds: number; // Time to hold pose
  instruction: string;     // How to do it
  benefit: string;         // Why we do it
  encouragement: string[]; // Specific tips to show during timer
}

export interface YogaPlan {
  planName: string;
  forAge: number;
  poses: YogaPose[];
}

// --- Study Types ---

export interface StudyCurriculum {
  title: string;
  description: string;
  units: StudyUnit[];
}

export interface StudyUnit {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  glossary?: Record<string, string>; // Term: Definition
}

export interface StudyLesson {
  title: string;
  content: string; // Markdown supported
  quiz: QuizQuestion[];
}
