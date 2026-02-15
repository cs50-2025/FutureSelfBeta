import { UserProfile, ChatMessage, UserStats } from '../types';

const STORAGE_KEY = 'futureself_users_db';

const ADMIN_USER = {
  id: 'admin-seed-id',
  username: 'Admin1',
  firstName: 'Admin',
  lastName: 'User',
  age: 30,
  avatarUrl: undefined,
  friends: [],
  stats: {
    level: 50,
    xp: 25000,
    intelligence: 85,
    vitality: 85,
    strength: 85,
    discipline: 90,
    peace: 90,
    totalStudySessions: 100,
    totalWorkouts: 100,
    totalMeditations: 100,
    currentStress: 2
  },
  chatHistory: [],
  activityLog: [],
  password: 'qwerty@@' 
};

// Helper to get all users
const getUsers = (): UserProfile[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let users = stored ? JSON.parse(stored) : [];
  
  // Auto-inject Admin if missing
  if (!users.find((u: any) => u.username === ADMIN_USER.username)) {
    users.push(ADMIN_USER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  
  return users;
};

// Helper to save users
const saveUsers = (users: UserProfile[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const registerUser = (user: Omit<UserProfile, 'id' | 'friends' | 'stats' | 'chatHistory' | 'activityLog'>, password: string): UserProfile => {
  const users = getUsers();
  
  if (users.find(u => u.username === user.username)) {
    throw new Error('Username already exists');
  }

  const initialStats: UserStats = {
    level: 1,
    xp: 0,
    intelligence: 0,
    vitality: 0,
    strength: 0,
    discipline: 0,
    peace: 0,
    totalStudySessions: 0,
    totalWorkouts: 0,
    totalMeditations: 0,
    currentStress: 10 // Starts high, goal is to lower it
  };

  const newUser: UserProfile = {
    ...user,
    id: crypto.randomUUID(),
    friends: [],
    chatHistory: [],
    activityLog: [],
    stats: initialStats
  };

  // Store password separately or in same obj (Insecure for real apps, fine for mock)
  const dbEntry = { ...newUser, password };
  
  saveUsers([...users, dbEntry as any]);
  return newUser;
};

export const loginUser = (username: string, password: string): UserProfile => {
  const users = getUsers();
  const user = users.find(u => u.username === username && (u as any).password === password);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  return user;
};

export const updateUser = (id: string, updates: Partial<UserProfile>): UserProfile => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) throw new Error('User not found');
  
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  saveUsers(users);
  
  return updatedUser;
};

export const saveChatHistory = (userId: string, messages: ChatMessage[]) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].chatHistory = messages;
    saveUsers(users);
  }
};