import api from './client'

export interface LiveMetrics {
  real_lambda: number
  real_W: number
  real_L: number
  real_request_count: number
  sim_lambda: number
  sim_W: number
  sim_L: number
  sim_running: boolean
  health: 'healthy' | 'degraded' | 'overloaded'
  timestamp: string
}

export interface DataPoint {
  timestamp: string
  real_lambda: number
  real_W: number
  real_L: number
  sim_lambda: number
  sim_W: number
  sim_L: number
}

export interface SimulatorStatus {
  running: boolean
  arrival_rate: number
  mean_response_time: number
  response_time_std: number
  mode: string
}

export interface AdminStats {
  total_students: number
  total_exams: number
  total_submissions: number
  total_results: number
  active_exams: number
}

export const metricsApi = {
  getLive: () => api.get<LiveMetrics>('/api/metrics/live'),
  getHistory: () => api.get<DataPoint[]>('/api/metrics/history'),

  startSimulator: (config: {
    arrival_rate: number
    mean_response_time: number
    response_time_std?: number
    mode?: string
  }) => api.post('/api/metrics/simulator/start', config),

  applyPreset: (preset: string) =>
    api.post(`/api/metrics/simulator/preset/${preset}`),

  pauseSimulator: () => api.post('/api/metrics/simulator/pause'),
  resetSimulator: () => api.post('/api/metrics/simulator/reset'),
  getSimulatorStatus: () => api.get<SimulatorStatus>('/api/metrics/simulator/status'),

  adminDashboard: () => api.get<AdminStats>('/api/admin/dashboard'),
  allSubmissions: () => api.get<any[]>('/api/admin/submissions'),
}
