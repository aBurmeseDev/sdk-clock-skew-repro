/**
 * Test 1: Error Handler Retry Path
 *
 * Starts with a bad systemClockOffset (-30 min) and checks whether
 * the SDK corrects the offset and retries on InvalidSignatureException.
 */
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const pkgJson = require("@aws-sdk/client-dynamodb/package.json");

const dynamodb = new DynamoDB({
  region: "us-west-2",
  systemClockOffset: -30 * 60 * 1000,
});

(async () => {
  console.log(pkgJson.name, "@", pkgJson.version);
  console.log("system clock offset before:", dynamodb.config.systemClockOffset);
  try {
    const result = await dynamodb.listTables({ Limit: 1 });
    console.log("system clock offset after:", dynamodb.config.systemClockOffset);
    console.log("metadata:", result.$metadata);
  } catch (e) {
    console.log("ERROR:", e.name, "-", e.message);
    console.log("attempts:", e.$metadata?.attempts);
    console.log("totalRetryDelay:", e.$metadata?.totalRetryDelay);
    console.log("clockSkewCorrected:", e.$metadata?.clockSkewCorrected);
    console.log("system clock offset after error:", dynamodb.config.systemClockOffset);
  }
})();
