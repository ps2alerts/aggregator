#!/usr/bin/env bash
echo "Starting aggregator test pod..."
kubectl apply -f e2e-tests/provisioning/aggregator-k8s.yaml

set +e
echo "Waiting until aggregator pod is ready..."
READY=0
while [[ $READY == 0 ]]
do
  RESULT=$(kubectl get pods -n ps2alerts-tests -o custom-columns="NAMESPACE:metadata.namespace,POD:metadata.name,PodIP:status.podIP,READY:status.containerStatuses[*].ready" | grep "aggregator" | grep true -c)

  if [ "$RESULT" == "1" ]; then
    echo "✅ Aggregator ready!"
    READY=1
  else
    echo "⌛️ Aggregator not yet ready ($RESULT/1)... waiting"
    sleep 5
  fi
done
set -e
