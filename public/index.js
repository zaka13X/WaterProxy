"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

// Quiet logger function for console observation
function logDebug(msg) {
	console.log(`[Proxy Log] ${msg}`);
}

// HARD STOP FOR FORM RELOADS: Prevents the browser from accidentally hard-refreshing on enter
if (form) {
	form.onsubmit = function(e) {
		e.preventDefault();
		return false;
	};
}

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

scramjet.init();

// Initialize BareMux network controller with explicit multi-threaded worker pipeline
let connection;
try {
	connection = new BareMux.BareMuxConnection("/baremux/worker.js", "service-worker");
} catch (e) {
	connection = new BareMux.BareMuxConnection("/baremux/worker.js");
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	// 1. Register local service worker cache layer
	try {
		await registerSW();
	} catch (err) {
		console.warn("Service worker registration skipped:", err);
	}

	// 2. Format search engine rules or raw strings into absolute destination paths
	let url = address.value.trim();
	try {
		if (typeof search === "function") {
			url = search(address.value, searchEngine.value);
		} else {
			if (!url.startsWith("http://") && !url.startsWith("https://")) {
				if (url.includes(".") && !url.includes(" ")) {
					url = "https://" + url;
				} else {
					url = "https://google.com" + encodeURIComponent(url);
				}
			}
		}
	} catch (searchError) {
		console.error("Input resolution crash, falling back to string parsing:", searchError);
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			url = "https://" + url;
		}
	}

	// 3. Connect proxy transport architecture to your unblocked static Wisp connection
	let wispUrl = "wss://wisp.mercurywork.shop/";
	try {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	} catch (transportError) {
		console.error("Network transport layer connection failed:", transportError);
	}

	// 4. Mount and execute your secure sandbox viewing frame
	try {
		const oldFrame = document.getElementById("sj-frame");
		if (oldFrame) oldFrame.remove();

		const frame = scramjet.createFrame();
		frame.frame.id = "sj-frame";
		frame.frame.style = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;";
		
		document.body.appendChild(frame.frame);
		frame.go(url);
		logDebug("Successfully launched target viewport.");
	} catch (frameError) {
		if (error && errorCode) {
			error.textContent = "Failed to launch proxy frame.";
			errorCode.textContent = frameError.toString();
		}
		console.error("Viewport layer failed to construct frame:", frameError);
	}
});

logDebug("Production script initialized successfully.");
