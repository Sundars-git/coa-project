"""
Traffic simulator service.
Generates synthetic request events at a configurable arrival rate and
injects simulated latency values into a separate buffer.
Runs in a background thread — completely independent of real HTTP traffic.
"""

import time
import random
import threading
import math
from datetime import datetime, timezone
from app.services.metrics_service import metrics_service


class SimulatorService:

    PRESETS = {
        "original": {"arrival_rate": 1200.0, "mean_response_time": 0.25, "mode": "normal"},
        "db_slowdown": {"arrival_rate": 1200.0, "mean_response_time": 0.50, "mode": "db_slowdown"},
        "spike": {"arrival_rate": 3000.0, "mean_response_time": 0.25, "mode": "spike"},
        "idle": {"arrival_rate": 100.0, "mean_response_time": 0.10, "mode": "normal"},
        "high_load": {"arrival_rate": 2000.0, "mean_response_time": 0.35, "mode": "normal"},
    }

    def __init__(self):
        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None
        self._running = False

        # Current config
        self.arrival_rate = 0.0        # λ (req/s)
        self.mean_response_time = 0.0  # W (seconds)
        self.response_time_std = 0.05
        self.mode = "normal"

        # Sim ring buffer — (monotonic, duration) — separate from real buffer
        self._sim_buffer: list[tuple[float, float]] = []
        self._sim_lock = threading.Lock()

        # Start snapshot loop (always running, even when sim is paused)
        self._snapshot_thread = threading.Thread(
            target=self._snapshot_loop, daemon=True
        )
        self._snapshot_thread.start()

    # ── Control ───────────────────────────────────────────────────────────────

    def start(self, arrival_rate: float, mean_response_time: float,
              response_time_std: float = 0.05, mode: str = "normal"):
        with self._lock:
            self.arrival_rate = max(0.0, arrival_rate)
            self.mean_response_time = max(0.001, mean_response_time)
            self.response_time_std = max(0.001, response_time_std)
            self.mode = mode

            if not self._running:
                self._running = True
                self._thread = threading.Thread(
                    target=self._generate_loop, daemon=True
                )
                self._thread.start()

    def update(self, arrival_rate: float = None, mean_response_time: float = None,
               response_time_std: float = None, mode: str = None):
        with self._lock:
            if arrival_rate is not None:
                self.arrival_rate = max(0.0, arrival_rate)
            if mean_response_time is not None:
                self.mean_response_time = max(0.001, mean_response_time)
            if response_time_std is not None:
                self.response_time_std = max(0.001, response_time_std)
            if mode is not None:
                self.mode = mode

    def pause(self):
        with self._lock:
            self._running = False

    def reset(self):
        with self._lock:
            self._running = False
            self.arrival_rate = 0.0
            self.mean_response_time = 0.0
        with self._sim_lock:
            self._sim_buffer.clear()

    def apply_preset(self, preset_name: str):
        preset = self.PRESETS.get(preset_name)
        if preset:
            self.start(
                arrival_rate=preset["arrival_rate"],
                mean_response_time=preset["mean_response_time"],
                mode=preset["mode"],
            )
        return preset

    def get_status(self) -> dict:
        with self._lock:
            return {
                "running": self._running,
                "arrival_rate": self.arrival_rate,
                "mean_response_time": self.mean_response_time,
                "response_time_std": self.response_time_std,
                "mode": self.mode,
            }

    # ── Computed metrics ──────────────────────────────────────────────────────

    def get_sim_metrics(self) -> dict:
        with self._lock:
            lam = self.arrival_rate
            w = self.mean_response_time
            running = self._running

        L = lam * w  # Little's Law

        return {
            "sim_lambda": round(lam, 3),
            "sim_W": round(w, 4),
            "sim_L": round(L, 3),
            "sim_running": running,
        }

    # ── Background loops ──────────────────────────────────────────────────────

    def _generate_loop(self):
        """
        Generates synthetic request events at 'arrival_rate' requests/second.
        Sleeps between events using an exponential inter-arrival time (Poisson process).
        """
        while True:
            with self._lock:
                running = self._running
                lam = self.arrival_rate
                mu = self.mean_response_time
                std = self.response_time_std
                mode = self.mode

            if not running or lam == 0:
                time.sleep(0.1)
                continue

            # Exponential inter-arrival (Poisson arrivals)
            inter_arrival = random.expovariate(lam)

            # Simulated response time — log-normal for realistic distribution
            if mode == "db_slowdown":
                # Elevated mean with higher variance to simulate DB contention
                actual_mu = mu * (1 + random.uniform(0, 0.3))
            elif mode == "spike":
                # Slight latency increase under spike
                actual_mu = mu * (1 + random.uniform(0, 0.15))
            else:
                actual_mu = mu

            # Log-normal: σ² = log(1 + (std/actual_mu)²), m = log(actual_mu) - σ²/2
            cv = std / max(actual_mu, 0.001)
            sigma2 = math.log(1 + cv ** 2)
            m = math.log(actual_mu) - sigma2 / 2
            duration = random.lognormvariate(m, math.sqrt(sigma2))

            # Cap at 5× mean to avoid outliers dominating averages
            duration = min(duration, actual_mu * 5)

            with self._sim_lock:
                now = time.monotonic()
                # Keep only last 60 seconds
                cutoff = now - 60
                self._sim_buffer = [(t, d) for t, d in self._sim_buffer if t >= cutoff]
                self._sim_buffer.append((now, duration))

            time.sleep(max(inter_arrival, 0.0001))

    def _snapshot_loop(self):
        """Every second, push a combined snapshot to the history buffer."""
        while True:
            time.sleep(1.0)
            real = metrics_service.get_current_metrics()
            sim = self.get_sim_metrics()
            snapshot = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "real_lambda": real["real_lambda"],
                "real_W": real["real_W"],
                "real_L": real["real_L"],
                "sim_lambda": sim["sim_lambda"],
                "sim_W": sim["sim_W"],
                "sim_L": sim["sim_L"],
            }
            metrics_service.push_history_snapshot(snapshot)


# Singleton
simulator_service = SimulatorService()
