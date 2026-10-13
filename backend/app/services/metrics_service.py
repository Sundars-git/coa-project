"""
Metrics service — 60-second sliding window of real request measurements.
Uses Little's Law: L = λ × W
"""

import time
import threading
from collections import deque
from datetime import datetime, timezone
from typing import List, Tuple


class MetricsService:
    """
    Thread-safe ring buffer of (timestamp, duration_seconds) pairs.
    Keeps only the last 60 seconds of real request data.
    Also stores up to 300 historical data points for the charts.
    """

    WINDOW_SECONDS = 60
    MAX_HISTORY = 300  # ~5 minutes of 1-second snapshots

    def __init__(self):
        self._lock = threading.Lock()
        # (monotonic_time, duration_seconds)
        self._buffer: deque[Tuple[float, float]] = deque(maxlen=10_000)
        # Historical snapshots for charts: list of dicts
        self._history: deque[dict] = deque(maxlen=self.MAX_HISTORY)

    # ── Recording ────────────────────────────────────────────────────────────

    def record_request(self, duration_s: float):
        with self._lock:
            self._buffer.append((time.monotonic(), duration_s))

    # ── Calculations ─────────────────────────────────────────────────────────

    def _prune_buffer(self, now: float):
        """Remove entries older than WINDOW_SECONDS."""
        cutoff = now - self.WINDOW_SECONDS
        while self._buffer and self._buffer[0][0] < cutoff:
            self._buffer.popleft()

    def get_current_metrics(self) -> dict:
        with self._lock:
            now = time.monotonic()
            self._prune_buffer(now)

            count = len(self._buffer)
            if count == 0:
                lam = 0.0
                w = 0.0
            else:
                lam = count / self.WINDOW_SECONDS  # req/s
                w = sum(d for _, d in self._buffer) / count  # mean seconds

            L = lam * w

            # Health thresholds (illustrative)
            if L > 500:
                health = "overloaded"
            elif L > 200:
                health = "degraded"
            else:
                health = "healthy"

            return {
                "real_lambda": round(lam, 3),
                "real_W": round(w, 4),
                "real_L": round(L, 3),
                "real_request_count": count,
                "health": health,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    # ── History snapshot (called by simulator loop every second) ─────────────

    def push_history_snapshot(self, snapshot: dict):
        with self._lock:
            self._history.append(snapshot)

    def get_history(self) -> List[dict]:
        with self._lock:
            return list(self._history)


# Singleton
metrics_service = MetricsService()
