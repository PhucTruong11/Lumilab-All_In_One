FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /workspace
COPY apps/api /workspace/apps/api
COPY knowledge /workspace/knowledge
COPY packages/contracts /workspace/packages/contracts
COPY packages/lab-engine/labs /workspace/packages/lab-engine/labs
COPY packages/lab-engine/schemas /workspace/packages/lab-engine/schemas
COPY docker/requirements-api.lock /workspace/docker/requirements-api.lock
RUN pip install --no-cache-dir -r docker/requirements-api.lock && pip install --no-cache-dir --no-deps ./apps/api && useradd --create-home appuser
# Build the authored draft baseline once; API queries never update this artifact.
RUN python -m lumilab_api.data_cli build --include-drafts --output /workspace/retrieval-index/index.json
ENV LUMILAB_RAG_ARTIFACT_PATH=/workspace/retrieval-index/index.json
USER appuser
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "lumilab_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
