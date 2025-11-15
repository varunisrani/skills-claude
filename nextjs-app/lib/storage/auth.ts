import { storage } from './localStorage';

const AUTH_KEY = 'github_auth_token';
const USER_KEY = 'github_user_data';

export const authStorage = {
  getToken: () => storage.get<string>(AUTH_KEY),

  setToken: (token: string) => {
    storage.set(AUTH_KEY, token);
  },

  removeToken: () => {
    storage.remove(AUTH_KEY);
    storage.remove(USER_KEY);
  },

  getUser: () => storage.get<any>(USER_KEY),

  setUser: (user: any) => {
    storage.set(USER_KEY, user);
  },

  isAuthenticated: () => !!storage.get<string>(AUTH_KEY),
};
