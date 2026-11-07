import argparse
import json
import subprocess
from copy import deepcopy

import pytest
from scripts import docker_release as release


def identity():
    web = {"schema_version": "web-build-1.0", "git_sha": "a" * 40,
        "mapping_revision": "map-v1", "mapping_fingerprint": "b" * 64,
        "runtime_fingerprint": "c" * 64}
    api = {"schema_version": "system-info-1.0", "git_sha": "a" * 40,
        "mapping": {"revision": "map-v1"}, "mapping_fingerprint": "b" * 64,
        "runtime_fingerprint": "c" * 64, "corpus_revision": "corpus-v1",
        "retrieval": {"available": True, "matches_corpus": True,
            "corpus_revision": "corpus-v1", "fingerprint": "d" * 64}}
    return web, api


@pytest.mark.parametrize("part,key,value", [
    ("web", "git_sha", "e" * 40), ("web", "runtime_fingerprint", "e" * 64),
    ("web", "mapping_fingerprint", "e" * 64), ("web", "mapping_revision", "map-v0"),
    ("api", "corpus_revision", "corpus-v2"),
])
def test_mixed_release_or_stale_index_is_rejected(part, key, value):
    web, api = identity()
    {"web": web, "api": api}[part][key] = value
    with pytest.raises(ValueError, match="mismatch|artifact"):
        release.validate_identity(web, api, "a" * 40)


def test_retained_index_fingerprint_is_checked_even_when_revision_unchanged():
    web, api = identity()
    expected = deepcopy({"web": web, "api": api})
    api["retrieval"]["fingerprint"] = "f" * 64
    with pytest.raises(ValueError, match="retained release"):
        release.validate_identity(web, api, "a" * 40, expected)


@pytest.fixture
def bundle(tmp_path, monkeypatch):
    web, api = identity()
    archive = tmp_path / "images.tar.gz"
    archive.write_bytes(b"fixture archive, no Docker daemon needed")
    images = {service: {"reference": f"lumilab-b-{service}:" + "a" * 40,
        "image_config_digest": "sha256:" + char * 64, "registry_digests": []}
        for service, char in [("api", "1"), ("web", "2")]}
    manifest = {"schema_version": "docker-release-1.0", "git_sha": "a" * 40,
        "source_dirty": False, "images": images, "web": web, "api": api,
        "archive": {"file": archive.name, "sha256": release.sha256(archive)}}
    release.write_json(tmp_path / "release.json", manifest)
    release.write_json(tmp_path / "smoke.json", {"passed": True, "git_sha": "a" * 40,
        "recreated_images": True, "retained_run_survived": True})
    monkeypatch.setattr(release, "image_info", lambda sha: deepcopy(images))
    return tmp_path, manifest


def test_verify_prepares_only_pinned_images_with_live_disabled(bundle):
    directory, _ = bundle
    release.verify_bundle(directory)
    override = json.loads((directory / "rollback.yml").read_text())
    assert override["services"]["api"]["environment"]["LUMILAB_LLM_EVENT_CAP"] == "0"
    assert override["services"]["web"]["pull_policy"] == "never"
    assert set(override["services"]) == {"api", "web"}


def test_corrupt_or_incomplete_bundle_is_rejected_before_docker(bundle, monkeypatch):
    directory, manifest = bundle
    monkeypatch.setattr(release, "image_info", lambda _: pytest.fail("Must reject before Docker"))
    (directory / "images.tar.gz").write_bytes(b"changed")
    with pytest.raises(ValueError, match="checksum"):
        release.verify_bundle(directory)
    manifest["source_dirty"] = True
    release.write_json(directory / "release.json", manifest)
    with pytest.raises(ValueError, match="not releasable"):
        release.verify_bundle(directory)


def test_missing_smoke_or_missing_image_never_becomes_known_good(bundle, monkeypatch):
    directory, _ = bundle
    release.write_json(directory / "smoke.json", {"passed": False})
    with pytest.raises(ValueError, match="smoke evidence"):
        release.verify_bundle(directory)
    release.write_json(directory / "smoke.json", {"passed": True, "git_sha": "a" * 40,
        "recreated_images": True, "retained_run_survived": True})

    def missing(_):
        raise subprocess.CalledProcessError(1, ["docker", "image", "inspect"])
    monkeypatch.setattr(release, "image_info", missing)
    with pytest.raises(subprocess.CalledProcessError):
        release.verify_bundle(directory)
    assert not (directory / "rollback.yml").exists()


def test_build_refuses_developer_project_without_docker_or_output(tmp_path, monkeypatch):
    monkeypatch.setattr(release, "ROOT", tmp_path)
    calls = []

    def git_only(args, **kwargs):
        calls.append(args)
        assert args[0] == "git"
        return "a" * 40 if args[1] == "rev-parse" else ""
    monkeypatch.setattr(release, "command", git_only)
    output = tmp_path / ".local/release"
    with pytest.raises(ValueError, match="isolated"):
        release.build_test(argparse.Namespace(project="lumilab-b-dev", output=output, allow_dirty=False))
    assert not output.exists() and len(calls) == 2
