#!/bin/bash
# Script to fix production deployment selector issues
# This will cause a brief downtime as deployments are recreated

set -e

echo "This script will delete and recreate deployments in production to fix selector issues."
echo "This WILL cause downtime. Continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

NAMESPACE="scavenger-hunt-prod"

echo "Backing up current deployments..."
kubectl get deployments -n $NAMESPACE -o yaml > production-deployments-backup.yaml

echo "Deleting existing deployments..."
kubectl delete deployment admin backend player postgres redis -n $NAMESPACE --ignore-not-found=true

echo "Waiting for pods to terminate..."
kubectl wait --for=delete pod -l app.kubernetes.io/component -n $NAMESPACE --timeout=60s || true

echo "Applying new deployments..."
kubectl apply -k kustomize/overlays/production

echo "Waiting for new deployments to be ready..."
kubectl rollout status deployment/admin -n $NAMESPACE
kubectl rollout status deployment/backend -n $NAMESPACE  
kubectl rollout status deployment/player -n $NAMESPACE
kubectl rollout status deployment/postgres -n $NAMESPACE
kubectl rollout status deployment/redis -n $NAMESPACE

echo "Deployment recreation complete!"
kubectl get deployments -n $NAMESPACE