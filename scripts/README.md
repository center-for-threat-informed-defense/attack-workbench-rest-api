This directory holds utility scripts that are used for system configuration during software development.

## Release-track backref repair

`reconcileReleaseTrackBackrefs.js` repairs durable failed or pending
`workspace.release_tracks` reconciliation attempts:

```bash
npm run repair:release-track-backrefs
npm run repair:release-track-backrefs -- --limit=500
```

Use `--all` after an unclean shutdown or when legacy drift is suspected. It
reconciles all registry tracks and removes stale backrefs whose track no
longer exists:

```bash
npm run repair:release-track-backrefs -- --all
```

The script requires the normal `DATABASE_URL`, prints a JSON result, and exits
nonzero when any repair still fails.
