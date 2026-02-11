interface VipCheckinPayload {
  table: string;
  name: string;
  partySize: number;
  eventName: string;
  reservationId: string;
  checkedInAt: string;
  checkedInBy: string;
}

export function notifyVipCheckin(payload: VipCheckinPayload): Promise<void> {
  const url = process.env.DISPATCHER_URL;
  const key = process.env.DISPATCHER_ANNOUNCE_KEY;

  if (!url || !key) {
    console.warn("[Dispatcher] DISPATCHER_URL or DISPATCHER_ANNOUNCE_KEY not set – skipping notification");
    return Promise.resolve();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);

  return fetch(`${url}/announce/preset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ANNOUNCE-KEY": key,
    },
    body: JSON.stringify({
      presetId: "vip_checkin",
      channel: process.env.DISPATCHER_VIP_CHANNEL ?? "VIP-HOST",
      vars: {
        table: payload.table,
        name: payload.name,
        partySize: payload.partySize,
        eventName: payload.eventName,
      },
      meta: {
        reservationId: payload.reservationId,
        checkedInAt: payload.checkedInAt,
        checkedInBy: payload.checkedInBy,
        venue: "1111",
      },
    }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Dispatcher responded ${res.status}`);
    })
    .finally(() => clearTimeout(timeout));
}
