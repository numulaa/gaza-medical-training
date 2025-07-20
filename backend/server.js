const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "doctors-connect-be573",
  storageBucket: "doctors-connect-be573.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware for JSON parsing
app.use(express.json());

// Add health check endpoint back
app.get("/", (req, res) => {
  res.json({
    status: "WhatsApp Backend Server Running",
    timestamp: new Date().toISOString(),
  });
});

// Add webhook verification for Twilio (important for production)
app.get("/whatsapp", (req, res) => {
  res.status(200).send("WhatsApp webhook endpoint is ready");
});

// Add debugging endpoint to test TwiML generation
app.get("/test-twiml", (req, res) => {
  const testMessage = req.query.message || "Test message";
  const twiml = new MessagingResponse();
  twiml.message(testMessage);
  
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Add endpoint to check recent webhook calls
app.get("/debug/recent-calls", async (req, res) => {
  try {
    // This would help you see if webhooks are being called
    res.json({
      message: "Check server logs for recent webhook calls",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this simple test endpoint
app.post("/test-simple", async (req, res) => {
  console.log("=== SIMPLE TEST WEBHOOK ===");
  console.log("Request body:", req.body);
  
  const twiml = new MessagingResponse();
  twiml.message("This is a simple test response");
  
  console.log("Sending simple response:", twiml.toString());
  
  res.set('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
});

// Add this minimal test endpoint
app.post("/whatsapp-minimal", async (req, res) => {
  console.log("=== MINIMAL TEST WEBHOOK ===");
  console.log("From:", req.body.From);
  console.log("Body:", req.body.Body);
  console.log("To:", req.body.To);
  
  const twiml = new MessagingResponse();
  twiml.message("Hello! This is a test response from the minimal endpoint.");
  
  console.log("Sending minimal response:", twiml.toString());
  
  res.set('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
  
  console.log("✅ Minimal response sent");
});

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
      timeout: 30000
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
      expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)
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
    return {
      url: mediaUrl,
      type: mediaType,
      error: error.message,
      fallback: true
    };
  }
}

// Add timeout middleware
const WEBHOOK_TIMEOUT = 10000; // 10 seconds

// Add this function to validate Twilio requests
function validateTwilioRequest(req, authToken) {
  const signature = req.headers['x-twilio-signature'];
  const url = `https://${req.headers.host}${req.url}`;
  const params = req.body;
  
  // Sort the parameters alphabetically
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {});
  
  // Create the string to sign
  const stringToSign = url + Object.keys(sortedParams).map(key => 
    key + sortedParams[key]
  ).join('');
  
  // Create the signature
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(stringToSign, 'utf-8'))
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature || '', 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );
}

// Replace the current webhook handler with this improved version
app.post("/whatsapp", async (req, res) => {
  const startTime = Date.now();
  const from = req.body.From;
  const senderNumber = from.replace('whatsapp:', '');
  let responseMessage = '';

  // Log ALL incoming request data for debugging
  console.log(`=== INCOMING WEBHOOK ===`);
  console.log(`WhatsApp message from: ${senderNumber}`);
  console.log(`Message body: ${req.body.Body}`);
  console.log(`Media count: ${req.body.NumMedia}`);
  console.log(`To: ${req.body.To}`);
  console.log(`Is sandbox: ${req.body.To && req.body.To.includes('+14155238886')}`);

  try {
    // Check if this is a sandbox message
    const isSandbox = req.body.To && req.body.To.includes('+14155238886');
    console.log(`Is sandbox message: ${isSandbox}`);

    // Set timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Webhook timeout')), WEBHOOK_TIMEOUT);
    });

    const processMessage = async () => {
      // Handle start/restart commands at any time
      const messageBody = req.body.Body ? req.body.Body.trim().toLowerCase() : "";
      
      if (messageBody === "start" || messageBody === "restart") {
        console.log(`Handling ${messageBody} command for ${senderNumber}`);
        
        // Remove existing session if exists
        try {
          await db.collection("whatsapp_sessions").doc(senderNumber).delete();
        } catch (deleteError) {
          console.log(`No existing session to delete for ${senderNumber}`);
        }
        
        const caseId = "CASE-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
        const caseLink = `https://yourpwa.app/case/${caseId}`;
        const session = {
          step: "description",
          case: {},
          caseId,
          caseLink,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        await db.collection("whatsapp_sessions").doc(senderNumber).set(session);
        console.log(`Created new session for ${senderNumber} with case ID: ${caseId}`);
        
        return messageBody === "start" 
          ? "Welcome! Please enter the description of the case."
          : "Restarted! Please enter the description of the case.";
      }

      // Get or create user session from Firestore
      const userSessionRef = db.collection("whatsapp_sessions").doc(senderNumber);
      const userSessionDoc = await userSessionRef.get();
      
      let session;
      
      // New session
      if (!userSessionDoc.exists) {
        console.log(`Creating new session for ${senderNumber}`);
        const caseId = "CASE-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
        const caseLink = `https://yourpwa.app/case/${caseId}`;
        session = {
          step: "description",
          case: {},
          caseId,
          caseLink,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        };
        await userSessionRef.set(session);
        console.log(`New session created for ${senderNumber} with case ID: ${caseId}`);
        return "Welcome! Please enter the description of the case.";
      } else {
        session = userSessionDoc.data();
        session.case = session.case || {};
        console.log(`Retrieved existing session for ${senderNumber}, step: ${session.step}`);
      }

      // Always define numMedia and media array
      const numMedia = parseInt(req.body.NumMedia, 10) || 0;
      const media = [];
      for (let i = 0; i < numMedia; i++) {
        media.push({
          url: req.body[`MediaUrl${i}`],
          type: req.body[`MediaContentType${i}`],
        });
      }

      console.log(`Current step: ${session.step}`);
      
      // Step handling logic with proper flow control
      switch (session.step) {
        case "description":
          return await handleDescriptionStep(req.body.Body, session, userSessionRef, senderNumber);
        
        case "patient_age":
          return await handlePatientAgeStep(req.body.Body, session, userSessionRef, senderNumber);
        
        case "media":
          return await handleMediaStep(req.body.Body, numMedia, media, session, userSessionRef, senderNumber);
        
        default:
          console.log(`Unknown step: ${session.step} for ${senderNumber}`);
          return `I'm not sure what step we're on. Type "restart" to start over.`;
      }
    };

    // Race between message processing and timeout
    responseMessage = await Promise.race([processMessage(), timeoutPromise]);

  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    responseMessage = "Sorry, there was a technical error. Please try again later or type 'restart' to start over.";
  }

  // Always ensure we send a response
  try {
    if (!responseMessage) {
      responseMessage = "I didn't understand that. Please try again or type 'restart' to start over.";
    }

    // Create fresh TwiML response
    const twiml = new MessagingResponse();
    twiml.message(responseMessage);
    const twimlString = twiml.toString();
    
    // Enhanced validation
    if (!twimlString || !twimlString.includes('<Message>') || twimlString.includes('undefined')) {
      console.error("Invalid TwiML generated:", twimlString);
      const fallbackTwiml = new MessagingResponse();
      fallbackTwiml.message("Sorry, there was an issue. Please type 'restart' to start over.");
      const finalTwiml = fallbackTwiml.toString();
      
      console.log(`=== OUTGOING RESPONSE (FALLBACK) ===`);
      console.log(`TwiML response: ${finalTwiml}`);
      console.log(`Response time: ${Date.now() - startTime}ms`);
      
      res.set('Content-Type', 'text/xml');
      res.status(200).send(finalTwiml);
      return;
    }

    // Enhanced logging
    console.log(`=== OUTGOING RESPONSE ===`);
    console.log(`Response message: "${responseMessage}"`);
    console.log(`TwiML response: ${twimlString}`);
    console.log(`Response time: ${Date.now() - startTime}ms`);
    console.log(`Response status: 200`);
    console.log(`Content-Type: text/xml`);
    console.log(`=========================`);
    
    // Set proper headers
    res.set({
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache',
      'Connection': 'close'
    });
    
    // Send response
    res.status(200).send(twimlString);
    
    // Log after sending
    console.log(`✅ Response sent successfully to ${senderNumber}`);
    
  } catch (responseError) {
    console.error("❌ Error sending response:", responseError);
    console.error("Response error details:", responseError.message);
    console.error("Response error stack:", responseError.stack);
    
    // Last resort fallback - ensure we always respond
    try {
      res.set('Content-Type', 'text/xml');
      res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>System error. Please type 'restart' to begin again.</Message></Response>`);
      console.log(`📤 Fallback response sent to ${senderNumber}`);
    } catch (finalError) {
      console.error("💥 Final fallback failed:", finalError);
      // Even if this fails, at least we tried
      res.status(500).end();
    }
  }
});

// Separate handler functions for better maintainability
async function handleDescriptionStep(messageBody, session, userSessionRef, senderNumber) {
  console.log(`Processing description step for ${senderNumber}`);
  
  if (messageBody && messageBody.trim().length > 0) {
    const description = messageBody.trim();
    console.log(`Received description: "${description}"`);
    
    session.case.description = description;
    session.step = "patient_age";
    session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    const cleanSession = Object.fromEntries(
      Object.entries(session).filter(([_, value]) => value !== undefined)
    );
    await userSessionRef.update(cleanSession);
    console.log(`Updated session for ${senderNumber}, moved to patient_age step`);
    return "What is the patient's age?";
  } else {
    console.log(`Empty description received from ${senderNumber}, asking for description`);
    return 'Please enter the description of the case.';
  }
}

async function handlePatientAgeStep(messageBody, session, userSessionRef, senderNumber) {
  console.log(`Processing patient_age step for ${senderNumber}`);
  const ageInput = messageBody ? messageBody.trim() : "";
  const age = parseInt(ageInput, 10);
  console.log(`Received age input: "${ageInput}" -> parsed as: ${age}`);
  
  if (!isNaN(age) && age > 0 && age < 130) {
    session.case.patient_age = age;
    session.step = "media";
    session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    const cleanSession = Object.fromEntries(
      Object.entries(session).filter(([_, value]) => value !== undefined)
    );
    await userSessionRef.update(cleanSession);
    console.log(`Updated session for ${senderNumber}, moved to media step with age: ${age}`);
    return 'You can now send any images or voice notes (audio recordings). Send them now, and reply "done" when finished.';
  } else {
    console.log(`Invalid age received from ${senderNumber}: "${ageInput}"`);
    return "Please enter a valid age (number between 1 and 129).";
  }
}

async function handleMediaStep(messageBody, numMedia, media, session, userSessionRef, senderNumber) {
  console.log("Processing media step...");
  console.log("Message body:", messageBody);
  console.log("Media count:", numMedia);
  
  if (!session.case.media) {
    session.case.media = [];
  }

  if (numMedia > 0) {
    let processed = 0;
    const processingPromises = [];
    
    for (let i = 0; i < numMedia; i++) {
      const promise = processMediaFile(
        media[i].url,
        media[i].type,
        session.caseId,
        session.case.media.length + i
      ).then(processedMedia => {
        session.case.media.push(processedMedia);
        processed++;
      }).catch(err => {
        console.warn("Failed to process media: " + err.message);
      });
      processingPromises.push(promise);
    }
    
    // Wait for all media processing with timeout
    try {
      await Promise.all(processingPromises);
    } catch (error) {
      console.warn("Some media files failed to process:", error.message);
    }
    
    session.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    const cleanSession = Object.fromEntries(
      Object.entries(session).filter(([_, value]) => value !== undefined)
    );
    await userSessionRef.update(cleanSession);
    
    return `Media received! You now have ${session.case.media.length} file(s). You can send more images or voice notes, or reply "done" to finish.`;
    
  } else if (messageBody && messageBody.trim().toLowerCase() === "done") {
    return await finalizeCaseSubmission(session, userSessionRef);
  } else {
    console.log("No media and not 'done' - sending reminder message");
    return 'I received your message. Please send images/voice notes, or reply "done" to finish the case submission.';
  }
}

async function finalizeCaseSubmission(session, userSessionRef) {
  const imageCount = Array.isArray(session.case.media)
    ? session.case.media.filter((m) => m.type.startsWith("image/")).length
    : 0;
  const audioCount = Array.isArray(session.case.media)
    ? session.case.media.filter((m) => m.type.startsWith("audio/")).length
    : 0;

  const summary = `*Your Case Has Been Submitted!*

Case ID: ${session.caseId}

Description: ${session.case.description || "-"}
Patient Age: ${session.case.patient_age || "-"}
Images: ${imageCount}
Voice notes: ${audioCount}

You can track or add more info here:
${session.caseLink}

Reply 'restart' to create another case.`;

  // Save completed consultation to Firestore
  const consultationData = {
    title: session.case.description || "Medical Consultation",
    description: session.case.description || "",
    specialty: "General Medicine",
    priority: "standard",
    status: "pending",
    code: session.caseId,
    doctorId: session.doctorId || "unknown",
    createdAt: session.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    responses: [],
    source: "whatsapp"
  };

  console.log("Session data before saving:", session);
  console.log("Consultation data before cleaning:", consultationData);

  const cleanConsultationData = Object.fromEntries(
    Object.entries(consultationData).filter(([_, value]) => value !== undefined)
  );

  console.log("Clean consultation data:", cleanConsultationData);

  try {
    await db.collection("consultations").doc(session.caseId).set(cleanConsultationData);
    // Remove session so they can start a new case on next message
    await userSessionRef.delete();
  } catch (error) {
    console.error("Error saving consultation or deleting session:", error);
    throw error;
  }

  return summary;
}

// API to get all consultations
app.get("/api/consultations", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let query = db.collection("consultations").orderBy("createdAt", "desc");
    
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const consultations = [];
    
    snapshot.forEach(doc => {
      consultations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const totalSnapshot = await db.collection("consultations").get();
    const total = totalSnapshot.size;

    res.json({
      consultations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// API to get pending consultations
app.get("/api/consultations/pending", async (req, res) => {
  try {
    console.log("Fetching pending consultations...");
    
    const snapshot = await db.collection("consultations")
      .where("status", "==", "pending")
      .get();

    console.log(`Found ${snapshot.size} pending consultations`);

    const consultations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("Consultation data:", data);
      consultations.push({
        id: doc.id,
        ...data
      });
    });

    console.log("Sending response with consultations:", consultations.length);
    res.json(consultations);
  } catch (error) {
    console.error("Error fetching pending consultations:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch pending consultations",
      details: error.message 
    });
  }
});

// API to get specific consultation
app.get("/api/consultations/:consultationId", async (req, res) => {
  try {
    const { consultationId } = req.params;
    const consultationDoc = await db.collection("consultations").doc(consultationId).get();

    if (consultationDoc.exists) {
      res.json({
        id: consultationDoc.id,
        ...consultationDoc.data()
      });
    } else {
      res.status(404).json({ error: "Consultation not found" });
    }
  } catch (error) {
    console.error("Error fetching consultation:", error);
    res.status(500).json({ error: "Failed to fetch consultation" });
  }
});

// 1. Fetch consultations I received (for specialists)
app.get("/api/consultations/received/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    console.log(`Fetching consultations received by user: ${userId}`);

    let query = db.collection("consultations").orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit)).get();
    
    const consultations = [];
    for (const doc of snapshot.docs) {
      const consultationData = doc.data();
      
      if (consultationData.doctorId === userId) {
        continue;
      }
      
      const responses = consultationData.responses || [];
      const hasUserResponse = responses.some((response) => response.userId === userId);
      
      if (hasUserResponse) {
        consultations.push({
          id: doc.id,
          ...consultationData
        });
      }
    }

    console.log(`Found ${consultations.length} consultations received by user ${userId}`);

    res.json({
      success: true,
      consultations,
      total: consultations.length,
      page: parseInt(page),
      message: "Consultations received fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching received consultations:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch received consultations",
      details: error.message 
    });
  }
});

// 2. Fetch consultations I asked (for consulting doctors)
app.get("/api/consultations/asked/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    console.log(`Fetching consultations asked by user: ${userId}`);

    let query = db.collection("consultations")
      .where("doctorId", "==", userId)
      .orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit)).get();
    
    const consultations = [];
    snapshot.forEach(doc => {
      consultations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Found ${consultations.length} consultations asked by user ${userId}`);

    res.json({
      success: true,
      consultations,
      total: consultations.length,
      page: parseInt(page),
      message: "Consultations asked fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching asked consultations:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch asked consultations",
      details: error.message 
    });
  }
});

// API to get all users
app.get("/api/users", async (req, res) => {
  try {
    console.log("Fetching all users...");
    
    const snapshot = await db.collection("users").get();
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isApproved: userData.isApproved,
        specialty: userData.specialty,
        availabilityStatus: userData.availabilityStatus,
        whatsappNo: userData.whatsappNo || null
      });
    });

    console.log(`Found ${users.length} users`);

    res.json({
      success: true,
      users,
      total: users.length,
      message: "Users fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users",
      details: error.message 
    });
  }
});

// API to sync user with Firestore (create if doesn't exist)
app.post("/api/users/sync", async (req, res) => {
  try {
    const { id, email, name, role, specialty, isApproved, availabilityStatus } = req.body;

    if (!id || !email || !name) {
      return res.status(400).json({ error: "Missing required user fields" });
    }

    console.log(`Syncing user: ${id} (${email})`);

    const userDoc = await db.collection("users").doc(id).get();
    
    if (!userDoc.exists) {
      await db.collection("users").doc(id).set({
        id,
        email,
        name,
        role: role || "consulting_doctor",
        specialty: specialty || "General Medicine",
        isApproved: isApproved !== undefined ? isApproved : true,
        availabilityStatus: availabilityStatus || "available",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Created new user: ${id}`);
    } else {
      await db.collection("users").doc(id).update({
        email,
        name,
        role: role || "consulting_doctor",
        specialty: specialty || "General Medicine",
        isApproved: isApproved !== undefined ? isApproved : true,
        availabilityStatus: availabilityStatus || "available",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Updated existing user: ${id}`);
    }

    res.json({
      success: true,
      message: "User synced successfully",
      userId: id
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to sync user",
      details: error.message 
    });
  }
});

// API to link WhatsApp number to user
app.post("/api/users/:userId/link-whatsapp", async (req, res) => {
  try {
    const { userId } = req.params;
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({ error: "WhatsApp number is required" });
    }

    console.log(`Linking WhatsApp number ${whatsappNumber} to user ${userId}`);

    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: `User with ID ${userId} does not exist. Please sync your user first.`
      });
    }

    await db.collection("users").doc(userId).update({
      whatsappNo: whatsappNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: "WhatsApp number linked successfully",
      userId,
      whatsappNumber
    });
  } catch (error) {
    console.error("Error linking WhatsApp number:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to link WhatsApp number",
      details: error.message 
    });
  }
});

// API to check WhatsApp bot status and sessions
app.get("/api/whatsapp-bot/status", async (req, res) => {
  try {
    console.log("Checking WhatsApp bot status...");
    
    const sessionsSnapshot = await db.collection("whatsapp_sessions").get();
    const sessions = [];
    
    sessionsSnapshot.forEach(doc => {
      const sessionData = doc.data();
      sessions.push({
        whatsappNumber: doc.id,
        step: sessionData.step,
        caseId: sessionData.caseId,
        caseLink: sessionData.caseLink,
        createdAt: sessionData.createdAt,
        lastUpdated: sessionData.lastUpdated,
        caseDescription: sessionData.case?.description || "Not provided",
        patientAge: sessionData.case?.patient_age || "Not provided",
        mediaCount: sessionData.case?.media?.length || 0
      });
    });

    const consultationsSnapshot = await db.collection("consultations")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    
    const recentConsultations = [];
    consultationsSnapshot.forEach(doc => {
      const consultationData = doc.data();
      recentConsultations.push({
        id: doc.id,
        title: consultationData.title,
        description: consultationData.description,
        status: consultationData.status,
        code: consultationData.code,
        doctorId: consultationData.doctorId,
        createdAt: consultationData.createdAt,
        responsesCount: consultationData.responses?.length || 0
      });
    });

    console.log(`Found ${sessions.length} active sessions and ${recentConsultations.length} recent consultations`);

    res.json({
      success: true,
      botStatus: "running",
      activeSessions: sessions.length,
      recentConsultations: recentConsultations.length,
      sessions,
      recentConsultations,
      message: "WhatsApp bot status checked successfully"
    });
  } catch (error) {
    console.error("Error checking WhatsApp bot status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to check bot status",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
}); 