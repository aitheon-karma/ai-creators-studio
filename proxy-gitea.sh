#!/bin/bash

kubectl port-forward svc/gitea 5555:3000 --namespace=gitea