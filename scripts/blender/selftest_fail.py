# Runner self-test: raises, so run-blender.ps1 must throw (non-zero exit).
raise RuntimeError("selftest_fail: intentional failure")
