# Courier Status Mapping

| Provider-normalized status | Internal order status                 | Side effects                                                           |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| pending/created            | PROCESSING                            | History only after authenticated provider action                       |
| picked_up/in_transit       | SHIPPED                               | Shipment/order history; shipped timestamp                              |
| out_for_delivery           | OUT_FOR_DELIVERY                      | History only                                                           |
| delivered                  | DELIVERED                             | Delivered timestamp and history; only from authenticated provider data |
| delivery_failed/failed     | unchanged                             | Store shipment event for review; no inventory/refund action            |
| cancelled                  | CANCELLED only through valid workflow | Never infer refund automatically                                       |
| returned_to_origin         | unchanged                             | Manual operations review; no automatic refund or inventory mutation    |
| unknown                    | unchanged                             | Preserve raw provider status/event safely; alert/review                |

Provider adapters must normalize their vocabulary into the shared status type. Duplicate events are rejected by provider event IDs/idempotency constraints. Unknown values must not update order state. Returned-to-origin requires inspection and an explicit order/return/refund workflow. No client-submitted status may mark an order delivered.
