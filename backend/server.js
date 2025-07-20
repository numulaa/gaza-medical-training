const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");

const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const uploadImage = require("./middleware/cloudinary");
const { WhatsApp } = require("twilio/lib/twiml/VoiceResponse");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
const upload = multer({ dest: "uploads/" }); // Temporary file storage

app.use(bodyParser.urlencoded({ extended: false }));

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
