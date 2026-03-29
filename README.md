# Student Portal — CS515 Unix Programming (Assignment 03)

A two-tier web application where admins can manage student records and students can view them.

## Tech Stack
- **Frontend/API**: Node.js + Express + EJS
- **Database**: PostgreSQL 16
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (Minikube)

## Run Locally (Docker Compose)
```bash
docker-compose up --build
# Open http://localhost:3000
```

## Run on Kubernetes (Minikube)
```bash
minikube start
eval $(minikube docker-env)
docker build -t student-portal:latest -f Dockerfile app/
kubectl apply -f k8s/
minikube service student-portal-service
```
