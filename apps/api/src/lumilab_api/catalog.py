import json
from pathlib import Path
from typing import Literal

from jsonschema import Draft7Validator
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ParameterDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)
    unit: str
    min: float
    max: float
    default: float

    @model_validator(mode="after")
    def valid_range(self):
        if not self.min <= self.default <= self.max:
            raise ValueError("Parameter default must be inside the declared range")
        return self


class LabDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    title: str
    summary: str
    domain: Literal["physics", "chemistry"]
    schema_version: Literal["1.0"]
    model_version: str
    dataset_version: str
    implementation_status: Literal["planned"]
    review_status: Literal["draft"]
    parameters: dict[str, ParameterDefinition]
    evidence_ids: list[str] = Field(min_length=1)


class CatalogResponse(BaseModel):
    items: list[LabDefinition]


def load_catalog(knowledge: Path, contracts: Path) -> dict[str, LabDefinition]:
    schema = json.loads((contracts / "schemas/lab.schema.json").read_text(encoding="utf-8"))
    Draft7Validator.check_schema(schema)
    validator = Draft7Validator(schema)
    entries = {}
    for path in sorted((knowledge / "labs").glob("*.lab.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        validator.validate(data)
        lab = LabDefinition.model_validate(data)
        if lab.id in entries:
            raise ValueError("Duplicate lab ID")
        entries[lab.id] = lab
    if not entries:
        raise ValueError("Catalog must not be empty")
    return entries
