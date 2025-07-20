const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const admin = require("firebase-admin");

const cors = require("cors");
// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	projectId: "doctors-connect-be573",
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/", (req, res) => {
	res.json({
		status: "WhatsApp Backend Server Running",
		timestamp: new Date().toISOString(),
	});
});

const STEPS = ["start", "description", "patient_age", "media", "confirmation"];

app.post("/whatsapp", async (req, res) => {
	const from = req.body.From;

	try {
		// Get or create user session from Firestore
		const userSessionRef = db.collection("whatsapp_sessions").doc(from);
		const userSessionDoc = await userSessionRef.get();

		let session;
		if (!userSessionDoc.exists) {
			// Generate caseId and link at start for this session
			const caseId =
				"CASE-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
			const caseLink = `https://yourpwa.app/case/${caseId}`;

			session = {
				step: "start",
				case: {},
				caseId,
				caseLink,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
			};

			await userSessionRef.set(session);
		} else {
			session = userSessionDoc.data();
		}

		const twiml = new MessagingResponse();

		// Always define numMedia and media array at the top
		const numMedia = parseInt(req.body.NumMedia, 10) || 0;
		const media = [];
		for (let i = 0; i < numMedia; i++) {
			media.push({
				url: req.body[`MediaUrl${i}`],
				type: req.body[`MediaContentType${i}`],
			});
		}

		// 1. Prompt for description after any first message
		if (session.step === "start") {
			session.step = "description";
			session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
			await userSessionRef.update(session);
			twiml.message("Please enter the *description* of the case.");

			// 2. Collect description
		} else if (session.step === "description") {
			if (req.body.Body && req.body.Body.trim().length > 0) {
				session.case.description = req.body.Body.trim();
				session.step = "patient_age";
				session.lastUpdated =
					admin.firestore.FieldValue.serverTimestamp();
				await userSessionRef.update(session);
				twiml.message("What is the patient's *age*?");
			} else {
				twiml.message("Please enter the *description* of the case.");
			}

			// 3. Collect patient age
		} else if (session.step === "patient_age") {
			const age = parseInt(req.body.Body, 10);
			if (!isNaN(age) && age > 0 && age < 130) {
				session.case.patient_age = age;
				session.step = "media";
				session.lastUpdated =
					admin.firestore.FieldValue.serverTimestamp();
				await userSessionRef.update(session);
				twiml.message(
					'You can now send any *images* or *voice notes* (audio recordings). Send them now, and reply "done" when finished.'
				);
			} else {
				twiml.message("Please enter a valid *age* (number).");
			}

			// 4. Collect media (images/voice notes)
		} else if (session.step === "media") {
			if (numMedia > 0) {
				session.case.media = session.case.media || [];
				session.case.media = session.case.media.concat(media);
				session.lastUpdated =
					admin.firestore.FieldValue.serverTimestamp();
				await userSessionRef.update(session);
				twiml.message(
					'Media received! You can send more images or voice notes, or reply "done" to finish.'
				);
			} else if (
				req.body.Body &&
				req.body.Body.trim().toLowerCase() === "done"
			) {
				session.step = "confirmation";
				session.lastUpdated =
					admin.firestore.FieldValue.serverTimestamp();

				// Build summary
				const imageCount = Array.isArray(session.case.media)
					? session.case.media.filter((m) =>
							m.type.startsWith("image/")
					  ).length
					: 0;
				const audioCount = Array.isArray(session.case.media)
					? session.case.media.filter((m) =>
							m.type.startsWith("audio/")
					  ).length
					: 0;

				const summary = `*Your Case Has Been Submitted!*

*Case ID:* ${session.caseId}

*Description:* ${session.case.description || "-"}
*Patient Age:* ${session.case.patient_age}
*Images:* ${imageCount}
*Voice notes:* ${audioCount}

You can track or add more info here:
${session.caseLink}

Reply 'restart' to create another case.`;

				// Save completed case to Firestore
				const caseData = {
					caseId: session.caseId,
					caseLink: session.caseLink,
					description: session.case.description,
					patientAge: session.case.patient_age,
					media: session.case.media || [],
					imageCount,
					audioCount,
					whatsappNumber: from,
					status: "pending",
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					completedAt: admin.firestore.FieldValue.serverTimestamp(),
				};

				await db
					.collection("consultations")
					.doc(session.caseId)
					.set(caseData);

				twiml.message(summary);

				// Delete session to allow new case
				await userSessionRef.delete();
			} else {
				twiml.message(
					'Please send images/voice notes, or reply "done" to finish.'
				);
			}
		}

		res.set("Content-Type", "text/xml");
		res.send(twiml.toString());
	} catch (error) {
		console.error("Error processing WhatsApp message:", error);
		res.status(500).send("Internal server error");
	}
});

// API to get all cases
app.get("/api/cases", async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const status = req.query.status;

		let query = db.collection("consultations").orderBy("createdAt", "desc");

		if (status) {
			query = query.where("status", "==", status);
		}

		const snapshot = await query
			.limit(limit)
			.offset((page - 1) * limit)
			.get();
		const cases = [];

		snapshot.forEach((doc) => {
			cases.push({
				id: doc.id,
				...doc.data(),
			});
		});

		const totalSnapshot = await db.collection("consultations").get();
		const total = totalSnapshot.size;

		res.json({
			cases,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error("Error fetching cases:", error);
		res.status(500).json({ error: "Failed to fetch cases" });
	}
});

// API to get specific case
app.get("/api/cases/:caseId", async (req, res) => {
	try {
		const { caseId } = req.params;
		const caseDoc = await db.collection("consultations").doc(caseId).get();

		if (caseDoc.exists) {
			res.json({
				id: caseDoc.id,
				...caseDoc.data(),
			});
		} else {
			res.status(404).json({ error: "Case not found" });
		}
	} catch (error) {
		console.error("Error fetching case:", error);
		res.status(500).json({ error: "Failed to fetch case" });
	}
});

// API to update case status
app.patch("/api/cases/:caseId/status", async (req, res) => {
	try {
		const { caseId } = req.params;
		const { status, assignedDoctor, notes } = req.body;

		const updateData = {
			status,
			lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
		};

		if (assignedDoctor) updateData.assignedDoctor = assignedDoctor;
		if (notes) updateData.notes = notes;

		await db.collection("consultations").doc(caseId).update(updateData);

		res.json({ success: true, message: "Case status updated" });
	} catch (error) {
		console.error("Error updating case:", error);
		res.status(500).json({ error: "Failed to update case" });
	}
});

// API to get pending cases
app.get("/api/cases/pending", async (req, res) => {
	try {
		const snapshot = await db
			.collection("consultations")
			.where("status", "==", "pending")
			.orderBy("createdAt", "asc")
			.get();

		const cases = [];
		snapshot.forEach((doc) => {
			cases.push({
				id: doc.id,
				...doc.data(),
			});
		});

		res.json(cases);
	} catch (error) {
		console.error("Error fetching pending cases:", error);
		res.status(500).json({ error: "Failed to fetch pending cases" });
	}
});

// API to create a new consultation
app.post("/api/consultations", async (req, res) => {
	try {
		const { title, description, specialty, priority, doctorId } = req.body;
		if (!title || !description || !specialty || !priority || !doctorId) {
			return res.status(400).json({ error: "Missing required fields" });
		}
		console.log(req.body);
		console.log(title, description, specialty, priority, doctorId);
		// Helper to generate code in ABC-DEF-GHI format
		// to think of replacing with uuid or other
		function generateCode() {
			const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			let code = "";
			for (let i = 0; i < 9; i++) {
				code += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return code.match(/.{1,3}/g).join("-");
		}

		// Ensure code is unique
		let code, codeExists;
		do {
			code = generateCode();
			const snapshot = await db
				.collection("consultations")
				.where("code", "==", code)
				.get();
			codeExists = !snapshot.empty;
		} while (codeExists);

		const consultationData = {
			title,
			description,
			specialty,
			priority,
			code,
			doctorId: doctorId || null,
			status: "pending",
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			responses: [],
		};

		const docRef = await db
			.collection("consultations")
			.add(consultationData);
		const savedDoc = await docRef.get();
		res.status(201).json({ id: docRef.id, ...savedDoc.data() });
	} catch (error) {
		console.error("Error creating consultation:", error);
		res.status(500).json({ error: "Failed to create consultation" });
	}
});

// API to get consultations, filter by doctorId or whatsappNumber if provided
app.get("/api/consultations", async (req, res) => {
	try {
		const { doctorId, whatsappNumber, page = 1, limit = 20 } = req.query;
		let query = db.collection("consultations").orderBy("createdAt", "desc");

		if (doctorId) {
			query = query.where("doctorId", "==", doctorId);
		} else if (whatsappNumber) {
			query = query.where("whatsappNumber", "==", whatsappNumber);
		}

		const snapshot = await query
			.limit(Number(limit))
			.offset((Number(page) - 1) * Number(limit))
			.get();
		const consultations = [];
		snapshot.forEach((doc) => {
			consultations.push({ id: doc.id, ...doc.data() });
		});

		res.json({ consultations });
	} catch (error) {
		console.error("Error fetching consultations:", error);
		res.status(500).json({ error: "Failed to fetch consultations" });
	}
});

// API to post a reply to a consultation
app.post("/api/consultations/:consultationId/replies", async (req, res) => {
	try {
		const { consultationId } = req.params;
		const { userId, userName, content, source } = req.body;
		if (!userId || !userName || !content) {
			return res.status(400).json({ error: "Missing required fields" });
		}
		const reply = {
			id: "reply-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
			userId,
			userName,
			content,
			source: source || "web",
			createdAt: new Date(),
			isOffline: false,
		};
		const docRef = db.collection("consultations").doc(consultationId);
		await docRef.update({
			responses: admin.firestore.FieldValue.arrayUnion(reply),
			updatedAt: new Date(),
		});
		res.status(201).json({ reply });
	} catch (error) {
		console.error("Error posting reply:", error);
		res.status(500).json({ error: "Failed to post reply" });
	}
});

// API to update consultation status (with permission check)
app.patch("/api/consultations/:consultationId/status", async (req, res) => {
	try {
		const { consultationId } = req.params;
		const { status, doctorId, whatsappNumber } = req.body;
		if (!status) {
			return res.status(400).json({ error: "Missing status" });
		}
		const docRef = db.collection("consultations").doc(consultationId);
		const doc = await docRef.get();
		if (!doc.exists) {
			return res.status(404).json({ error: "Consultation not found" });
		}
		const data = doc.data();
		// Permission check
		let allowed = false;
		if (doctorId && data.doctorId && doctorId === data.doctorId) {
			allowed = true;
		} else if (
			data.source === "whatsapp" &&
			whatsappNumber &&
			data.whatsappNumber &&
			whatsappNumber === data.whatsappNumber
		) {
			allowed = true;
		}
		if (!allowed) {
			return res
				.status(403)
				.json({ error: "Not allowed to mark as resolved" });
		}
		await docRef.update({
			status,
			updatedAt: new Date(),
		});
		res.json({ success: true, message: "Consultation status updated" });
	} catch (error) {
		console.error("Error updating consultation status:", error);
		res.status(500).json({ error: "Failed to update consultation status" });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server running on port", PORT);
});
