# Policy Configuration Fixes Summary

## Overview
Fixed all unsupported fields in NGINX Gateway Fabric policy configurations based on CRD validation errors.

## Changes Made

### 1. ClientSettingsPolicy - clientbodysize-policy.yaml
**Removed unsupported fields:**
- `body.bufferSize`
- `body.tempFile.enabled`
- `body.tempFile.writeSize` 
- `body.tempFile.maxSize`
- `headers.largeClientHeaderBuffers`

**Added proper fields:**
- `body.timeout` for request body read timeout

### 2. ClientSettingsPolicy - timeout-policy.yaml
**Fixed fields:**
- Changed `timeouts.proxy` object to individual fields:
  - `timeouts.proxyConnect`
  - `timeouts.proxySend`
  - `timeouts.proxyRead`
- Changed `retries.retryOn` to `retries.conditions`
- Removed `retries.backoff.baseInterval` and `retries.backoff.maxInterval`
- Changed `circuitBreaker.sleepWindow` to `circuitBreaker.baseEjectionTime`
- Removed `circuitBreaker.errorPercentThreshold` and `circuitBreaker.minimumRequests`
- Added `circuitBreaker.maxEjectionPercent`
- Removed `targetRef.sectionName`

### 3. ClientSettingsPolicy - ratelimit-policy.yaml
**Removed unsupported fields from connectionLimit:**
- `connectionLimit.key`
- `connectionLimit.logLevel`
- `connectionLimit.rejectCode`
- `connectionLimit.zoneSize`

### 4. ObservabilityPolicy - observability-policy.yaml
**Removed unsupported fields:**
- `accessLog.destination`
- `metrics.format`
- `metrics.labels`
- `tracing.injectHeaders`
- `tracing.otel.attributes`
- `tracing.otel.protocol`
- `healthCheck.upstream.path`
- `healthCheck.upstream.expectedStatus`

**Fixed fields:**
- Changed `healthCheck.gateway` to `healthCheck.status`
- Changed error page policy from `ClientSettingsPolicy` to `ObservabilityPolicy`
- Changed `errorPages[].response` to `errorPages[].return`

## Validation
All policies now conform to the NGINX Gateway Fabric CRD schemas defined in `kustomize/base/nginx-fabric/crds.yaml`.