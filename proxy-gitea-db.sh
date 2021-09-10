#!/bin/bash

kubectl port-forward svc/gitea-db-service 5432:5432 --namespace=gitea