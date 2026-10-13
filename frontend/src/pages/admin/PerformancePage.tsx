import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  metricsApi,
  type LiveMetrics,
  type DataPoint,
  type SimulatorStatus,
} from '../../api/metrics'

interface AutoScaleEvent {
  id: string
  timestamp: string
  type: 'scale_out' | 'scale_in' | 'init'
  vms: number
  previousVms: number
  threads: number
  reason: string
}

export default function PerformancePage() {
  // Live metrics state
  const [live, setLive] = useState<LiveMetrics>({
    real_lambda: 0,
    real_W: 0,
    real_L: 0,
    real_request_count: 0,
    sim_lambda: 1200,
    sim_W: 0.25,
    sim_L: 300,
    sim_running: false,
    health: 'healthy',
    timestamp: new Date().toISOString(),
  })

  // History buffer state
  const [history, setHistory] = useState<DataPoint[]>([])
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null)
  const [pollingActive, setPollingActive] = useState(true)
  const [lastTick, setLastTick] = useState<Date>(new Date())

  // Sliders state
  const [sliderLambda, setSliderLambda] = useState<number>(1200)
  const [sliderW, setSliderW] = useState<number>(0.25)
  const [actionLoading, setActionLoading] = useState(false)

  // Thread estimation config
  const [threadsPerVm, setThreadsPerVm] = useState<number>(100)

  // Scale events log
  const [scaleEvents, setScaleEvents] = useState<AutoScaleEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'init',
      vms: 3,
      previousVms: 0,
      threads: 300,
      reason: 'Baseline cluster provisioned for 300 concurrent requests.',
    },
  ])

  // Track previous VM count to detect scale events
  const prevVmsRef = useRef<number>(3)

  // ── Polling Loop (every 1 second) ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      try {
        const [liveRes, histRes, statusRes] = await Promise.all([
          metricsApi.getLive(),
          metricsApi.getHistory(),
          metricsApi.getSimulatorStatus().catch(() => null),
        ])

        if (!isMounted) return

        if (liveRes?.data) {
          setLive(liveRes.data)
        }
        if (histRes?.data) {
          // Keep last 60 points
          setHistory(histRes.data.slice(-60))
        }
        if (statusRes?.data) {
          setSimulatorStatus(statusRes.data)
        }
        setLastTick(new Date())
      } catch (err) {
        // Telemetry fetch failed silently during polling
        console.error('Metrics polling error:', err)
      }
    }

    // Immediate initial fetch
    fetchMetrics()

    // 1000ms polling interval
    const interval = setInterval(() => {
      if (pollingActive) {
        fetchMetrics()
      }
    }, 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [pollingActive])

  // ── Auto-Scaling Event Trigger ────────────────────────────────────────────
  const estimatedThreads = Math.max(0, live.sim_lambda * live.sim_W)
  const currentRequiredVms = Math.min(12, Math.max(1, Math.ceil(estimatedThreads / Math.max(1, threadsPerVm))))

  useEffect(() => {
    if (prevVmsRef.current !== currentRequiredVms) {
      const prev = prevVmsRef.current
      const isScaleOut = currentRequiredVms > prev
      const newEvent: AutoScaleEvent = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: isScaleOut ? 'scale_out' : 'scale_in',
        vms: currentRequiredVms,
        previousVms: prev,
        threads: Math.round(estimatedThreads),
        reason: isScaleOut
          ? `Scale-out: Increased from ${prev} to ${currentRequiredVms} VMs to absorb ~${Math.round(
              estimatedThreads
            )} concurrent requests (${threadsPerVm} threads/VM cap).`
          : `Scale-in: Workload decreased to ~${Math.round(
              estimatedThreads
            )} concurrent requests. Reduced cluster from ${prev} to ${currentRequiredVms} VMs.`,
      }

      setScaleEvents((prevEvents) => [newEvent, ...prevEvents.slice(0, 9)])
      prevVmsRef.current = currentRequiredVms
    }
  }, [currentRequiredVms, estimatedThreads, threadsPerVm])

  // ── Simulator Control Handlers ────────────────────────────────────────────
  const handleApplyPreset = async (
    presetKey: string,
    lambdaVal: number,
    wVal: number
  ) => {
    setActionLoading(true)
    try {
      setSliderLambda(lambdaVal)
      setSliderW(wVal)
      await metricsApi.applyPreset(presetKey)
      const [liveRes, statusRes] = await Promise.all([
        metricsApi.getLive(),
        metricsApi.getSimulatorStatus(),
      ])
      setLive(liveRes.data)
      setSimulatorStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to apply preset:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartCustom = async () => {
    setActionLoading(true)
    try {
      await metricsApi.startSimulator({
        arrival_rate: sliderLambda,
        mean_response_time: sliderW,
        mode: 'custom',
      })
      const [liveRes, statusRes] = await Promise.all([
        metricsApi.getLive(),
        metricsApi.getSimulatorStatus(),
      ])
      setLive(liveRes.data)
      setSimulatorStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to start simulator:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    try {
      await metricsApi.pauseSimulator()
      const [liveRes, statusRes] = await Promise.all([
        metricsApi.getLive(),
        metricsApi.getSimulatorStatus(),
      ])
      setLive(liveRes.data)
      setSimulatorStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to pause simulator:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReset = async () => {
    setActionLoading(true)
    try {
      await metricsApi.resetSimulator()
      setSliderLambda(0)
      setSliderW(0.1)
      const [liveRes, statusRes] = await Promise.all([
        metricsApi.getLive(),
        metricsApi.getSimulatorStatus(),
      ])
      setLive(liveRes.data)
      setSimulatorStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to reset simulator:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Health Badge Helper ───────────────────────────────────────────────────
  const getHealthBadge = (health: string) => {
    if (health === 'healthy') {
      return (
        <span className="badge badge-green flex items-center gap-1.5 px-3 py-1 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Healthy
        </span>
      )
    }
    if (health === 'degraded') {
      return (
        <span className="badge badge-yellow flex items-center gap-1.5 px-3 py-1 font-semibold">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          System Degraded
        </span>
      )
    }
    return (
      <span className="badge badge-red flex items-center gap-1.5 px-3 py-1 font-semibold">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        System Overloaded
      </span>
    )
  }

  // ── Chart Data Preparations ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      // Mock initial placeholder points if history empty
      return Array.from({ length: 20 }).map((_, i) => ({
        time: `${i}s`,
        sim_lambda: live.sim_lambda,
        sim_W: live.sim_W,
        sim_L: live.sim_L,
        real_lambda: live.real_lambda,
        real_W: live.real_W,
        real_L: live.real_L,
      }))
    }

    return history.map((dp, idx) => {
      let formattedTime = `${idx}s`
      if (dp.timestamp) {
        try {
          const d = new Date(dp.timestamp)
          formattedTime = d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        } catch {
          formattedTime = `${idx}s`
        }
      }
      return {
        time: formattedTime,
        sim_lambda: Math.round(dp.sim_lambda * 10) / 10,
        sim_W: Math.round(dp.sim_W * 1000) / 1000,
        sim_L: Math.round(dp.sim_L * 10) / 10,
        real_lambda: Math.round(dp.real_lambda * 10) / 10,
        real_W: Math.round(dp.real_W * 1000) / 1000,
        real_L: Math.round(dp.real_L * 10) / 10,
      }
    })
  }, [history, live])

  // Scenario Comparison Data (Bar Chart)
  const scenarioData = useMemo(() => {
    return [
      {
        scenario: 'Scenario 1: Baseline',
        lambda: 1200,
        response_time: 0.25,
        occupancy: 300,
        description: 'λ = 1,200 req/s, W = 0.25s',
      },
      {
        scenario: 'Scenario 2: DB Slowdown',
        lambda: 1200,
        response_time: 0.50,
        occupancy: 600,
        description: 'λ = 1,200 req/s, W = 0.50s',
      },
      {
        scenario: 'Current Live Sim',
        lambda: Math.round(live.sim_lambda),
        response_time: Math.round(live.sim_W * 100) / 100,
        occupancy: Math.round(live.sim_L),
        description: `λ = ${Math.round(live.sim_lambda)}, W = ${live.sim_W.toFixed(2)}s`,
      },
    ]
  }, [live.sim_lambda, live.sim_W, live.sim_L])

  // Pre-generate 12 VM items
  const vmCards = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const vmId = i + 1
      const isActive = vmId <= currentRequiredVms
      return {
        id: vmId,
        name: `app-vm-${String(vmId).padStart(2, '0')}`,
        status: isActive ? 'active' : 'idle',
        port: 8080 + vmId,
      }
    })
  }, [currentRequiredVms])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── SECTION A: Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600" />
              System Performance & Little's Law Monitor
            </h1>
            {getHealthBadge(live.health)}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Live monitoring of system metrics with Little's Law analysis (L = λ × W) and cloud elasticity simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPollingActive(!pollingActive)}
            className={`btn btn-sm ${
              pollingActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'btn-secondary'
            }`}
            title="Toggle 1-second auto-refresh"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${pollingActive ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3s' }}
            />
            <span>{pollingActive ? 'Polling Active (1s)' : 'Polling Paused'}</span>
          </button>

          <Link to="/admin/report" className="btn btn-secondary btn-sm">
            <span>Read Academic Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── SECTION B: Little's Law Formula Card ────────────────────────── */}
      <div className="card p-6 border-primary-200 bg-gradient-to-br from-white via-primary-50/20 to-slate-50 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Formula Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-blue font-semibold uppercase tracking-wider text-[11px]">
                Fundamental Queuing Theory
              </span>
              <span className="text-xs text-slate-400">MIT / John D.C. Little (1961)</span>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-black text-slate-900 font-mono tracking-tight bg-slate-100 px-4 py-2 rounded-xl border border-slate-300 shadow-inner">
                L = λ × W
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">L</span>
                <span>= avg requests in system</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">λ</span>
                <span>= arrival rate (req/s)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">W</span>
                <span>= avg response time (s)</span>
              </div>
            </div>
          </div>

          {/* Current Substitution Panel */}
          <div className="card p-4 bg-slate-900 text-white border-slate-800 shadow-md w-full lg:w-auto min-w-[320px]">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span>Live Algebraic Substitution</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {live.sim_running ? 'SIMULATOR ACTIVE' : 'IDLE'}
              </span>
            </div>

            <div className="space-y-3 font-mono">
              {/* Simulated Substitution */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Simulated Stream:</span>
                  <span className="source-simulated text-[10px]">simulated</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {Math.round(live.sim_L).toLocaleString()} = {Math.round(live.sim_lambda).toLocaleString()} × {live.sim_W.toFixed(3)}s
                </div>
              </div>

              {/* Measured Substitution */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Real HTTP Traffic:</span>
                  <span className="source-measured text-[10px]">measured</span>
                </div>
                <div className="text-base font-semibold text-slate-200">
                  {live.real_L.toFixed(2)} = {live.real_lambda.toFixed(2)} × {live.real_W.toFixed(3)}s
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-start sm:items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Note:</strong> Little's Law applies under steady-state conditions (arrival rate equals departure rate).
            The simulator generates synthetic Poisson request arrivals with log-normal latency distributions.
          </span>
        </div>
      </div>

      {/* ── SECTION C: Live Metrics Row (6 Cards) ────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Live System Metrics Telemetry
          </h2>
          <span className="text-xs text-slate-400">
            Updated at {lastTick.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: sim_lambda */}
          <div className="metric-card hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Arrival Rate λ</span>
              <span className="source-simulated text-[10px]">simulated</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {Math.round(live.sim_lambda).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">requests / sec</div>
          </div>

          {/* Card 2: sim_W */}
          <div className="metric-card hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Response Time W</span>
              <span className="source-simulated text-[10px]">simulated</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {live.sim_W.toFixed(3)}
              <span className="text-sm font-normal text-slate-500 ml-1">s</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              ({Math.round(live.sim_W * 1000)} ms avg)
            </div>
          </div>

          {/* Card 3: sim_L */}
          <div className="metric-card hover:border-amber-300 bg-amber-50/20 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Avg in System L</span>
              <span className="source-calculated text-[10px]">calculated</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
              {Math.round(live.sim_L).toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-800/80 font-medium">in-flight requests</div>
          </div>

          {/* Card 4: real_lambda */}
          <div className="metric-card hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Arrival Rate λ</span>
              <span className="source-measured text-[10px]">measured</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {live.real_lambda.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">HTTP req / sec</div>
          </div>

          {/* Card 5: real_W */}
          <div className="metric-card hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Response Time W</span>
              <span className="source-measured text-[10px]">measured</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {live.real_W.toFixed(3)}
              <span className="text-sm font-normal text-slate-500 ml-1">s</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              ({Math.round(live.real_W * 1000)} ms real)
            </div>
          </div>

          {/* Card 6: real_L */}
          <div className="metric-card hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">L (Measured)</span>
              <span className="source-measured text-[10px]">measured</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {live.real_L.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">active concurrent</div>
          </div>
        </div>
      </div>

      {/* ── SECTION D: Traffic Simulator Controls ────────────────────────── */}
      <div className="card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Results Day Load Simulation Controls
              </h2>
              {simulatorStatus && (
                <span
                  className={`badge ${
                    simulatorStatus.running ? 'badge-green' : 'badge-slate'
                  }`}
                >
                  {simulatorStatus.running ? 'Running' : 'Paused'}
                </span>
              )}
              {simulatorStatus?.mode && (
                <span className="badge badge-purple uppercase text-[10px] font-mono">
                  Mode: {simulatorStatus.mode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure synthetic load generators to simulate university exam submission surges.
            </p>
          </div>

          <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md self-start sm:self-auto">
            Note: Values below are synthetic — not real production traffic
          </div>
        </div>

        {/* Preset Scenario Buttons */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Preset Scenarios (Case Study Benchmarks)
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleApplyPreset('original', 1200, 0.25)}
              disabled={actionLoading}
              className="btn btn-primary btn-sm font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Original Case Study (λ=1200, W=0.25s)</span>
            </button>

            <button
              onClick={() => handleApplyPreset('db_slowdown', 1200, 0.50)}
              disabled={actionLoading}
              className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600 font-semibold focus:ring-yellow-400"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database Slowdown (λ=1200, W=0.50s)</span>
            </button>

            <button
              onClick={() => handleApplyPreset('spike', 3000, 0.25)}
              disabled={actionLoading}
              className="btn btn-danger btn-sm font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Traffic Spike (λ=3000, W=0.25s)</span>
            </button>

            <button
              onClick={() => handleApplyPreset('idle', 100, 0.10)}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm font-semibold"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Idle (λ=100, W=0.10s)</span>
            </button>

            <button
              onClick={() => handleApplyPreset('high_load', 2000, 0.35)}
              disabled={actionLoading}
              className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-700 font-semibold focus:ring-indigo-500"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>High Load (λ=2000, W=0.35s)</span>
            </button>
          </div>
        </div>

        {/* Custom Sliders & Action Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slider 1: Arrival Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Arrival Rate λ (requests/sec)</span>
                <span className="source-simulated text-[10px]">0 – 5,000</span>
              </label>
              <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-sm">
                {sliderLambda.toLocaleString()} req/s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={sliderLambda}
              onChange={(e) => setSliderLambda(Number(e.target.value))}
              className="w-full accent-primary-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0</span>
              <span>1,200 (Baseline)</span>
              <span>3,000 (Spike)</span>
              <span>5,000 (Max)</span>
            </div>
          </div>

          {/* Slider 2: Response Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Mean Response Time W (seconds)</span>
                <span className="source-simulated text-[10px]">0.01 – 2.00s</span>
              </label>
              <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-sm">
                {sliderW.toFixed(2)}s ({Math.round(sliderW * 1000)} ms)
              </span>
            </div>
            <input
              type="range"
              min={0.01}
              max={2.0}
              step={0.01}
              value={sliderW}
              onChange={(e) => setSliderW(Number(e.target.value))}
              className="w-full accent-primary-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.01s (Fast)</span>
              <span>0.25s (Baseline)</span>
              <span>0.50s (Slowdown)</span>
              <span>2.00s (Critical)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Predicted Little's Law Occupancy L = {(sliderLambda * sliderW).toFixed(1)} requests
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCustom}
              disabled={actionLoading}
              className="btn btn-primary btn-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Apply & Start Simulator</span>
            </button>

            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>

            <button
              onClick={handleReset}
              disabled={actionLoading}
              className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION E: Scenario Comparison ──────────────────────────────── */}
      <div className="card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Scenario Comparison: Effect of Response Time on System Occupancy
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualizing how latency degradation dramatically increases memory and concurrency pressure under fixed arrival rates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Bar Chart */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Occupancy L (requests)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
                          <div className="font-bold text-emerald-400">{data.scenario}</div>
                          <div>Arrival Rate (λ): <strong>{data.lambda} req/s</strong></div>
                          <div>Response Time (W): <strong>{data.response_time}s</strong></div>
                          <div className="pt-1 border-t border-slate-700 font-bold text-white">
                            Occupancy L = {data.occupancy} requests
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine y={300} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Baseline L=300', fill: '#b45309', fontSize: 11, position: 'top' }} />
                <Bar dataKey="occupancy" name="Requests in System (L)" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Analytical Explanation Box */}
          <div className="card p-5 bg-slate-50 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="badge badge-blue font-semibold text-[11px]">Core Insight</span>
              <h3 className="font-bold text-sm text-slate-900 leading-snug">
                Why Latency Multiplies Concurrency
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                At <span className="font-mono font-semibold text-slate-900">λ = 1,200 req/s</span>, doubling
                <span className="font-mono font-semibold text-slate-900"> W</span> from{' '}
                <span className="font-mono text-emerald-700">0.25s</span> to{' '}
                <span className="font-mono text-red-600">0.50s</span> doubles{' '}
                <span className="font-mono font-semibold text-slate-900">L</span> from{' '}
                <span className="font-mono font-bold text-emerald-700">300</span> to{' '}
                <span className="font-mono font-bold text-red-600">600</span>.
                This is a direct consequence of <span className="font-mono font-bold text-primary-700">L = λ × W</span>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
                <div>Scenario 1: 1,200 × 0.25 = 300 req</div>
                <div className="text-red-700 font-bold">Scenario 2: 1,200 × 0.50 = 600 req</div>
                <div className="text-primary-700 font-semibold">Live System: {live.sim_lambda.toFixed(0)} × {live.sim_W.toFixed(2)} = {live.sim_L.toFixed(0)} req</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              Doubling response time doubles the memory, thread pool, and socket occupancy required to sustain the same arrival volume.
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION F: Telemetry Charts (3 Charts) ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" />
            Time-Series Dynamic Telemetry (Last 60 Seconds)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Arrival Rate (λ) over time */}
          <div className="card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase">Simulated Arrival Rate (λ)</h3>
                <span className="text-[11px] text-slate-500">Requests per second</span>
              </div>
              <span className="source-simulated text-[10px]">sim_lambda</span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} hide />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded shadow text-xs font-mono">
                            <div>λ: {payload[0].value} req/s</div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sim_lambda"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Response Time (W) Area chart */}
          <div className="card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase">Simulated Response Time (W)</h3>
                <span className="text-[11px] text-slate-500">Average seconds per request</span>
              </div>
              <span className="source-simulated text-[10px]">sim_W</span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} hide />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded shadow text-xs font-mono">
                            <div>W: {payload[0].value} s</div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sim_W"
                    stroke="#059669"
                    fill="#d1fae5"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: System Occupancy L = λW Line chart (both sim_L and real_L) */}
          <div className="card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase">System Occupancy (L = λW)</h3>
                <span className="text-[11px] text-slate-500">Simulated vs Measured</span>
              </div>
              <span className="source-calculated text-[10px]">L = λ × W</span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} hide />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded shadow text-xs font-mono space-y-0.5">
                            <div className="text-amber-400">Sim L: {payload[0]?.value} req</div>
                            {payload[1] && <div className="text-emerald-400">Real L: {payload[1].value} req</div>}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="sim_L"
                    name="Simulated L"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="real_L"
                    name="Measured Real L"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION G: Thread Capacity Estimation ────────────────────────── */}
      <div className="card p-6 shadow-sm border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Thread & Capacity Estimation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Under the simplified assumption that each request occupies one thread for its entire response time,
              concurrent thread demand ≈ λ × W (Little's Law).
            </p>
          </div>

          <div className="badge badge-blue font-semibold text-xs py-1 px-3 self-start sm:self-auto">
            Thread-Per-Request Model
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Box 1: Estimated Concurrent Threads */}
          <div className="card p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Concurrent Thread Demand
            </span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono">
              {Math.round(estimatedThreads).toLocaleString()}
              <span className="text-sm font-normal text-slate-500 ml-1.5">threads</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 font-mono">
              = {Math.round(live.sim_lambda)} req/s × {live.sim_W.toFixed(3)}s
            </div>
          </div>

          {/* Box 2: Threads per VM Configuration */}
          <div className="card p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Threads per VM Capacity
              </span>
              <span className="badge badge-slate font-mono text-[10px]">Configurable</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={threadsPerVm}
                onChange={(e) => setThreadsPerVm(Math.max(1, Number(e.target.value) || 1))}
                className="input text-xl font-bold font-mono py-1 px-2.5 w-28 text-slate-900"
              />
              <span className="text-xs text-slate-500">threads per instance</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Default: 100 worker threads (Tomcat / Gunicorn limit)
            </div>
          </div>

          {/* Box 3: VMs Required Display */}
          <div className="card p-5 bg-primary-50/50 border-primary-200">
            <span className="text-xs font-semibold text-primary-900 uppercase tracking-wider">
              VMs Required (Scaled Sizing)
            </span>
            <div className="mt-2 text-3xl font-extrabold text-primary-700 font-mono flex items-baseline gap-2">
              {currentRequiredVms}
              <span className="text-sm font-normal text-primary-800">
                instances {currentRequiredVms >= 12 && '(Max 12 reached)'}
              </span>
            </div>
            <div className="text-xs text-primary-800 mt-2 font-mono">
              = ⌈{Math.round(estimatedThreads)} / {threadsPerVm}⌉
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> This is a simplified estimate. Actual thread requirements depend on CPU time,
            I/O waits, non-blocking asynchronous architectures (e.g., Node.js / FastAPI event loops), and database connection pool limits.
          </span>
        </div>
      </div>

      {/* ── SECTION H: IaaS Auto-Scaling Section ─────────────────────────── */}
      <div className="card p-6 shadow-sm border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Cloud Infrastructure & Auto-Scaling
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Elastic application tier visualization responding to Little's Law thread saturation.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            [Simulated — not real cloud infrastructure]
          </div>
        </div>

        {/* Architecture Flow Diagram */}
        <div className="my-5 p-4 rounded-xl bg-slate-900 text-white overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between min-w-[620px] gap-3 text-xs font-mono">
            {/* Step 1: Students */}
            <div className="flex flex-col items-center bg-slate-800 px-4 py-2.5 rounded-lg border border-slate-700 min-w-[120px]">
              <span className="text-slate-400 text-[10px]">Client Workload</span>
              <span className="font-bold text-white mt-0.5">Candidates</span>
              <span className="text-[10px] text-emerald-400 mt-1">λ = {Math.round(live.sim_lambda)} req/s</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />

            {/* Step 2: Load Balancer */}
            <div className="flex flex-col items-center bg-blue-900/60 px-4 py-2.5 rounded-lg border border-blue-700 min-w-[130px]">
              <span className="text-blue-300 text-[10px]">Layer 7 Gateway</span>
              <span className="font-bold text-white mt-0.5">Load Balancer</span>
              <span className="text-[10px] text-blue-200 mt-1">Round-Robin / Least Conn</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />

            {/* Step 3: Elastic VM Pool */}
            <div className="flex flex-col items-center bg-emerald-950/70 px-5 py-2.5 rounded-lg border border-emerald-700 min-w-[160px]">
              <span className="text-emerald-400 text-[10px]">Auto-Scaled Fleet</span>
              <span className="font-bold text-emerald-200 mt-0.5">[{currentRequiredVms} Active VM Instances]</span>
              <span className="text-[10px] text-emerald-300 mt-1">Capacity: {currentRequiredVms * threadsPerVm} threads</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />

            {/* Step 4: Database */}
            <div className="flex flex-col items-center bg-slate-800 px-4 py-2.5 rounded-lg border border-slate-700 min-w-[120px]">
              <span className="text-slate-400 text-[10px]">Persistence Tier</span>
              <span className="font-bold text-white mt-0.5">PostgreSQL / SQLite</span>
              <span className="text-[10px] text-amber-400 mt-1">Shared Contention</span>
            </div>
          </div>
        </div>

        {/* 12 VM Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Virtual Machine Fleet Status ({currentRequiredVms} Active / {12 - currentRequiredVms} Idle)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Cluster Utilization: {Math.min(100, Math.round((estimatedThreads / (currentRequiredVms * threadsPerVm)) * 100))}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {vmCards.map((vm) => {
              const isActive = vm.status === 'active'
              return (
                <div
                  key={vm.id}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    isActive
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-sm text-emerald-900 ring-1 ring-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{vm.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="mt-2 text-[11px] font-medium flex items-center justify-between">
                    <span>Status:</span>
                    <span
                      className={`badge text-[10px] py-0 px-1.5 ${
                        isActive ? 'badge-green' : 'badge-slate'
                      }`}
                    >
                      {isActive ? 'RUNNING' : 'STANDBY'}
                    </span>
                  </div>

                  <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Port: {vm.port}</span>
                    <span>{isActive ? `${Math.min(threadsPerVm, Math.round(estimatedThreads / currentRequiredVms))} th` : '0 th'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scale Events Log & Architecture Note */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Scrollable Event Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-600" />
                Elastic Auto-Scaling Event Log (Last 10)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{scaleEvents.length} events</span>
            </div>

            <div className="card p-2 bg-slate-50 border-slate-200 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin text-xs">
              {scaleEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded bg-white border border-slate-200 text-xs space-y-0.5 shadow-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">{evt.timestamp}</span>
                    <span
                      className={`badge text-[10px] ${
                        evt.type === 'scale_out'
                          ? 'badge-green'
                          : evt.type === 'scale_in'
                          ? 'badge-yellow'
                          : 'badge-blue'
                      }`}
                    >
                      {evt.type === 'scale_out'
                        ? 'SCALE OUT'
                        : evt.type === 'scale_in'
                        ? 'SCALE IN'
                        : 'PROVISION'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-tight">{evt.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Architectural Explanation */}
          <div className="card p-5 bg-gradient-to-br from-blue-50/50 to-slate-50 border-blue-200 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Application Tier vs Database Bottlenecks
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adding app servers helps when the <strong>application tier</strong> is the bottleneck (e.g., CPU-bound request
                parsing or template generation).
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                However, if response time <span className="font-mono font-bold text-slate-900">W</span> degrades due to a{' '}
                <strong>database bottleneck</strong> (e.g., table locks or connection pool exhaustion), auto-scaling more VM
                instances will actually worsen performance by throwing even more competing connections at the saturated database.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200 text-[11px] text-primary-900 font-medium">
              💡 A database bottleneck requires query optimisation, caching, read-replicas, or connection pooling.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
