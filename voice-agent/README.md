# 11:11 EPTX phone agent

This LiveKit Agents Node.js worker uses OpenAI GPT-Live 1 for the voice conversation and calls the Next.js server at `/api/voice-agent` for current event, table, bottle, verification, quote, and booking data. The server owns Firebase Admin and Stripe credentials. The phone agent never reads Firestore or creates charges directly.

## Local setup

1. Install Node.js 24 or newer, npm, and the LiveKit CLI.
2. In the LiveKit Cloud project, create an API key and secret. Create an OpenAI API key for an account that has GPT-Live 1 API access.
3. Copy `.env.example` to `.env.local`, then fill in the LiveKit URL/key/secret, OpenAI key, production or local web-app URL, and a long random `VOICE_AGENT_SHARED_SECRET`.
4. Add the same `VOICE_AGENT_SHARED_SECRET` to the web app's Vercel environment variables. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, and `TWILIO_FROM_NUMBER` there as well. The Firebase Admin and Stripe secrets already used by the app must be configured in Vercel.
5. From this directory, run `npm install`, then `npm run dev`. The LiveKit Agent Console can start a local session for microphone testing.

The local `.env.local` file is ignored by Git. Never commit it or send its values in chat. Create `livekit-secrets.env` locally with only `OPENAI_API_KEY`, `VOICE_API_BASE_URL`, and `VOICE_AGENT_SHARED_SECRET`; keep LiveKit connection credentials in `.env.local` only. This secrets file is for the LiveKit deployment command and must not be used for local agent startup.

## LiveKit Cloud setup

1. Run `lk cloud auth` and select the project that you created in LiveKit Cloud.
2. Deploy from this directory using `lk agent create --secrets-file=./livekit-secrets.env`. Keep that file out of Git and delete it after deployment. It must contain only `OPENAI_API_KEY`, `VOICE_API_BASE_URL`, and `VOICE_AGENT_SHARED_SECRET` (LiveKit injects its credentials at runtime).
3. For subsequent code updates, deploy from this directory with `lk agent deploy`.
4. In **Telephony → Phone numbers**, rent a test local number. In **Telephony → Dispatch rules**, create an individual-call rule and assign the `1111-phone-agent` agent. Call the test number and confirm that the agent answers and its logs show successful API-tool responses.
5. For the venue's published number, either point the existing phone provider's forwarding/SIP route at LiveKit or use a LiveKit number as the public line. Confirm forwarding preserves caller ID. Keep a staff route available for requests the agent cannot handle.

## Text messages and reservation payments

The web backend uses Twilio Verify to protect reservation lookups and Twilio SMS to send Stripe Checkout links. Create a Twilio Verify service and configure a messaging-capable sender. The text sender can be different from the LiveKit call number unless the existing carrier provides an SMS integration.

The caller must choose an event, available table, guest count, and enough bottles to meet the table minimum. The server calculates the same tax, bottle gratuity, and card-fee total as the web reservation flow, verifies the caller's quoted total again, atomically holds the table, and creates a 30-minute Stripe Checkout Session. The Stripe `payment_intent.succeeded` webhook converts that hold into a confirmed reservation. If another booking wins the table, the webhook refunds the completed payment rather than creating a duplicate reservation.

## Required web environment variables

Add these in Vercel for Preview and Production as appropriate:

```text
VOICE_AGENT_SHARED_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
TWILIO_FROM_NUMBER
```

Keep credentials in Vercel and LiveKit Cloud Secrets; never commit `.env.local` or paste secrets into source files.
