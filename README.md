<<<<<<< HEAD
# sdk-clock-skew-repro
=======
# SDK Clock Skew Correction — InvalidSignatureException Repro

Reproduction scripts for investigating `InvalidSignatureException` caused by the SDK's clock skew correction logic poisoning `systemClockOffset`.

**Related**: [GitHub #7605](https://github.com/aws/aws-sdk-js-v3/issues/7605)

## Setup

```bash
npm install
```

`repro-bad-offset.js` - Starts with a bad offset (-30 min) to test whether the SDK corrects and retries. detects clock skew on the error response, corrects offset, retries, succeeds.

`repro-watch-offset.js` - Monitors `systemClockOffset` changes during normal operation to detect if the `successHandler` ever poisons it.

`repro-stale-header.js` - Injects a stale `Date` header into successful responses via middleware to simulate the conditions that trigger the `successHandler` poisoning. The `successHandler` sees the stale header, computes a bad offset, and subsequent requests fail with `InvalidSignatureException`.

`repro-sustained-poison.js` - Poisons one response then observes whether subsequent calls self-correct.

`repro-poison-then-fail.js`- Sets a bad offset directly and tests whether the error handler can recover.
>>>>>>> 1ec0e47 (feat: clock skew correction repro scripts for InvalidSignature)
