/**
 * Test 4: Sustained Stale Date Headers
 *
 * Poisons multiple consecutive responses to see if the SDK
 * enters a failure loop where it can't self-correct.
 */
const {
	DynamoDBClient,
	ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const pkgJson = require("@aws-sdk/client-dynamodb/package.json");

const client = new DynamoDBClient({ region: "us-west-2" });

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

// Poison the first N responses
let poisonCount = 1;
client.middlewareStack.add(
	(next) => async (args) => {
		const result = await next(args);
		if (poisonCount > 0 && result.response?.headers?.date) {
			const staleDate = new Date(Date.now() - 6 * 60 * 1000).toUTCString();
			console.log(
				`  [stale header injected] ${result.response.headers.date} -> ${staleDate}`,
			);
			result.response.headers.date = staleDate;
			poisonCount--;
		}
		return result;
	},
	{ step: "deserialize", name: "staleDateHeaderPlugin", priority: "low" },
);

(async () => {
	console.log(pkgJson.name, "@", pkgJson.version);
	console.log(
		`Poisoning first ${poisonCount} response(s), then running 5 more\n`,
	);

	for (let i = 1; i <= 6; i++) {
		console.log(`--- Call ${i} ---`);
		try {
			const r = await client.send(new ListTablesCommand({ Limit: 1 }));
			console.log(`OK - offset: ${_offset}, attempts: ${r.$metadata.attempts}`);
		} catch (e) {
			console.log(
				`FAIL: ${e.name} - offset: ${_offset}, attempts: ${e.$metadata?.attempts}, clockSkewCorrected: ${e.$metadata?.clockSkewCorrected}`,
			);
		}
		console.log();
	}
})();
