import { create } from 'zustand';
import { enableDemoSession, disableDemoSession, isDemoSession } from '../demo/demoData.js';

export const useDemoStore = create((set) => ({
  isDemoMode: isDemoSession(),

  enterDemo: () => {
    enableDemoSession();
    set({ isDemoMode: true });
  },

  exitDemo: () => {
    disableDemoSession();
    set({ isDemoMode: false });
  },
}));
