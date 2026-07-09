# AGENTS.local.md — machine-specific agent configuration

Copy this file to `AGENTS.local.md` (gitignored) and fill in the paths for
your machine. Agents consult this file for local resource locations referenced
by `AGENTS.md`.

## Workbench workspace

Parent directory containing the sibling Workbench repos
(`attack-workbench-frontend`, `attack-workbench-deployment`,
`attack-workbench-taxii-server`, ...):

```
/path/to/workbench/
```

## ADM source checkout

Local clone of https://github.com/mitre-attack/attack-data-model
(Zod schemas under `src/schemas/{sdo,sro,smo,common}`):

```
/path/to/attack-data-model
```

## Bruno API collection

Local Bruno collection mirroring this API (omit this section if you don't
maintain one — agents will then skip the Bruno step in the task workflow):

```
/path/to/bruno/workbench/
```
