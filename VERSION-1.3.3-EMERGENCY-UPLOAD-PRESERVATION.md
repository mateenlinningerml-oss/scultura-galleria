# Version 1.3.3 — Emergency upload preservation

- Deployments no longer overwrite Persistent Disk `data/content.json`.
- Deployments no longer delete files from Persistent Disk `uploads/`.
- Repository content and images are copied only when missing.
- Existing Admin uploads survive future Render deployments.
