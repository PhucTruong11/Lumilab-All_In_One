"""Strict numeric tools. No eval, sympify or model-generated Python is executed."""
import math
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .verifier import Number


class ToolInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    operation: Literal["convert_unit", "linear_equation", "ohm_current"]
    values: dict[str, Number] = Field(max_length=4)
    from_unit: Literal["mL", "L", "g", "kg", "mol", "s", "V", "A", "ohm"] | None = None
    to_unit: Literal["mL", "L", "g", "kg", "mol", "s", "V", "A", "ohm"] | None = None


def run_tool(payload: ToolInput) -> dict:
    if any(not math.isfinite(value) or abs(value) > 1e6 for value in payload.values.values()):
        raise ValueError("TOOL_VALUE_OUTSIDE_BOUNDS")
    values = payload.values
    if payload.operation == "convert_unit":
        if set(values) != {"value"} or payload.from_unit is None or payload.to_unit is None:
            raise ValueError("CONVERSION_INPUT_REQUIRED")
        import pint
        result = pint.UnitRegistry().Quantity(values["value"], payload.from_unit).to(payload.to_unit).magnitude
        return {"value": result, "unit": payload.to_unit, "status": "MODEL_CALCULATION_ONLY"}
    if payload.operation == "linear_equation":
        if set(values) != {"a", "b", "c"} or values["a"] == 0:
            raise ValueError("UNSUPPORTED_LINEAR_EQUATION")
        import sympy
        a, b, c = (sympy.Rational(str(values[key])) for key in ("a", "b", "c"))
        result = float((c - b) / a)
        if not math.isfinite(result):
            raise ValueError("NONFINITE_TOOL_RESULT")
        return {"value": result, "unit": None, "status": "MODEL_CALCULATION_ONLY"}
    if set(values) != {"voltage_V", "resistance_ohm"} or not (
            0 <= values["voltage_V"] <= 12 and 5 <= values["resistance_ohm"] <= 100):
        raise ValueError("OUTSIDE_OHM_MODEL")
    return {"value": values["voltage_V"] / values["resistance_ohm"], "unit": "A",
            "status": "MODEL_CALCULATION_ONLY"}
