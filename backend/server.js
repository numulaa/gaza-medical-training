const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");

const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const uploadImage = require("./middleware/cloudinary");
const { WhatsApp } = require("twilio/lib/twiml/VoiceResponse");
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
const upload = multer({ dest: "uploads/" }); // Temporary file storage

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

const userSessions = {};

const STEPS = ["start", "description", "patient_age", "media", "confirmation"];

// Socket.IO
io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);
});

// Twilio WhatsApp Webhook
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  //   const senderPhone = req.body.From; // e.g., "whatsapp:+1234567890"
  const sourceEnd = from.indexOf(":");
  const source = from.substring(0, sourceEnd);
  const whatsapp = from.substring(sourceEnd + 1, from.length);
  if (!userSessions[from]) {
    const caseId =
      "CASE-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    const caseLink = `https://yourpwa.app/case/${caseId}`;
    userSessions[from] = {
      step: "start",
      case: {},
      caseId,
      caseLink,
    };
  }

  const session = userSessions[from];
  const twiml = new MessagingResponse();

  const numMedia = parseInt(req.body.NumMedia, 10) || 0;
  const media = [];
  const mediaUrls = [];
  for (let i = 0; i < numMedia; i++) {
    media.push({
      url: req.body[`MediaUrl${i}`],
      type: req.body[`MediaContentType${i}`],
    });
  }

  if (session.step === "start") {
    session.step = "description";
    twiml.message("Please enter the *description* of the case.");
  } else if (session.step === "description") {
    if (req.body.Body && req.body.Body.trim().length > 0) {
      session.case.description = req.body.Body.trim();
      session.step = "patient_age";
      twiml.message("What is the patient's *age*?");
    } else {
      twiml.message("Please enter the *description* of the case.");
    }
  } else if (session.step === "patient_age") {
    const age = parseInt(req.body.Body, 10);
    if (!isNaN(age) && age > 0 && age < 130) {
      session.case.patient_age = age;
      session.step = "media";
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
      for (let item of media) {
        const mediaUrl = await uploadImage(item);
        mediaUrls.push(mediaUrl);
      }

      twiml.message(
        'Media received! You can send more images or voice notes, or reply "done" to finish.'
      );
    } else if (req.body.Body && req.body.Body.trim().toLowerCase() === "done") {
      session.step = "confirmation";
      // Build summary
      const imageCount = Array.isArray(session.case.media)
        ? session.case.media.filter((m) => m.type.startsWith("image/")).length
        : 0;
      const audioCount = Array.isArray(session.case.media)
        ? session.case.media.filter((m) => m.type.startsWith("audio/")).length
        : 0;
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
      try {
        twiml.message(summary);

      twiml.message(summary);

      const caseData = {
        caseId: session.caseId,
        description: session.case.description,
        patientAge: session.case.patient_age,
        media: mediaUrls || [],
        link: session.caseLink,
        from,
        createdAt: new Date().toISOString(),
        source: source,
        whatsAppNo: whatsapp,
      };

      io.emit("new-case", caseData); // Notify frontend

      delete userSessions[from];
    } else {
      twiml.message('Please send media or reply "done" to finish.');
    }
  }

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// Test API to upload image

// const storage = multer.memoryStorage(); // stores file in memory
// const uploadMulter = multer({ storage });
// app.post("/upload", uploadMulter.single("image"), async (req, res) => {
//   try {
//     const base64Image = `data:image/jpeg;base64,${req.file.buffer.toString(
//       "base64"
//     )}`;

//     const result = await uploadImage(base64Image);

//     res.status(200).json({ message: "Upload successful!", url: result });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
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
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
