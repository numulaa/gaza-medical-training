const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
let messages = [];

// In-memory session store -- use persistent DB for production
const userSessions = {};

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "WhatsApp Backend Server Running",
    timestamp: new Date().toISOString(),
    totalMessages: messages.length,
  });
});

const STEPS = ["start", "description", "patient_age", "media", "confirmation"];

app.post("/whatsapp", (req, res) => {
  const from = req.body.From;

  // Initialize or resume user session
  if (!userSessions[from]) {
    // Generate caseId and link at start for this session
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
    twiml.message("Please enter the *description* of the case.");

    // 2. Collect description
  } else if (session.step === "description") {
    if (req.body.Body && req.body.Body.trim().length > 0) {
      session.case.description = req.body.Body.trim();
      session.step = "patient_age";
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

      const summary = `*Your Case Has Been Submitted!*

*Case ID:* ${session.caseId}

*Description:* ${session.case.description || "-"}
*Patient Age:* ${session.case.patient_age}
*Images:* ${imageCount}
*Voice notes:* ${audioCount}

You can track or add more info here:
${session.caseLink}

Reply 'restart' to create another case.`;

      twiml.message(summary);
      // Session is done, delete to allow new case
      delete userSessions[from];
    } else {
      twiml.message(
        'Please send images/voice notes, or reply "done" to finish.'
      );
    }

    // 5. Confirmation step isn't needed, send summary directly after 'done'
    // Optionally, you could implement manual confirmation here
  }

  const message = {
    id: session.id,
  };

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// API to get unprocessed messages
app.get("/api/messages/unprocessed", (req, res) => {
  const unprocessedMessages = messages.filter((msg) => !msg.processed);
  res.json(unprocessedMessages);
});

// API to get all messages
app.get("/api/messages", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedMessages = messages.slice(start, end);

  res.json({
    messages: paginatedMessages,
    total: messages.length,
    page,
    totalPages: Math.ceil(messages.length / limit),
  });
});

// API to mark message as processed
app.patch("/api/messages/:id/processed", (req, res) => {
  const messageId = parseInt(req.params.id);
  const { caseId } = req.body;

  const message = messages.find((msg) => msg.id === messageId);

  if (message) {
    message.processed = true;
    message.caseCreated = true;
    message.caseId = caseId;
    message.processedAt = new Date().toISOString();

    res.json({ success: true, message });
  } else {
    res.status(404).json({ error: "Message not found" });
  }
});

// API to get specific message
app.get("/api/messages/:id", (req, res) => {
  const messageId = parseInt(req.params.id);
  const message = messages.find((msg) => msg.id === messageId);

  if (message) {
    res.json(message);
  } else {
    res.status(404).json({ error: "Message not found" });
  }
});

// API to delete processed messages (cleanup)
app.delete("/api/messages/cleanup", (req, res) => {
  const beforeCount = messages.length;
  messages = messages.filter((msg) => !msg.processed);
  const afterCount = messages.length;

  res.json({
    deleted: beforeCount - afterCount,
    remaining: afterCount,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
