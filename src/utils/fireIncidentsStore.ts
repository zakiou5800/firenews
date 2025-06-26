import { create } from 'zustand';
import brain from 'brain';
import { type FireIncident } from 'types';

interface FireIncidentsState {
  incidents: FireIncident[];
  loading: boolean;
  error: string | null;
  lastFetch: number;
  fetchIncidents: () => Promise<void>;
  setIncidents: (incidents: FireIncident[]) => void;
  clearError: () => void;
}

const CACHE_DURATION = 10000; // 10 seconds cache

export const useFireIncidentsStore = create<FireIncidentsState>((set, get) => ({
  incidents: [],
  loading: false,
  error: null,
  lastFetch: 0,

  fetchIncidents: async () => {
    const state = get();
    const now = Date.now();
    
    // Prevent duplicate calls if recently fetched
    if (state.loading || (now - state.lastFetch < CACHE_DURATION)) {
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const response = await brain.get_active_fires();
      if (response.ok) {
        const data = await response.json();
        // Sort by timestamp, newest first
        data.sort((a: FireIncident, b: FireIncident) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        set({ 
          incidents: data, 
          loading: false, 
          lastFetch: now 
        });
      } else {
        set({ 
          error: 'Failed to fetch active fires.',
          loading: false 
        });
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      set({ 
        error: 'An error occurred while fetching active fires.',
        loading: false 
      });
    }
  },

  setIncidents: (incidents: FireIncident[]) => {
    set({ incidents });
  },

  clearError: () => {
    set({ error: null });
  },
}));
