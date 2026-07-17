import { OrderStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { getEnv } from "@/server/env";
import { audit } from "@/server/notify";

export type CourierStatus =
  | "created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed"
  | "returned_to_origin"
  | "unknown";

export type ShipmentRequest = {
  orderId: string;
  recipientName: string;
  phone: string;
  address: string;
  district: string;
  area: string;
  amountToCollect: number;
};

export type ShipmentResult = {
  provider: string;
  courierOrderId: string;
  trackingId: string;
  status: CourierStatus;
};

export interface CourierProvider {
  createShipment(input: ShipmentRequest): Promise<ShipmentResult>;
  cancelShipment(courierOrderId: string): Promise<void>;
  getStatus(courierOrderId: string): Promise<CourierStatus>;
}

export function mapCourierStatus(status: CourierStatus): OrderStatus | null {
  switch (status) {
    case "created":
      return OrderStatus.PROCESSING;
    case "picked_up":
    case "in_transit":
      return OrderStatus.SHIPPED;
    case "out_for_delivery":
      return OrderStatus.OUT_FOR_DELIVERY;
    case "delivered":
      return OrderStatus.DELIVERED;
    case "cancelled":
      return OrderStatus.CANCELLED;
    default:
      return null;
  }
}

class MockCourierProvider implements CourierProvider {
  async createShipment(input: ShipmentRequest): Promise<ShipmentResult> {
    return {
      provider: "mock",
      courierOrderId: `mock-${input.orderId}`,
      trackingId: `KGMOCK-${input.orderId.slice(-8).toUpperCase()}`,
      status: "created",
    };
  }
  async cancelShipment() {}
  async getStatus() {
    return "created" as const;
  }
}

class CredentialRequiredCourierProvider implements CourierProvider {
  constructor(private readonly provider: string) {}
  async createShipment(): Promise<ShipmentResult> {
    throw new Error(
      `${this.provider} courier credentials are required before live shipment booking.`,
    );
  }
  async cancelShipment() {
    throw new Error(
      `${this.provider} courier credentials are required before live shipment cancellation.`,
    );
  }
  async getStatus(): Promise<CourierStatus> {
    throw new Error(
      `${this.provider} courier credentials are required before live shipment tracking.`,
    );
  }
}

export function getCourierProvider(): CourierProvider {
  const provider = getEnv().COURIER_PROVIDER;
  if (provider === "mock") return new MockCourierProvider();
  return new CredentialRequiredCourierProvider(provider);
}

export async function bookShipment(input: ShipmentRequest) {
  const result = await getCourierProvider().createShipment(input);
  const status = mapCourierStatus(result.status);
  await prisma.order.update({
    where: { id: input.orderId },
    data: {
      courierProvider: result.provider,
      courierOrderId: result.courierOrderId,
      trackingId: result.trackingId,
      ...(status ? { status } : {}),
      ...(status === OrderStatus.SHIPPED ? { shippedAt: new Date() } : {}),
      ...(status === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
    },
  });
  if (status)
    await prisma.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        toStatus: status,
        note: `Courier status: ${result.status}`,
      },
    });
  await audit({
    action: "courier.shipment_created",
    entity: "Order",
    entityId: input.orderId,
    metadata: { provider: result.provider, trackingId: result.trackingId },
  });
  return result;
}
