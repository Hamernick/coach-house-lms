#!/usr/bin/env python3
"""Dependency-free, read-only TUI for the JSON record in FLIGHTPLAN.md."""
import argparse
import curses
import json
from pathlib import Path
import re
import sys
import textwrap

DEFAULT = Path(__file__).resolve().parents[1] / "FLIGHTPLAN.md"


def load(path):
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<!-- flightplan:data -->\s*```json\n(.*?)\n```", text, re.S)
    if not match:
        raise ValueError("Missing flightplan:data JSON block")
    data = json.loads(match[1])
    if data.get("version") != 1 or not isinstance(data.get("projects"), list):
        raise ValueError("Expected version 1 and projects array")
    ids = [p["id"] for p in data["projects"]]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate project ID")
    for project in data["projects"]:
        for key in ("title", "status", "depends_on", "milestones", "next", "prompt"):
            if key not in project:
                raise ValueError(f"{project['id']}: missing {key}")
        for dep in project["depends_on"]:
            if dep not in ids or dep == project["id"]:
                raise ValueError(f"{project['id']}: invalid dependency {dep}")
        for milestone in project["milestones"]:
            if not isinstance(milestone.get("done"), bool):
                raise ValueError("Milestone done must be boolean")
            if milestone["done"] and not milestone.get("evidence"):
                raise ValueError(f"{project['id']}: completed milestone needs evidence")
    visiting, visited = set(), set()
    by_id = {p["id"]: p for p in data["projects"]}

    def visit(key):
        if key in visiting:
            raise ValueError("Dependency cycle")
        if key in visited:
            return
        visiting.add(key)
        for dep in by_id[key]["depends_on"]:
            visit(dep)
        visiting.remove(key)
        visited.add(key)

    for key in ids:
        visit(key)
    return data


def progress(project):
    gates = project["milestones"]
    done = sum(g["done"] for g in gates)
    total = len(gates)
    percent = 100 * done // total if total else 0
    filled = percent // 10
    return f"[{'#' * filled}{'-' * (10 - filled)}] {percent:3d}% {done}/{total}"


def overview(data):
    projects = data["projects"]
    lines = ["FLIGHTPLAN | PROJECT CONTROL", f"Evidence updated: {data['updated_at']}",
             "Progress = verified milestones, not time spent or release approval.", "",
             f"Projects {len(projects)} | Active {sum(p['status'] == 'active' for p in projects)}"
             f" | Blocked {sum(p['status'] == 'blocked' for p in projects)}", ""]
    if not projects:
        lines.append("Awaiting your task list.")
    for i, p in enumerate(projects):
        lines.append(f"{i + 1:02d} {p['id']:9} {p['title'][:33]:33} {progress(p)} {p['status']}")
    lines += ["", "NEXT: " + data.get("next", "Unspecified"),
              "FORECAST: " + data.get("forecast", "Not estimated")]
    return lines


def details(project):
    lines = [f"{project['id']} | {project['title']}", progress(project), ""]
    for field in ("outcome", "status", "branch", "worktree", "localhost", "backup",
                  "release", "next", "estimate", "confidence", "updated_at"):
        lines.append(f"{field.upper()}: {project.get(field, 'Unspecified')}")
    lines += ["DEPENDS ON: " + (", ".join(project["depends_on"]) or "None"), "", "MILESTONES"]
    for gate in project["milestones"]:
        lines.append(f"[{'x' if gate['done'] else ' '}] {gate['title']}")
        if gate.get("evidence"):
            lines.append("    " + gate["evidence"])
    return lines


def tui(screen, path):
    try:
        curses.curs_set(0)
    except curses.error:
        pass
    screen.keypad(True)
    screen.timeout(1000)
    selected, mode, scroll = 0, "list", 0
    last_data, error = None, ""
    while True:
        try:
            last_data = load(path)
            error = ""
        except (OSError, ValueError, KeyError, TypeError) as exc:
            error = f"READ ERROR (showing last valid data): {exc}"
        data = last_data or {"projects": [], "updated_at": "Unavailable"}
        projects = data["projects"]
        selected = min(selected, max(0, len(projects) - 1))
        height, width = screen.getmaxyx()
        screen.erase()
        if mode == "list":
            lines = overview(data)
            if projects:
                lines[6 + selected] = "> " + lines[6 + selected]
        elif projects and mode == "prompt":
            lines = ["COPY-PASTE CHAT PROMPT", "", projects[selected]["prompt"]]
        elif projects:
            lines = details(projects[selected])
        else:
            mode, lines = "list", overview(data)
        wrapped = []
        for line in lines:
            wrapped.extend(textwrap.wrap(line, max(1, width - 2), replace_whitespace=False) or [""])
        if mode == "list" and projects:
            # Keep the selected row visible, including when narrow terminals wrap it.
            target = sum(len(textwrap.wrap(line, max(1, width - 2))) or 1
                         for line in lines[:6 + selected])
            scroll = max(0, target - max(1, height - 6))
        scroll = min(scroll, max(0, len(wrapped) - max(1, height - 3)))
        for y, line in enumerate(wrapped[scroll:scroll + max(0, height - 3)]):
            try:
                screen.addnstr(y, 0, line, max(0, width - 1))
            except curses.error:
                pass
        footer = error or "Up/Down j/k Select/Scroll | Enter Details | P Prompt | Esc List | Q Quit"
        try:
            screen.addnstr(max(0, height - 1), 0, footer, max(0, width - 1), curses.A_REVERSE)
        except curses.error:
            pass
        screen.refresh()
        key = screen.getch()
        if key in (ord("q"), ord("Q")):
            return
        if key in (27, ord("b")):
            mode, scroll = "list", 0
        elif key in (10, 13, curses.KEY_ENTER) and projects:
            mode, scroll = "detail", 0
        elif key in (ord("p"), ord("P")) and projects:
            mode, scroll = "prompt", 0
        elif key in (curses.KEY_DOWN, ord("j")):
            if mode == "list":
                selected = min(selected + 1, max(0, len(projects) - 1))
            else:
                scroll += 1
        elif key in (curses.KEY_UP, ord("k")):
            if mode == "list":
                selected = max(0, selected - 1)
            else:
                scroll = max(0, scroll - 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", type=Path, default=DEFAULT)
    parser.add_argument("--once", action="store_true", help="Print without a terminal")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--prompt", metavar="PROJECT_ID")
    args = parser.parse_args()
    try:
        data = load(args.file)
        if args.validate:
            print(f"Valid FLIGHTPLAN: {len(data['projects'])} projects")
        elif args.prompt:
            project = next((p for p in data["projects"] if p["id"] == args.prompt), None)
            if not project:
                raise ValueError(f"Unknown project: {args.prompt}")
            print(project["prompt"])
        elif args.once or not sys.stdin.isatty() or not sys.stdout.isatty():
            print("\n".join(overview(data)))
        else:
            curses.wrapper(tui, args.file)
    except (OSError, ValueError, KeyError, TypeError, curses.error) as exc:
        parser.exit(1, f"FLIGHTPLAN: {exc}\n")


if __name__ == "__main__":
    main()
