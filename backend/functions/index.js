// functions/src/index.ts (for TypeScript)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (it's automatically initialized for Cloud Functions,
// but good practice to explicitly call if you need specific config)
admin.initializeApp();

const db = admin.firestore();

// Define a Cloud Function that responds to HTTP POST requests
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // Twilio sends data as URL-encoded form data, not JSON, so it's in req.body directly.
  // For example: To:whatsapp:+1234567890, From:whatsapp:+1987654321, Body:Hello
  const messageBody = req.body.Body;
  const fromNumber = req.body.From; // The user's WhatsApp number (e.g., "whatsapp:+1234567890")
  const toNumber = req.body.To; // Your Twilio WhatsApp number
  const messageSid = req.body.MessageSid; // Unique ID for the message

  functions.logger.info(
    `Received WhatsApp message from ${fromNumber}: ${messageBody}`
  );

  // --- Post data to Firestore ---
  try {
    // Option 1: Store each message in a 'messages' collection
    const messageData = {
      from: fromNumber,
      to: toNumber,
      body: messageBody,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
      platform: "whatsapp",
      messageSid: messageSid,
      direction: "inbound", // Indicate it's from the user to the bot
    };
    await db.collection("whatsappMessages").add(messageData);
    functions.logger.info(`Message from ${fromNumber} saved to Firestore.`);

    // Option 2 (More advanced): Manage conversations
    // You might want a 'conversations' collection, with a subcollection for 'messages'
    // const conversationRef = db.collection('conversations').doc(fromNumber); // Use user's number as doc ID
    // await conversationRef.collection('messages').add(messageData);
    // functions.logger.info(`Message saved to conversation ${fromNumber} in Firestore.`);

    // --- Optional: Send a response back to the user ---
    // Twilio expects TwiML (XML) in response to a webhook.
    // You can build a more complex response based on the messageBody,
    // e.g., using AI/ML integration here.
    const twimlResponse = `
            <Response>
                <Message>Thank you for your message! You said: "${messageBody}". We've logged this.!</Message>
            </Response>`;

    res.set("Content-Type", "text/xml"); // Important: Tell Twilio it's XML
    res.status(200).send(twimlResponse);
  } catch (error) {
    functions.logger.error("Error processing WhatsApp message:", error);
    // Send an error response back to Twilio if something goes wrong
    res
      .status(500)
      .send(
        "<Response><Message>Oops! Something went wrong on our end.</Message></Response>"
      );
  }
});
