# 🚦 ITS Dashboard UI (B3)

Traffic Dashboard & Visualization Module for the **Intelligent Traffic System**

This repository contains the frontend dashboards and real-time visualization components for traffic monitoring, including:

* Admin Dashboard
* Traffic Officer Dashboard
* User Interface (Web/Mobile)
* Real-time traffic updates & heatmaps

---

# 🌳 Branching Strategy

We follow a **Trunk-Based Development with Feature Branches** approach.

## Main Branches

```bash
main   → Stable, production-ready (demo-ready)
dev    → Integration branch for ongoing development
```

---

## Feature Branch Naming Convention

All new work must be done using feature branches:

```bash
feature/<scope>-<short-description>
```

### Examples:

```bash
feature/admin-dashboard
feature/traffic-heatmap
feature/realtime-updates
feature/auth-integration
feature/user-mobile-ui
```

### Subgroup-based naming (recommended):

```bash
feature/b3-admin-dashboard
feature/b3-traffic-map
feature/b3-socket-integration
```

---

# 🔄 Development Workflow

## 1. Start from `dev`

```bash
git checkout dev
git pull origin dev
```

---

## 2. Create a feature branch

```bash
git checkout -b feature/<name>
```

---

## 3. Work and commit

```bash
git add .
git commit -m "Add: traffic heatmap visualization"
```

---

## 4. Push branch

```bash
git push origin feature/<name>
```

---

## 5. Create Pull Request (PR)

```text
feature/* → dev
```

* Ensure code is tested
* Keep PR small and focused
* Link PR to issue (recommended)

---

## 6. Merge to `main`

When features are stable and integrated:

```text
dev → main
```

---

# 🔗 Linking Pull Requests to Issues (Agile Practice)

To maintain proper tracking and Agile workflow, every Pull Request should be linked to an Issue.

## ✅ Method (Recommended)

Add one of the following keywords in your PR description:

```bash
Closes #issue-number
Fixes #issue-number
Resolves #issue-number
```

### Example:

```bash
Closes #7 - Add traffic heatmap feature
```

---

## 🎯 What this does:

* Automatically links PR to the Issue
* Automatically closes the Issue when PR is merged
* Provides clear traceability for development

---

## 🧪 Example PR Description

```text
Closes #7

### Changes:
- Added traffic heatmap using Mapbox
- Integrated real-time data updates
- Improved UI responsiveness
```

---

# 🔒 Branch Protection Rules (main)

The `main` branch is protected to ensure code quality and stability.

## Rules enforced:

* ✅ Pull Request required before merging
* ✅ Minimum 1 approval required
* ✅ Dismiss stale approvals on new commits
* ✅ All conversations must be resolved
* ✅ Linear history enforced (clean commits)
* ✅ Force pushes are blocked
* ✅ Squash merge only

---

# 🔀 Merge Strategy

We use:

```text
✔ Squash Merge ONLY
```

### Why?

* Keeps commit history clean
* One commit per feature
* Easier to track changes

---

# 🧠 Best Practices

## ✅ Do:

* Create small, focused feature branches
* Merge frequently into `dev`
* Write meaningful commit messages
* Review code before merging
* Keep branches short-lived

## ❌ Don’t:

* Push directly to `main`
* Mix multiple features in one branch
* Keep long-running branches
* Ignore PR comments

---

# 📌 GitHub Workflow Mapping (Agile)

| GitHub         | Purpose        |
| -------------- | -------------- |
| Issue          | User Story     |
| Feature Branch | Task           |
| Pull Request   | Implementation |
| Merge          | Completion     |

---

# 🚀 Summary

```text
feature → dev → main
```

This workflow ensures:

* Fast development
* Clean collaboration
* Stable releases

---

# 👨‍💻 Tech Stack

* Next.js (Frontend)
* Socket.IO (Real-time updates)
* Mapbox (Traffic visualization)
* Keycloak (Authentication)

---

# 📢 Contribution

1. Create an issue
2. Create a feature branch
3. Submit a PR to `dev`
4. Get approval
5. Merge 🚀

---

# 📄 License

This project is part of an academic system development project.
