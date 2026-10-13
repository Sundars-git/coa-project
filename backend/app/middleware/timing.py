"""
Request timing middleware.
Records every request's duration into the metrics ring buffer.
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.services.metrics_service import metrics_service


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_s = time.perf_counter() - start
        # Record only API calls, not static assets
        if request.url.path.startswith("/api"):
            metrics_service.record_request(duration_s)
        return response
