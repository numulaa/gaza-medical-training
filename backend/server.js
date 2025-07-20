const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "doctors-connect-be573"
});

const db = admin.firestore();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

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
      const caseId = "CASE-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
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
        session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
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
        session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
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
        session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
        await userSessionRef.update(session);
        twiml.message(
          'Media received! You can send more images or voice notes, or reply "done" to finish.'
        );
      } else if (req.body.Body && req.body.Body.trim().toLowerCase() === "done") {
        session.step = "confirmation";
        session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
        
        // Build summary
        const imageCount = Array.isArray(session.case.media)
          ? session.case.media.filter((m) => m.type.startsWith("image/")).length
          : 0;
        const audioCount = Array.isArray(session.case.media)
          ? session.case.media.filter((m) => m.type.startsWith("audio/")).length
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

        await db.collection("cases").doc(session.caseId).set(caseData);

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

    let query = db.collection("cases").orderBy("createdAt", "desc");
    
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const cases = [];
    
    snapshot.forEach(doc => {
      cases.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const totalSnapshot = await db.collection("cases").get();
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
    const caseDoc = await db.collection("cases").doc(caseId).get();

    if (caseDoc.exists) {
      res.json({
        id: caseDoc.id,
        ...caseDoc.data()
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

    await db.collection("cases").doc(caseId).update(updateData);

    res.json({ success: true, message: "Case status updated" });
  } catch (error) {
    console.error("Error updating case:", error);
    res.status(500).json({ error: "Failed to update case" });
  }
});

// API to get pending cases
app.get("/api/cases/pending", async (req, res) => {
  try {
    const snapshot = await db.collection("cases")
      .where("status", "==", "pending")
      .orderBy("createdAt", "asc")
      .get();

    const cases = [];
    snapshot.forEach(doc => {
      cases.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(cases);
  } catch (error) {
    console.error("Error fetching pending cases:", error);
    res.status(500).json({ error: "Failed to fetch pending cases" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
