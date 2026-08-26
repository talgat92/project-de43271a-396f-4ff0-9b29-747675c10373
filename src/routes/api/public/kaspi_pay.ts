import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { buildingOfBay, type TxnType } from "@/config";

const payloadSchema = z.object({
  txn_id: z.string().min(1).max(64),
  bay_id: z.number().int().min(1).max(12),
  amount: z.number().positive().max(1_000_000),
  card_uid: z.string().min(2).max(32).optional().nullable(),
});

export const Route = createFileRoute("/api/public/kaspi_pay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { readEnv, mqttTopic, pushEvent, apiFetch } = await import("@/lib/jahan.server");
        const env = readEnv();

        const auth = request.headers.get("authorization") ?? "";
        const provided = auth.replace(/^Bearer\s+/i, "");
        if (!env.token || provided !== env.token) {
          return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "Invalid payload" }, { status: 422 });
        }

        const { txn_id, bay_id, amount, card_uid } = parsed.data;
        const type: TxnType = card_uid ? "kaspi_topup" : "kaspi_direct";
        const topic = mqttTopic(bay_id);

        // Запись в БД (carwash_db.transactions) и публикация в MQTT выполняются
        // PHP-бэкендом /kaspi_pay.php — у него есть прямой TCP-доступ к брокеру.
        let forwarded = true;
        try {
          await apiFetch("/kaspi_pay.php", {
            method: "POST",
            body: JSON.stringify({ txn_id, bay_id, amount, card_uid: card_uid ?? null, type }),
          });
        } catch {
          forwarded = false;
        }

        pushEvent({
          txn_id,
          bay_id,
          building: buildingOfBay(bay_id),
          amount,
          card_uid: card_uid ?? null,
          type,
          topic,
          created_at: new Date().toISOString(),
        });

        return Response.json({
          ok: true,
          forwarded,
          type,
          mqtt: { topic, payload: { txn_id, amount } },
        });
      },
    },
  },
});
