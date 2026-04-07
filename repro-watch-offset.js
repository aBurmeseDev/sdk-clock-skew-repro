/**
 * Test 2: Success Handler Offset Watch
 *
 * Monitors systemClockOffset changes during normal operation.
 * Instruments the property with a setter to detect if the
 * successHandler ever changes it from 0.
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
			console.log(
				`  [offset changed] ${_offset} -> ${value} (delta: ${value - _offset})`,
			);
		}
		_offset = value;
	},
});

(async () => {
	console.log(pkgJson.name, "@", pkgJson.version);
	console.log("Running 20 ListTables calls, watching offset...\n");

	for (let i = 0; i < 20; i++) {
		const start = Date.now();
		try {
			const r = await client.send(new ListTablesCommand({ Limit: 1 }));
			const elapsed = Date.now() - start;
			console.log(
				`#${i + 1} OK - offset: ${_offset}, elapsed: ${elapsed}ms, attempts: ${r.$metadata.attempts}`,
			);
		} catch (e) {
			console.log(
				`#${i + 1} FAIL: ${e.name} - offset: ${_offset}, attempts: ${e.$metadata?.attempts}`,
			);
		}
	}
})();
