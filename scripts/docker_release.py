"""Build/test real Compose images and retain a verifiable local rollback bundle.

Only lumilab-ci-* projects are created/removed. Developer DBs/volumes are never used.
No provider calls, registry publication, production deployment or secret collection.
"""
import argparse
import gzip
import hashlib
import json
import os
import re
import shutil
import socket
import subprocess
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r"[0-9a-f]{40}")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def command(args, *, env=None):
    result = subprocess.run(args, cwd=ROOT, env=env, check=True,
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.stdout.strip()


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def local_output(path):
    path = path.resolve()
    require(path.is_relative_to((ROOT / ".local").resolve()) and path != ROOT / ".local",
        "Output must be a dedicated directory inside this checkout's .local/")
    return path


def validate_identity(web, api, git_sha, expected=None):
    require(web["schema_version"] == "web-build-1.0" and api["schema_version"] == "system-info-1.0",
        "Unsupported metadata schema")
    require(web["git_sha"] == api["git_sha"] == git_sha, "Web/API Git SHA mismatch")
    for key in ("runtime_fingerprint", "mapping_fingerprint"):
        require(web[key] == api[key], "Web/API " + key + " mismatch")
    require(web["mapping_revision"] == api["mapping"]["revision"], "Mapping revision mismatch")
    index = api["retrieval"]
    require(index["available"] and index["matches_corpus"] and
        index["corpus_revision"] == api["corpus_revision"] and index["fingerprint"],
        "Missing/stale retrieval artifact")
    if expected:
        require(web == expected["web"], "Web differs from retained release")
        require(api == expected["api"], "API/index differs from retained release")


def request(base, path, *, body=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(base + path, headers=headers,
        data=json.dumps(body).encode() if body is not None else None)
    try:
        with urlopen(req, timeout=25) as response:
            status, data = response.status, response.read()
    except HTTPError as exc:
        status, data = exc.code, exc.read()
    require(status == expected, f"HTTP {status} at {path.split('?')[0]}, expected {expected}")
    return json.loads(data)


def smoke(base, git_sha, expected=None):
    # All API requests go through Nginx; no direct host API/DB port is published.
    with urlopen(base + "/", timeout=10) as response:
        html = response.read().decode()
    assets = re.findall(r'src="(/assets/[^\"]+\.js)"', html)
    require(assets, "Built web JavaScript asset missing")
    with urlopen(base + assets[0], timeout=10) as response:
        require(response.status == 200 and response.read(100), "Built asset unavailable")
    with urlopen(base + "/healthz", timeout=10) as response:
        require(response.read().strip() == b"ok", "Nginx health failed")
    web = request(base, "/build-info.json")
    api = request(base, "/api/v1/system")
    validate_identity(web, api, git_sha, expected)
    status = request(base, "/api/v1/tutor/status")
    require(status["live_enabled"] is False and status["hybrid_available"], "Offline/index status mismatch")
    labs = request(base, "/api/v1/runtime-labs")["items"]
    require({r["id"] for r in labs} == {r["id"] for r in api["runtimes"] if r["lifecycle"] == "active"},
        "Runtime endpoint/metadata mismatch")
    lab = next(r for r in labs if r["id"] == "pendulum")
    session = request(base, "/api/v1/sessions", body={}, expected=201)
    other = request(base, "/api/v1/sessions", body={}, expected=201)
    path = "/api/v1/sessions/" + session["session_id"]
    token = session["session_token"]
    payload = {"lab_id": lab["id"], "model_version": lab["model_version"],
        "dataset_version": lab["dataset_version"], "parameters": lab["defaults"],
        "elapsed_s": 0, "idempotency_key": str(uuid4())}
    saved = request(base, path + "/runs", body=payload, token=token, expected=201)
    result = saved["result"]
    require(result["status"] == "INSUFFICIENT_DATA" and result["code"] == "REVIEWED_EVIDENCE_REQUIRED"
        and result["preview"] and not result["facts"] and not result["evidence"], "Draft boundary mismatch")
    run_path = path + "/runs/" + saved["run_id"]
    require(request(base, run_path, token=token) == saved, "Owned run read differs")
    require(request(base, path + "/runs", body=payload, token=token)["run_id"] == saved["run_id"],
        "Idempotency mismatch")
    require(any(r["run_id"] == saved["run_id"] for r in
        request(base, path + "/runs?lab_id=pendulum", token=token)["items"]), "Saved run not listed")
    request(base, run_path, token=other["session_token"], expected=401)
    request(base, "/api/v1/sessions/" + other["session_id"] + "/runs/" + saved["run_id"],
        token=other["session_token"], expected=404)
    tutor = request(base, path + "/tutor", token=token, body={"lab_id": "pendulum",
        "run_id": saved["run_id"], "mode": "hint", "question": "Chu kỳ con lắc phụ thuộc chiều dài thế nào?"})
    require(tutor["answer"]["response_source"] == "template" and tutor["answer"]["attempts"] == 0,
        "Tutor must use template without provider attempts")
    require(tutor["run"]["preview"] == result["preview"] and tutor["retrieval"]["hits"],
        "Tutor owned-run/retrieval mismatch")
    # Tokens stay in memory solely for persistence verification after container recreation.
    return {"web": web, "api": api}, (run_path, token, saved)


def image_info(git_sha):
    images = {}
    for service in ("api", "web"):
        reference = f"lumilab-b-{service}:{git_sha}"
        data = json.loads(command(["docker", "image", "inspect", reference]))[0]
        require(data["Config"]["Labels"].get("org.opencontainers.image.revision") == git_sha,
            "Image revision label mismatch")
        images[service] = {"reference": reference, "image_config_digest": data["Id"],
            "registry_digests": data.get("RepoDigests") or []}
    return images


def verify_bundle(directory, *, load=False, for_release=True):
    manifest = json.loads((directory / "release.json").read_text("utf-8"))
    require(manifest["schema_version"] == "docker-release-1.0" and
        SHA.fullmatch(manifest["git_sha"]), "Invalid release identity")
    require(not for_release or not manifest["source_dirty"], "Dirty-checkout bundle is not releasable")
    if for_release:
        evidence = json.loads((directory / "smoke.json").read_text("utf-8"))
        require(evidence.get("passed") is True and evidence.get("recreated_images") is True
            and evidence.get("retained_run_survived") is True and evidence.get("git_sha") == manifest["git_sha"],
            "Successful Docker/rollback smoke evidence required")
    require(manifest["archive"]["file"] == "images.tar.gz", "Unexpected archive path")
    archive = directory / "images.tar.gz"
    require(sha256(archive) == manifest["archive"]["sha256"], "Archive checksum mismatch")
    validate_identity(manifest["web"], manifest["api"], manifest["git_sha"])
    for service in ("api", "web"):
        require(manifest["images"][service]["reference"] == f"lumilab-b-{service}:{manifest['git_sha']}",
            "Unexpected image reference")
    if load:
        command(["docker", "image", "load", "--input", str(archive)])
    actual = image_info(manifest["git_sha"])
    for service in ("api", "web"):
        require(actual[service]["image_config_digest"] == manifest["images"][service]["image_config_digest"],
            "Local image missing or differs from retained release")
    override = {"services": {name: {"image": actual[name]["reference"], "pull_policy": "never"}
        for name in ("api", "web")}}
    override["services"]["api"]["environment"] = {"LUMILAB_LLM_ENABLED": "false",
        "LUMILAB_LLM_EVENT_CAP": "0", "LUMILAB_RAG_ENABLED": "false"}
    # JSON is valid YAML and needs no additional parser dependency.
    write_json(directory / "rollback.yml", override)
    return manifest


def build_test(args):
    git_sha = command(["git", "rev-parse", "HEAD"])
    require(SHA.fullmatch(git_sha), "Full Git SHA required")
    dirty = bool(command(["git", "status", "--porcelain"]))
    require(not dirty or args.allow_dirty, "Commit changes first, or use --allow-dirty for local tests only")
    project = args.project or f"lumilab-ci-{git_sha[:12]}-{uuid4().hex[:8]}"
    require(re.fullmatch(r"lumilab-ci-[a-z0-9-]{1,60}", project), "Only isolated lumilab-ci-* projects are allowed")
    output = local_output(args.output)
    require(not output.exists(), "Output exists; choose a new bundle directory")
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    env = {k: v for k, v in os.environ.items() if not k.startswith(("LUMILAB_", "COMPOSE_"))}
    env.update(LUMILAB_BUILD_SHA=git_sha, LUMILAB_CI_WEB_PORT=str(port))
    compose = ["docker", "compose", "-p", project, "-f", str(ROOT / "docker/compose.ci.yml")]
    require(not command(compose + ["ps", "-aq"], env=env), "Project already has containers; refusing reuse/cleanup")
    output.mkdir(parents=True)
    try:
        print("Building isolated Docker images...", flush=True)
        subprocess.run(compose + ["build"], cwd=ROOT, env=env, check=True)
        subprocess.run(compose + ["up", "-d", "--no-build", "--wait", "--wait-timeout", "180", "web"],
            cwd=ROOT, env=env, check=True)
        identity, retained_run = smoke(f"http://127.0.0.1:{port}", git_sha)
        images = image_info(git_sha)
        archive = output / "images.tar.gz"
        print("Retaining tested images and checksums...", flush=True)
        with (archive.open("xb") as file,
                gzip.GzipFile(fileobj=file, mode="wb", mtime=0) as compressed,
                subprocess.Popen(["docker", "image", "save", *[v["reference"] for v in images.values()]],
                    stdout=subprocess.PIPE) as process):
            shutil.copyfileobj(process.stdout, compressed)
            require(process.wait() == 0, "Image export failed")
        manifest = {"schema_version": "docker-release-1.0", "git_sha": git_sha, "source_dirty": dirty,
            "images": images, "archive": {"file": archive.name, "sha256": sha256(archive)}, **identity}
        write_json(output / "release.json", manifest)
        verify_bundle(output, load=True, for_release=False)
        print("Recreating API/web from retained images; preserving the test DB...", flush=True)
        subprocess.run(compose + ["-f", str(output / "rollback.yml"), "up", "-d", "--no-build",
            "--no-deps", "--force-recreate", "--wait", "--wait-timeout", "180", "api", "web"],
            cwd=ROOT, env=env, check=True)
        smoke(f"http://127.0.0.1:{port}", git_sha, identity)
        path, token, saved = retained_run
        require(request(f"http://127.0.0.1:{port}", path, token=token) == saved,
            "Owned run did not survive image recreation")
        write_json(output / "smoke.json", {"passed": True, "git_sha": git_sha,
            "nginx_proxy": True, "owned_run": True, "idempotency": True, "cross_session_denied": True,
            "tutor_template": True, "provider_attempts": 0, "version_match": True,
            "archive_loaded": True, "recreated_images": True, "retained_run_survived": True})
        print(f"Docker smoke and rollback recreation passed. Bundle: {output.relative_to(ROOT)}", flush=True)
    except Exception:
        try:
            (output / "compose.log").write_text(command(compose + ["logs", "--no-color", "--tail", "150"], env=env), encoding="utf-8")
        except subprocess.CalledProcessError:
            pass
        raise
    finally:
        # This unique test project has tmpfs data, no developer volumes and no published DB/API ports.
        subprocess.run(compose + ["down", "--remove-orphans"], cwd=ROOT, env=env, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    build = sub.add_parser("build-test")
    build.add_argument("--project")
    build.add_argument("--output", type=Path, required=True)
    build.add_argument("--allow-dirty", action="store_true")
    verify = sub.add_parser("verify")
    verify.add_argument("--bundle", type=Path, required=True)
    verify.add_argument("--load", action="store_true")
    args = parser.parse_args()
    if args.action == "build-test":
        build_test(args)
    else:
        verify_bundle(args.bundle.resolve(), load=args.load)
        print("Archive checksum, image digests and labels verified; rollback.yml prepared. No deployment performed.")


if __name__ == "__main__":
    main()
