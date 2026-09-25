import { cli, defineAgent, log, ServerOptions, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { ParticipantKind } from '@livekit/rtc-node';
import { fileURLToPath } from 'node:url';
import { callerNumberFrom } from './caller_id.ts';
import { BACKEND_INSTRUCTIONS, BACKEND_MODEL } from './instructions.ts';
import { VenueAgent } from './venue_agent.ts';

if (!process.env.VOICE_API_BASE_URL || !process.env.VOICE_AGENT_SHARED_SECRET) {
  throw new Error('Set VOICE_API_BASE_URL and VOICE_AGENT_SHARED_SECRET before starting the agent.');
}

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      llm: new openai.realtime.GPTLiveModel({
        voice: 'marin',
        responsesOptions: {
          model: BACKEND_MODEL,
          instructions: BACKEND_INSTRUCTIONS,
        },
      }),
    });
    const agent = new VenueAgent();
    await session.start({ agent, room: ctx.room });
    await ctx.connect();
    // The greeting is already under way; caller ID only matters later, if the
    // caller asks about a reservation. Log whether a number arrived, never the number.
    try {
      const participant = await ctx.waitForParticipant();
      const callerNumber = callerNumberFrom(participant);
      agent.setCallerNumber(callerNumber);
      log().info({ callerId: { sip: participant.kind === ParticipantKind.SIP, present: Boolean(callerNumber) } }, 'caller joined');
    } catch {
      log().warn('caller ID unavailable');
    }
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: '1111-phone-agent' }));
