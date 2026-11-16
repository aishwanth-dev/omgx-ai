# Runner self-test: succeeds, so run-blender.ps1 must exit 0.
import sys
import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
assert "--site" in argv, "runner must pass --site"
print("selftest_ok: blender", bpy.app.version_string, "site", argv[argv.index("--site") + 1])
