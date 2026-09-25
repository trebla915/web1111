// Run by caller_id.test.ts as a child process so every log line the agent
// writes, from any logger destination, can be checked for leaked caller data.
import { initializeLogger } from '@livekit/agents';
import { GOOD_CODE, installFakeVenueApi, MATCHING_CALLER, tool } from './fake_venue_api.ts';
import { VenueAgent } from '../src/venue_agent.ts';

initializeLogger({ pretty: false, level: 'debug' });
installFakeVenueApi();

const agent = new VenueAgent();
agent.setCallerNumber(MATCHING_CALLER);
await tool(agent, 'list_upcoming_events')();
await tool(agent, 'check_caller_id_reservation')();
await tool(agent, 'send_code_to_calling_number')({ callerAgreed: true });
await tool(agent, 'verify_reservation_lookup_code')({ code: '000000' });
await tool(agent, 'verify_reservation_lookup_code')({ code: GOOD_CODE });
await tool(agent, 'read_verified_reservations')();
await tool(agent, 'send_reservation_lookup_code')({ phone: '+19155550199' });
