"""Metrics router — live data, history, and simulator controls."""

from fastapi import APIRouter, Depends
from typing import List
from app.dependencies import require_admin
from app.schemas import LiveMetrics, DataPoint, SimulatorConfig
from app.services.metrics_service import metrics_service
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/live", response_model=LiveMetrics)
def get_live_metrics(admin: dict = Depends(require_admin)):
    real = metrics_service.get_current_metrics()
    sim = simulator_service.get_sim_metrics()
    return LiveMetrics(**real, **sim)


@router.get("/history", response_model=List[DataPoint])
def get_history(admin: dict = Depends(require_admin)):
    return metrics_service.get_history()


@router.post("/simulator/start")
def start_simulator(config: SimulatorConfig, admin: dict = Depends(require_admin)):
    simulator_service.start(
        arrival_rate=config.arrival_rate,
        mean_response_time=config.mean_response_time,
        response_time_std=config.response_time_std,
        mode=config.mode,
    )
    return {"ok": True, "status": simulator_service.get_status()}


@router.post("/simulator/preset/{preset_name}")
def apply_preset(preset_name: str, admin: dict = Depends(require_admin)):
    result = simulator_service.apply_preset(preset_name)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Unknown preset: {preset_name}")
    return {"ok": True, "preset": preset_name, "config": result, "status": simulator_service.get_status()}


@router.post("/simulator/pause")
def pause_simulator(admin: dict = Depends(require_admin)):
    simulator_service.pause()
    return {"ok": True}


@router.post("/simulator/reset")
def reset_simulator(admin: dict = Depends(require_admin)):
    simulator_service.reset()
    return {"ok": True}


@router.get("/simulator/status")
def simulator_status(admin: dict = Depends(require_admin)):
    return simulator_service.get_status()
