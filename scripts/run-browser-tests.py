"""Run original game tests without changing their assertions, then deployed-build UI."""
from pathlib import Path
import os, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-results"
OUT.mkdir(exist_ok=True)
# The original source tests use /mnt/data for optional screenshots.
legacy = Path("/mnt/data")
try:
    legacy.mkdir(parents=True, exist_ok=True)
except PermissionError:
    subprocess.run(["sudo","mkdir","-p",str(legacy)],check=True)
    subprocess.run(["sudo","chown",str(os.getuid()),str(legacy)],check=True)
tests = [
    "test_2048_premium", "test_mines_premium", "test_mines_interactions",
    "test_block_premium", "test_block_drag", "test_sudoku_premium",
    "test_sudoku_modes_and_regression", "test_traffic_premium", "test_traffic_interactions",
    "test_bubble_premium", "test_bubble_logic_extra", "test_knife_premium",
    "test_onecard_premium", "test_onecard_rules", "test_poker_premium",
    "test_hexa_premium", "test_hexa_drag", "test_sky_premium",
    "test_runner_premium", "test_identity_split", "test_v18_quality", "test_v20_ui",
]
failed = []
for name in tests:
    command=[sys.executable,str(ROOT/"source/tests"/(name+".py"))]
    result=subprocess.run(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=100)
    (OUT/(name+".log")).write_text(result.stdout)
    print(("PASS " if result.returncode==0 else "FAIL ")+name,flush=True)
    if result.returncode:
        failed.append(name)
        print(result.stdout[-1800:],flush=True)
server=subprocess.Popen(["node","site/scripts/serve-test.mjs"],cwd=ROOT,stdout=subprocess.PIPE,text=True)
try:
    assert server.stdout.readline().startswith("READY")
    result=subprocess.run([sys.executable,str(ROOT/"tests/browser_acceptance.py")],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=200)
    (OUT/"browser_acceptance.log").write_text(result.stdout)
    print(result.stdout,flush=True)
    if result.returncode: failed.append("browser_acceptance")
finally:
    server.terminate()
    server.wait(timeout=15)
print("Browser suites:",len(tests)+1,"Failures:",failed,flush=True)
if failed: sys.exit(1)
