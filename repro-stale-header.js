/**
 * Test 3: Simulated Stale Date Header
 *
 * Injects a stale Date header into successful responses via middleware
 * to simulate the conditions that trigger the successHandler poisoning.
 *
 * This reproduces the customer's scenario: offset starts at 0, a successful
 * response has a stale Date header, the successHandler computes a bad offset,
 * and subsequent requests fail with InvalidSignatureException.
 */
const {
	DynamoDBClient,
	ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const pkgJson = require("@aws-sdk/client-dynamodb/package.json");

const client = new DynamoDBClient({ region: "us-west-2" });

// Instrument offset
let _offset = client.config.systemClockOffset;
Object.defineProperty(client.config, "systemClockOffset", {
	get() {
		return _offset;
	},
	set(value) {
		if (value !== _offset) {
			console.log(`  [offset changed] ${_offset} -> ${value}`);
		}
		_offset = value;
	},
});

// Middleware that makes the Date header on the first successful response
// look like it's from 6 minutes ago, simulating a stale header.
let poisonNextResponse = false;
client.middlewareStack.add(
	(next) => async (args) => {
		const result = await next(args);
		if (poisonNextResponse && result.response?.headers?.date) {
			const staleDate = new Date(Date.now() - 6 * 60 * 1000).toUTCString();
			console.log(
				`  [injecting stale Date header] real: ${result.response.headers.date} -> stale: ${staleDate}`,
			);
			result.response.headers.date = staleDate;
			poisonNextResponse = false;
		}
		return result;
	},
	{ step: "deserialize", name: "staleDateHeaderPlugin", priority: "low" },
);

(async () => {
	console.log(pkgJson.name, "@", pkgJson.version);

	// Call 1: normal, should succeed with offset 0
	console.log("\n--- Call 1: Normal request ---");
	try {
		const r = await client.send(new ListTablesCommand({ Limit: 1 }));
		console.log(`OK - offset: ${_offset}, attempts: ${r.$metadata.attempts}`);
	} catch (e) {
		console.log(`FAIL: ${e.name} - offset: ${_offset}`);
	}

	// Call 2: inject stale Date header on the response
	console.log("\n--- Call 2: Injecting stale Date header (6 min old) ---");
	poisonNextResponse = true;
	try {
		const r = await client.send(new ListTablesCommand({ Limit: 1 }));
		console.log(`OK - offset: ${_offset}, attempts: ${r.$metadata.attempts}`);
	} catch (e) {
		console.log(`FAIL: ${e.name} - offset: ${_offset}`);
	}

	// Call 3: subsequent request with (now poisoned?) offset
	console.log("\n--- Call 3: Subsequent request after poisoning ---");
	try {
		const r = await client.send(new ListTablesCommand({ Limit: 1 }));
		console.log(`OK - offset: ${_offset}, attempts: ${r.$metadata.attempts}`);
	} catch (e) {
		console.log(
			`FAIL: ${e.name} - offset: ${_offset}, attempts: ${e.$metadata?.attempts}`,
		);
		console.log(`clockSkewCorrected: ${e.$metadata?.clockSkewCorrected}`);
	}
})();
