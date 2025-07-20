const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "doctors-connect-be573",
  storageBucket: "doctors-connect-be573.appspot.com" // Add this line
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Helper function to get file extension from MIME type
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov'
  };
  return extensions[mimeType] || 'bin';
}

// Helper function to process media files
async function processMediaFile(mediaUrl, mediaType, caseId, index) {
  try {
    console.log(`Processing media: ${mediaType} from ${mediaUrl}`);
    
    // Download the file from Twilio
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = getFileExtension(mediaType);
    const fileName = `cases/${caseId}/media-${timestamp}-${index}.${extension}`;
    
    // Upload to Firebase Storage
    const file = bucket.file(fileName);
    
    await file.save(response.data, {
      metadata: {
        contentType: mediaType,
        metadata: {
          originalUrl: mediaUrl,
          uploadedAt: new Date().toISOString(),
          caseId: caseId
        }
      }
    });
    
    console.log(`File uploaded to Firebase Storage: ${fileName}`);
    
    // Get signed URL (valid for 10 years)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000) // 10 years
    });
    
    return {
      url: signedUrl,
      type: mediaType,
      fileName: fileName,
      size: response.data.length,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing media file:', error);
    // Fallback to original URL if Firebase Storage fails
    return {
      url: mediaUrl,
      type: mediaType,
      error: error.message,
      fallback: true
    };
  }
}

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

    // 4. Collect media (images/voice notes) - UPDATED WITH FIREBASE STORAGE
    } else if (session.step === "media") {
      if (numMedia > 0) {
        session.case.media = session.case.media || [];
        
        // Process each media file
        for (let i = 0; i < numMedia; i++) {
          const mediaUrl = req.body[`MediaUrl${i}`];
          const mediaType = req.body[`MediaContentType${i}`];
          
          console.log(`Processing media ${i + 1}/${numMedia}: ${mediaType}`);
          
          // Process and upload to Firebase Storage
          const processedMedia = await processMediaFile(
            mediaUrl, 
            mediaType, 
            session.caseId, 
            session.case.media.length
          );
          
          session.case.media.push(processedMedia);
        }
        
        session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
        await userSessionRef.update(session);
        
        const mediaCount = session.case.media.length;
        twiml.message(
          `Media received! You now have ${mediaCount} file(s). You can send more images or voice notes, or reply "done" to finish.`
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

// API to get pending cases - MUST COME BEFORE /api/cases/:caseId
app.get("/api/cases/pending", async (req, res) => {
  try {
    console.log("Fetching pending cases...");
    
    const snapshot = await db.collection("cases")
      .where("status", "==", "pending")
      .get();

    console.log(`Found ${snapshot.size} pending cases`);

    const cases = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("Case data:", data);
      cases.push({
        id: doc.id,
        ...data
      });
    });

    console.log("Sending response with cases:", cases.length);
    res.json(cases);
  } catch (error) {
    console.error("Error fetching pending cases:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch pending cases",
      details: error.message 
    });
  }
});

// Simple test endpoint - MUST COME BEFORE /api/cases/:caseId
app.get("/api/cases/test", async (req, res) => {
  try {
    console.log("Testing basic Firestore connection...");
    
    // Get all cases first
    const snapshot = await db.collection("cases").get();
    console.log(`Total cases in database: ${snapshot.size}`);
    
    const allCases = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allCases.push({
        id: doc.id,
        status: data.status,
        description: data.description
      });
    });
    
    // Filter pending cases in JavaScript
    const pendingCases = allCases.filter(case_ => case_.status === "pending");
    console.log(`Pending cases found: ${pendingCases.length}`);
    
    res.json({
      total: allCases.length,
      pending: pendingCases.length,
      allCases: allCases,
      pendingCases: pendingCases
    });
  } catch (error) {
    console.error("Test failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// API to get specific case - MUST COME AFTER specific routes
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
