import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface ClusterConfig {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  use_ssl: boolean;
  force_path_style: boolean;
  admin_endpoint: string;
  admin_token: string;
}

interface ClusterStore {
  clusters: ClusterConfig[];
  activeClusterId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchClusters: () => Promise<void>;
  addCluster: (config: Omit<ClusterConfig, 'id'>) => Promise<void>;
  deleteCluster: (id: string) => Promise<void>;
  setActiveCluster: (id: string | null) => void;
}

export const useClusterStore = create<ClusterStore>()(
  persist(
    (set, get) => ({
      clusters: [],
      activeClusterId: null,
      isLoading: false,
      error: null,

      fetchClusters: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get<{ clusters: ClusterConfig[] }>('/v1/panel/clusters');
          const clusters = response.data.clusters || [];
          set({ clusters, isLoading: false });
          
          // Auto-select first cluster if none is active
          if (clusters.length > 0 && !get().activeClusterId) {
            get().setActiveCluster(clusters[0].id);
          } else if (clusters.length === 0 && get().activeClusterId) {
            get().setActiveCluster(null);
          }
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch clusters', isLoading: false });
        }
      },

      addCluster: async (config) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<{ cluster: ClusterConfig }>('/v1/panel/clusters', config);
          const newCluster = response.data.cluster;
          const clusters = [...get().clusters, newCluster];
          set({ clusters, isLoading: false });
          
          if (!get().activeClusterId) {
            get().setActiveCluster(newCluster.id);
          }
        } catch (err: any) {
          set({ error: err.message || 'Failed to add cluster', isLoading: false });
          throw err;
        }
      },

      deleteCluster: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await api.delete(`/v1/panel/clusters/${id}`);
          const clusters = get().clusters.filter((c) => c.id !== id);
          set({ clusters, isLoading: false });
          
          if (get().activeClusterId === id) {
            get().setActiveCluster(clusters.length > 0 ? clusters[0].id : null);
          }
        } catch (err: any) {
          set({ error: err.message || 'Failed to delete cluster', isLoading: false });
          throw err;
        }
      },

      setActiveCluster: (id) => {
        if (id) {
          localStorage.setItem('cluster-id', id);
        } else {
          localStorage.removeItem('cluster-id');
        }
        set({ activeClusterId: id });
        
        // Trigger a page reload when switching clusters to re-fetch all data
        // Only if we're not just initializing
        if (id && get().activeClusterId && get().activeClusterId !== id) {
           window.location.reload();
        }
      },
    }),
    {
      name: 'cluster-storage',
      partialize: (state) => ({
        activeClusterId: state.activeClusterId,
      }),
    }
  )
);
