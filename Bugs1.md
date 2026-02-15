# ManjaWord Known Issues (V1)

## Bug #001 — Editor writes vertically instead of horizontally

Status: Open  
Severity: Medium  
Version: 1.0.0  
Component: Frontend (Quill Editor Layout)

Description:
When typing text, characters appear vertically instead of horizontally.

Example:
h
e
l
l
o

Expected:
hello

Root Cause:
Likely CSS layout constraint in flex container. Editor width is collapsing.

Impact:
Editor still functions, but layout is incorrect.

Workaround:
None currently.

Planned Fix:
V1.1 — Fix editor container layout and width handling.

Reported on:
2026-02-15
