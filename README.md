# Student Data Portal — Project Report

**Indian Institute of Information Technology Tiruchirappalli** | **CS515 - Unix Programming | Assignment 03**

**Name:** Goutham | **Roll No:** 231120 | **Date:** 10-04-2026

---

## 1. Project Link
[Google Drive Link](https://drive.google.com/file/d/13hoGSB0NZGncaVHreN6t-tb3QvYPe7Ld/view?usp=sharing)

## 2. Project Overview
This project is a two-tier Student Data Portal web application. It consists of a Node.js and Express web server as the front-end and API layer, and a PostgreSQL database as the backend storage layer.

The Admin Panel allows authorised staff to log in, add new student records, and delete existing ones. The Student View is publicly accessible and displays all student records in a searchable, filterable table sorted by roll number.

Authentication is implemented using `express-session`. The admin must log in with a username and password before accessing the admin panel or any protected API routes. The session expires after one hour.

### Tech Stack:
* **Front-end / API:** Node.js, Express, EJS templating
* **Database:** PostgreSQL 16
* **Containerization:** Docker, Docker Compose (multi-stage build)
* **Orchestration:** Kubernetes via Minikube (2 app replicas)
* **Auth:** express-session (session-based login)

---

## 3. Step-by-Step Instructions

**Prerequisites:** Docker, Minikube, and Git must be installed on your machine.

### Step 1 — Get the Source Code
Download the project files from the [Google Drive link](https://drive.google.com/file/d/13hoGSB0NZGncaVHreN6t-tb3QvYPe7Ld/view?usp=sharing) and extract them. Then navigate into the project directory:
```bash
cd student-portal
```

### Step 2 — Run with Docker Compose (Local Testing)
This starts the web app and PostgreSQL together using Docker Compose:
```bash
docker-compose up --build
```
Once running, open a browser and visit:
* **Student View:** http://localhost:3000
* **Admin Login:** http://localhost:3000/login

**Admin credentials:**
* **Username:** `admin`
* **Password:** `admin123`

To stop the application:
```bash
docker-compose down
```

### Step 3 — Deploy to Kubernetes using Minikube

**Step 3.1** — Start Minikube:
```bash
minikube start --driver=docker
```

**Step 3.2** — Set a temporary `kubectl` alias for this terminal session (`kubectl` is bundled with Minikube):
```bash
alias kubectl="minikube kubectl --"
```

**Step 3.3** — Point Docker to Minikube's internal Docker daemon so the image is available inside the cluster:
```bash
eval $(minikube docker-env)
```

**Step 3.4** — Build the Docker image inside Minikube:
```bash
docker build -t student-portal:latest -f Dockerfile app/
```

**Step 3.5** — Apply all Kubernetes manifest files:
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/deployment.yaml
```

**Step 3.6** — Wait for all pods to reach Running state (takes 30-60 seconds):
```bash
kubectl get pods -w
```
*Press `Ctrl+C` once all 3 pods show Running (2 app replicas + 1 PostgreSQL pod).*

**Step 3.7** — Open the application in the browser:
```bash
minikube service student-portal-service
```
*Minikube will automatically open the application URL in your default browser.*

### Step 4 — Stopping the Application
To stop and remove all running Kubernetes resources:
```bash
kubectl delete -f k8s/
minikube stop
eval $(minikube docker-env --unset)
```
