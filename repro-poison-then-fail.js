/**
 * Test 5: Poison then Fail Scenario
 *
 * After poisoning the offset via a stale Date header, manually set
 * the offset to a value that will cause InvalidSignatureException
 * (simulating what happens when the poisoned offset is large enough
 * to push the signing date outside the 5-min window).
 *
 * This tests whether the errorHandler can recover from the failure.
 */
const {
	DynamoDBClient,
	ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const pkgJson = require("@aws-sdk/client-dynamodb/package.json");

(async () => {
	console.log(pkgJson.name, "@", pkgJson.version);

	// Step 1: Normal client, set a bad offset manually (as if successHandler poisoned it)
	const client = new DynamoDBClient({
		region: "us-west-2",
		systemClockOffset: -6 * 60 * 1000, // -6 minutes, enough to cause InvalidSignatureException
	});

	console.log(
		"\n--- Step 1: Request with -6 min offset (should trigger InvalidSignatureException) ---",
	);
	console.log("offset before:", client.config.systemClockOffset);
	try {
		const r = await client.send(new ListTablesCommand({ Limit: 1 }));
		console.log(
			"OK - offset after:",
			client.config.systemClockOffset,
			"attempts:",
			r.$metadata.attempts,
		);
	} catch (e) {
		console.log("FAIL:", e.name);
		console.log("  attempts:", e.$metadata?.attempts);
		console.log("  clockSkewCorrected:", e.$metadata?.clockSkewCorrected);
		console.log("  offset after:", client.config.systemClockOffset);
	}

	console.log("\n--- Step 2: Subsequent request (can SDK recover?) ---");
	console.log("offset before:", client.config.systemClockOffset);
	try {
		const r = await client.send(new ListTablesCommand({ Limit: 1 }));
		console.log(
			"OK - offset after:",
			client.config.systemClockOffset,
			"attempts:",
			r.$metadata.attempts,
		);
	} catch (e) {
		console.log("FAIL:", e.name);
		console.log("  attempts:", e.$metadata?.attempts);
		console.log("  clockSkewCorrected:", e.$metadata?.clockSkewCorrected);
		console.log("  offset after:", client.config.systemClockOffset);
	}
})();
