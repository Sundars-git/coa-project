import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Database,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'

export default function CaseStudyReportPage() {
  // Interactive Calculator State
  const [lambda, setLambda] = useState<number>(1200)
  const [w, setW] = useState<number>(0.25)
  const [threadsPerVm, setThreadsPerVm] = useState<number>(50)

  // Calculations
  const calculatedL = Math.round(lambda * w * 100) / 100
  const minVms = Math.ceil(calculatedL / threadsPerVm)
  const utilization = Math.min(100, Math.round((calculatedL / (minVms * threadsPerVm)) * 100))

  const loadPreset = (presetLambda: number, presetW: number) => {
    setLambda(presetLambda)
    setW(presetW)
  }

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* ── Top Header & Navigation ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-purple font-semibold">COA Academic Paper</span>
            <span className="text-xs text-slate-400">Computer Organization & Architecture</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Quantitative Queuing Analysis & Capacity Planning
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Applying Little's Law to Model Concurrency, Latency, and Scalability in High-Throughput Online Examination Portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/performance" className="btn btn-primary btn-sm">
            <Activity className="w-4 h-4" />
            <span>Live Monitor</span>
          </Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">
            <span>Admin Home</span>
          </Link>
        </div>
      </div>

      {/* ── Document Metadata Banner ────────────────────────────────────────── */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Core Principle</span>
            <span className="text-base font-bold text-white mt-0.5 block font-mono">L = λ · W</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Domain</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">Systems Architecture & Queuing</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Benchmark Target</span>
            <span className="font-semibold text-emerald-400 mt-0.5 block">1,200 req/s @ 250ms SLA</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Target Cluster</span>
            <span className="font-semibold text-amber-300 mt-0.5 block">6 - 15 Dynamic Nodes</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Abstract & Executive Summary ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            01
          </span>
          <h2 className="text-xl font-bold text-slate-900">Abstract & Problem Formulation</h2>
        </div>
        <div className="card p-6 leading-relaxed text-sm text-slate-700 space-y-3">
          <p>
            University examination portals experience severe non-uniform traffic distributions characterized by sharp, deterministic surges at designated start and end intervals. During synchronized final exams, thousands of concurrent students submit question responses and cryptographic telemetry simultaneously, creating massive queuing spikes.
          </p>
          <p>
            Traditional infrastructure planning frequently relies on naive CPU utilization triggers which lag traffic surges by 30 to 90 seconds, causing catastrophic connection pool exhaustion and gateway 504 timeouts. This case study demonstrates how <strong className="text-slate-900">Little's Law</strong> provides a deterministic, distribution-free mathematical model to compute real-time in-flight request concurrency and dynamically size server clusters before hardware saturation occurs.
          </p>
        </div>
      </section>

      {/* ── Section 2: Mathematical Foundations of Little's Law ─────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            02
          </span>
          <h2 className="text-xl font-bold text-slate-900">Theoretical Foundation: Little's Law</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>The Operational Theorem</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Formulated by John D.C. Little in 1961, the theorem states that under stationary (equilibrium) conditions, the long-term average number of items <span className="font-mono font-bold text-primary-700">L</span> in a stationary queuing system is strictly equal to the long-term average effective arrival rate <span className="font-mono font-bold text-primary-700">λ</span> multiplied by the average time <span className="font-mono font-bold text-primary-700">W</span> that an item spends in the system:
            </p>

            <div className="p-5 rounded-xl bg-slate-900 text-center font-mono text-xl md:text-2xl font-bold text-primary-300 border border-slate-800 shadow-inner">
              L = λ × W
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-mono font-bold text-primary-700 text-sm block">L (Concurrency)</span>
                <span className="text-slate-500 mt-1 block">
                  Average number of in-flight requests currently residing within system boundaries.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-mono font-bold text-primary-700 text-sm block">λ (Throughput)</span>
                <span className="text-slate-500 mt-1 block">
                  Mean request arrival rate measured in transactions per second (req/s).
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-mono font-bold text-primary-700 text-sm block">W (Response Time)</span>
                <span className="text-slate-500 mt-1 block">
                  Mean duration spent by a request from socket accept to response write (seconds).
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-primary-50/40 border-primary-100 flex flex-col justify-between space-y-4">
            <div>
              <div className="badge badge-blue mb-2 font-semibold">Key Mathematical Invariance</div>
              <h4 className="font-bold text-slate-900 text-sm">Why Little's Law is Invaluable:</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-700 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Distribution-Free:</strong> Holds true regardless of whether request arrival follows a Poisson, Pareto, or deterministic distribution.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Queue Agnostic:</strong> Does not depend on scheduling order (FIFO, LIFO, priority queue, or fair queuing).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Fractal Property:</strong> Can be applied to individual subsystems (e.g. database connection pool, reverse proxy buffers, API worker pools).</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-white border border-primary-200 text-xs text-primary-900">
              <span className="font-semibold block">Architecture Rule of Thumb:</span>
              To halve concurrency backlog (L), one must either halve arrival rate (λ) via rate limits or halve latency (W) via caching & indexed queries.
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Empirical Case Study Scenarios ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            03
          </span>
          <h2 className="text-xl font-bold text-slate-900">Empirical Benchmarking Scenarios</h2>
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-900">
              Comparative Analysis Across Operational Stress Regimes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assumes 50 concurrent worker threads/connections supported per standard 4 vCPU VM instance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Scenario</th>
                  <th className="p-3.5">Arrival Rate (λ)</th>
                  <th className="p-3.5">Mean Latency (W)</th>
                  <th className="p-3.5">Concurrency (L)</th>
                  <th className="p-3.5">Required Cluster</th>
                  <th className="p-3.5">System Health State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div>Original Benchmark</div>
                    <div className="text-[11px] text-slate-400 font-normal">Standard peak exam rush hour</div>
                  </td>
                  <td className="p-3.5 font-mono">1,200 req/s</td>
                  <td className="p-3.5 font-mono">0.25 s (250ms)</td>
                  <td className="p-3.5 font-mono font-bold text-primary-700">300 requests</td>
                  <td className="p-3.5 font-mono">6 Nodes (300 threads)</td>
                  <td className="p-3.5">
                    <span className="badge badge-green font-semibold">Healthy (100% SLA)</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 bg-amber-50/30">
                  <td className="p-3.5 font-bold text-amber-900">
                    <div>Database Slowdown</div>
                    <div className="text-[11px] text-amber-700 font-normal">Lock contention / unindexed query</div>
                  </td>
                  <td className="p-3.5 font-mono">1,200 req/s</td>
                  <td className="p-3.5 font-mono text-amber-800 font-bold">0.50 s (500ms)</td>
                  <td className="p-3.5 font-mono font-bold text-amber-700">600 requests</td>
                  <td className="p-3.5 font-mono">12 Nodes (600 threads)</td>
                  <td className="p-3.5">
                    <span className="badge badge-yellow font-semibold">Degraded / 2x Cluster Needed</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 bg-red-50/20">
                  <td className="p-3.5 font-bold text-red-900">
                    <div>Sudden Exam Spike</div>
                    <div className="text-[11px] text-red-700 font-normal">Synchronized 10:00 AM kickoff</div>
                  </td>
                  <td className="p-3.5 font-mono text-red-700 font-bold">3,000 req/s</td>
                  <td className="p-3.5 font-mono">0.25 s (250ms)</td>
                  <td className="p-3.5 font-mono font-bold text-red-700">750 requests</td>
                  <td className="p-3.5 font-mono">15 Nodes (750 threads)</td>
                  <td className="p-3.5">
                    <span className="badge badge-red font-semibold">Critical Overload Threshold</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-bold text-slate-800">
                    <div>Off-Peak Idle</div>
                    <div className="text-[11px] text-slate-400 font-normal">Between exam intervals</div>
                  </td>
                  <td className="p-3.5 font-mono">100 req/s</td>
                  <td className="p-3.5 font-mono">0.10 s (100ms)</td>
                  <td className="p-3.5 font-mono font-bold text-slate-700">10 requests</td>
                  <td className="p-3.5 font-mono">1 Node (50 threads)</td>
                  <td className="p-3.5">
                    <span className="badge badge-slate font-semibold">Idle / Baseline Cost</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 4: Interactive Capacity Planning Sandbox ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            04
          </span>
          <h2 className="text-xl font-bold text-slate-900">Interactive Little's Law Capacity Sizing Sandbox</h2>
        </div>

        <div className="card p-6 md:p-8 space-y-6 border-primary-200 bg-gradient-to-br from-white to-primary-50/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-600" />
                <span>Real-Time Concurrency & Sizing Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Adjust the sliders or click a scenario button to observe how changes in arrival rate (λ) and latency (W) drive concurrency (L).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadPreset(1200, 0.25)}
                className="btn btn-secondary btn-sm text-xs font-semibold"
              >
                Nominal (1200 / 0.25s)
              </button>
              <button
                type="button"
                onClick={() => loadPreset(1200, 0.50)}
                className="btn btn-secondary btn-sm text-xs font-semibold"
              >
                DB Lag (1200 / 0.50s)
              </button>
              <button
                type="button"
                onClick={() => loadPreset(3000, 0.25)}
                className="btn btn-secondary btn-sm text-xs font-semibold"
              >
                Spike (3000 / 0.25s)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Slider 1: Lambda */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Arrival Rate (λ)</span>
                <span className="font-mono text-sm font-bold text-primary-700">{lambda} req/s</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={lambda}
                onChange={(e) => setLambda(Number(e.target.value))}
                className="w-full accent-primary-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">
                Total throughput generated by student actions.
              </span>
            </div>

            {/* Slider 2: Latency W */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Mean Latency (W)</span>
                <span className="font-mono text-sm font-bold text-primary-700">
                  {w.toFixed(2)} s ({Math.round(w * 1000)}ms)
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.50"
                step="0.05"
                value={w}
                onChange={(e) => setW(Number(e.target.value))}
                className="w-full accent-primary-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">
                Average server turn-around response time.
              </span>
            </div>

            {/* Slider 3: VM Thread Pool Capacity */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Node Capacity (C)</span>
                <span className="font-mono text-sm font-bold text-primary-700">{threadsPerVm} threads</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="10"
                value={threadsPerVm}
                onChange={(e) => setThreadsPerVm(Number(e.target.value))}
                className="w-full accent-primary-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block">
                Safe concurrent connection capacity per VM node.
              </span>
            </div>
          </div>

          {/* Results Display Grid */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                Concurrency (L = λ · W)
              </span>
              <div className="text-3xl font-extrabold text-primary-400 mt-1 font-mono">
                {calculatedL}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Active in-flight requests</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                Required Cluster Sizing
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
                {minVms} <span className="text-sm font-normal text-slate-300">VMs</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {minVms * threadsPerVm} Total threads allocated
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                Cluster Utilization (ρ)
              </span>
              <div className="text-3xl font-extrabold text-amber-300 mt-1 font-mono">
                {utilization}%
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Headroom buffer remaining</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                Stability Status
              </span>
              <div className="mt-1">
                {calculatedL > 650 ? (
                  <span className="badge badge-red font-bold text-xs py-1 px-3">
                    High Risk / Autoscaling Triggered
                  </span>
                ) : calculatedL > 350 ? (
                  <span className="badge badge-yellow font-bold text-xs py-1 px-3">
                    Moderate Concurrency Load
                  </span>
                ) : (
                  <span className="badge badge-green font-bold text-xs py-1 px-3">
                    Optimal System Equilibrium
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {calculatedL > 650 ? 'Immediate scaling required' : 'Queuing buffers within SLA'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Architecture Recommendations ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            05
          </span>
          <h2 className="text-xl font-bold text-slate-900">Architectural Recommendations for Exam Portals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">1. Async Non-Blocking ASGI I/O</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use asynchronous event loops (FastAPI / Uvicorn with uvloop) so each worker thread can hold thousands of keep-alive sockets without blocking on slow client uplinks.
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">2. WAL Mode & Connection Pooling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In relational and embedded databases, enable Write-Ahead Logging (WAL) to decouple read transactions from write locks, maintaining mean query latency W &lt; 0.25s during auto-save ticks.
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">3. Concurrency-Driven Autoscaling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Base autoscaling rules on estimated concurrency <em>L = λ · W</em> derived from reverse-proxy request logs rather than CPU metrics alone, scaling out cluster instances ahead of the queue curve.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer Navigation ────────────────────────────────────────────────── */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          COA Project Technical Report &copy; {new Date().getFullYear()} University Exam Portal.
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/performance" className="btn btn-primary btn-sm">
            <span>Test in Live Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
