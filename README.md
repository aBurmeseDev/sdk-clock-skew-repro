# SDK Clock Skew Correction — InvalidSignatureException Repro

Reproduction scripts for investigating `InvalidSignatureException` caused by the SDK's clock skew correction logic poisoning `systemClockOffset`.

**Related**: [GitHub #7605](https://github.com/aws/aws-sdk-js-v3/issues/7605)

## Setup

```bash
npm install 
```

## Scenarios and Findings

Run each scenario and observe findings.

- `repro-initial-offset.js` - starts with a bad offset (-30 min) to test whether the SDK corrects and retries. detects clock skew on the error response, corrects offset, retries, succeeds.

- `repro-watch-offset.js` - runs 20 normal calls monitoring offset which stays at 0 the entire time. `successHandler` does not poison it under normal conditions.

- `repro-stale-header.js` - injects a stale `Date` header into successful response. Offset jumps from 0 to -360,011. Next call self-corrects locally because it 
gets a fresh header.

- `repro-sustained-poison.js` - poisons one response then runs 5 more. Offset gets poisoned on the first call, self corrects on the second call.

- `repro-poison-then-fail.js`- sets -6 min offset directly. DynamoDB still accepted the request (within tolerance), offset self-corrected.
