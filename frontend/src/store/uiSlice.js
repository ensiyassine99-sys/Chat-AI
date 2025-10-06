import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: true,
  mobileSidebarOpen: false,
  language: localStorage.getItem('language') || 'en',
  soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
  autoScroll: true,
  fontSize: localStorage.getItem('fontSize') || 'medium',
  showOnlineUsers: false,
  showTypingIndicator: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      
      // Apply theme to document
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', state.theme);
      
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', state.language);
      
      // Apply RTL if Arabic
      document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = state.language;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('soundEnabled', state.soundEnabled);
    },
    toggleAutoScroll: (state) => {
      state.autoScroll = !state.autoScroll;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
      localStorage.setItem('fontSize', state.fontSize);
    },
    toggleOnlineUsers: (state) => {
      state.showOnlineUsers = !state.showOnlineUsers;
    },
    toggleTypingIndicator: (state) => {
      state.showTypingIndicator = !state.showTypingIndicator;
    },
    resetUISettings: (state) => {
      Object.assign(state, initialState);
      localStorage.removeItem('theme');
      localStorage.removeItem('language');
      localStorage.removeItem('soundEnabled');
      localStorage.removeItem('fontSize');
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  toggleMobileSidebar,
  setLanguage,
  toggleSound,
  toggleAutoScroll,
  setFontSize,
  toggleOnlineUsers,
  toggleTypingIndicator,
  resetUISettings,
} = uiSlice.actions;

export default uiSlice.reducer;