// Caller ID and reservation lookup, exercised through the agent's real tools
// against a fake venue API. No model, network, SMS or production data.
import { initializeLogger } from '@livekit/agents';
import { ParticipantKind } from '@livekit/rtc-node';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { beforeEach, describe, it } from 'node:test';
import { callerNumberFrom } from '../src/caller_id.ts';
import { VenueAgent } from '../src/venue_agent.ts';
import { GOOD_CODE, installFakeVenueApi, MATCHING_CALLER, OTHER_CALLER, RESERVATION, tool, type VenueRequest } from './fake_venue_api.ts';

initializeLogger({ pretty: false, level: 'warn' });

describe('reading caller ID from the SIP participant', () => {
  const sip = (attributes: Record<string, string>) => ({ kind: ParticipantKind.SIP, attributes });

  it('reads sip.phoneNumber from a SIP caller', () => {
    assert.equal(callerNumberFrom(sip({ 'sip.phoneNumber': MATCHING_CALLER })), MATCHING_CALLER);
  });

  it('treats a missing or hidden number as unavailable', () => {
    assert.equal(callerNumberFrom(sip({})), undefined);
    assert.equal(callerNumberFrom(sip({ 'sip.phoneNumber': '' })), undefined);
    assert.equal(callerNumberFrom(sip({ 'sip.phoneNumber': 'anonymous' })), undefined);
  });

  it('ignores non-SIP participants, even with the attribute set', () => {
    assert.equal(callerNumberFrom({ kind: ParticipantKind.STANDARD, attributes: { 'sip.phoneNumber': MATCHING_CALLER } }), undefined);
  });

  it('never parses the participant identity', () => {
    assert.equal(callerNumberFrom({ ...sip({}), identity: `sip_${MATCHING_CALLER}` } as never), undefined);
  });
});

describe('caller-ID-assisted reservation lookup', () => {
  let requests: VenueRequest[];
  let agent: VenueAgent;
  beforeEach(() => {
    requests = installFakeVenueApi();
    agent = new VenueAgent();
  });
  const actions = () => requests.map((request) => request.action);

  it('lists every upcoming event with reservationsAvailable and nothing internal', async () => {
    const { events } = await tool(agent, 'list_upcoming_events')();
    assert.deepEqual(events, [
      { id: 'evt_neon', title: 'Neon Nights', date: '2026-10-03', reservationsAvailable: true },
      { id: 'evt_sol', title: 'DJ Sol', date: '2026-10-10', reservationsAvailable: false },
    ]);
  });

  it('SIP caller with a matching number gets a yes and nothing else', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    const result = await tool(agent, 'check_caller_id_reservation')();
    assert.deepEqual(result, { callerIdAvailable: true, hasPossibleReservation: true });
    assert.deepEqual(requests, [{ action: 'caller-lookup', phone: MATCHING_CALLER }]);
  });

  it('SIP caller with no matching number gets a no', async () => {
    agent.setCallerNumber(OTHER_CALLER);
    assert.deepEqual(await tool(agent, 'check_caller_id_reservation')(), { callerIdAvailable: true, hasPossibleReservation: false });
  });

  it('missing or hidden caller ID skips the lookup and cannot send a code', async () => {
    agent.setCallerNumber(undefined);
    assert.deepEqual(await tool(agent, 'check_caller_id_reservation')(), { callerIdAvailable: false });
    const sent = await tool(agent, 'send_code_to_calling_number')({ callerAgreed: true });
    assert.equal(sent.sent, false);
    assert.deepEqual(requests, []);
  });

  for (const failLookup of ['status', 'network'] as const) {
    it(`a failed lookup (${failLookup}) reads as unavailable and the call carries on`, async () => {
      requests = installFakeVenueApi({ failLookup });
      agent.setCallerNumber(MATCHING_CALLER);
      assert.deepEqual(await tool(agent, 'check_caller_id_reservation')(), { callerIdAvailable: false });
      const { events } = await tool(agent, 'list_upcoming_events')();
      assert.equal((events as unknown[]).length, 2);
    });
  }

  it('sending to the calling number requires the caller to agree', () => {
    const params = agent.toolCtx.getFunctionTool('send_code_to_calling_number')!.parameters as { safeParse(value: unknown): { success: boolean } };
    assert.equal(params.safeParse({}).success, false);
    assert.equal(params.safeParse({ callerAgreed: false }).success, false);
    assert.equal(params.safeParse({ callerAgreed: true }).success, true);
  });

  it('a caller who declines is never texted', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    await tool(agent, 'check_caller_id_reservation')();
    assert.deepEqual(actions(), ['caller-lookup'], 'the lookup itself sends nothing');
  });

  it('shares no reservation details before the code is verified', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    const hint = await tool(agent, 'check_caller_id_reservation')();
    assert.doesNotMatch(JSON.stringify(hint), /Neon|res_abc|812|9155550123/);
    assert.ok('error' in await tool(agent, 'read_verified_reservations')());
    assert.equal((await tool(agent, 'verify_reservation_lookup_code')({ code: GOOD_CODE })).verified, false, 'no code sent yet');
    await tool(agent, 'send_code_to_calling_number')({ callerAgreed: true });
    const wrong = await tool(agent, 'verify_reservation_lookup_code')({ code: '000000' });
    assert.equal(wrong.verified, false);
    assert.equal(wrong.reservations, undefined);
    assert.ok('error' in await tool(agent, 'read_verified_reservations')());
  });

  it('a verified code unlocks the existing reservation-reading flow', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    await tool(agent, 'send_code_to_calling_number')({ callerAgreed: true });
    const verified = await tool(agent, 'verify_reservation_lookup_code')({ code: GOOD_CODE });
    assert.deepEqual(verified, { verified: true, reservations: [RESERVATION] });
    assert.deepEqual(await tool(agent, 'read_verified_reservations')(), { reservations: [RESERVATION] });
    assert.deepEqual(requests.slice(-2), [
      { action: 'send-lookup-code', phone: MATCHING_CALLER },
      { action: 'verify-lookup-code', phone: MATCHING_CALLER, code: GOOD_CODE },
    ]);
  });

  it('a caller can use a different number instead', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    await tool(agent, 'send_reservation_lookup_code')({ phone: '+19155550199' });
    await tool(agent, 'verify_reservation_lookup_code')({ code: GOOD_CODE });
    assert.deepEqual(requests.map((request) => request.phone), ['+19155550199', '+19155550199']);
  });

  it('a new code resets an earlier verification', async () => {
    agent.setCallerNumber(MATCHING_CALLER);
    await tool(agent, 'send_code_to_calling_number')({ callerAgreed: true });
    await tool(agent, 'verify_reservation_lookup_code')({ code: GOOD_CODE });
    await tool(agent, 'send_reservation_lookup_code')({ phone: '+19155550199' });
    assert.ok('error' in await tool(agent, 'read_verified_reservations')());
  });
});

describe('logs', () => {
  it('never contain full phone numbers or reservation details', async () => {
    const probe = fileURLToPath(new URL('./log_probe.ts', import.meta.url));
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [probe], { env: { ...process.env, VOICE_API_BASE_URL: '', VOICE_AGENT_SHARED_SECRET: '' } });
    const output = stdout + stderr;
    assert.match(output, /venue api call/, 'the probe should have logged its API calls');
    for (const secret of ['9155550123', '555-0123', '9155550199', GOOD_CODE, 'Neon Nights', 'res_abc', '812.5', 'test-secret']) {
      assert.ok(!output.includes(secret), `logs contained ${secret}`);
    }
  });
});
