import { User, UserRole } from '../types';

const STORAGE_KEY_USERS = 'gitgenius_users';
const STORAGE_KEY_SESSION = 'gitgenius_session';

// Internal interface to include password in storage, 
// but not expose it in the general User type used by the app.
interface StoredUser extends User {
  password?: string; 
}

export const registerUser = (name: string, email: string, password: string, role: UserRole): User => {
  const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
  const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];

  if (users.find(u => u.email === email)) {
    throw new Error('User already exists');
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    password // Store the password
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  // Return user without password for session
  const { password: _, ...userSession } = newUser;
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userSession));
  
  return userSession;
};

export const loginUser = (email: string, password: string): User => {
  const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
  const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found. Please register.');
  }

  // Check if password matches
  if (user.password !== password) {
    throw new Error('Invalid email or password');
  }

  // Return user without password
  const { password: _, ...userSession } = user;
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userSession));
  return userSession;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY_SESSION);
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const sessionStr = localStorage.getItem(STORAGE_KEY_SESSION);
  return sessionStr ? JSON.parse(sessionStr) : null;
};