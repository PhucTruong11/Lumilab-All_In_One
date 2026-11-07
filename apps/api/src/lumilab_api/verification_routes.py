"""HTTP boundary for verification; scientific screening lives in verifier.py."""

from fastapi import APIRouter, HTTPException, Request

from lumilab_api.catalog import LabDefinition
from lumilab_api.recompute import RecomputeInput, RuntimeDefinition, recompute
from lumilab_api.verifier import ChemistryInput, PhysicsInput, VerificationResult, screen_input


def verification_router(
    catalog: dict[str, LabDefinition], runtime_labs: dict[str, RuntimeDefinition],
) -> APIRouter:
    router = APIRouter(prefix="/api/v1/verification", tags=["verification"])

    @router.post("/physics", response_model=VerificationResult)
    def physics(payload: PhysicsInput, request: Request):
        return screen_input(catalog["pendulum"], payload, request.state.request_id)

    @router.post("/chemistry", response_model=VerificationResult)
    def chemistry(payload: ChemistryInput, request: Request):
        return screen_input(catalog["titration-hcl-naoh"], payload, request.state.request_id)

    @router.post("/labs/{lab_id}", response_model=VerificationResult)
    def lab_reading(lab_id: str, payload: RecomputeInput, request: Request):
        if lab_id not in runtime_labs:
            raise HTTPException(status_code=404)
        return recompute(lab_id, runtime_labs[lab_id], payload, request.state.request_id)

    return router
