export type MessageChannel = "sms" | "whatsapp";
export type MessagePurpose =
  "otp" | "order-confirmation" | "shipment-update" | "delivery-update";

export type MessageInput = {
  channel: MessageChannel;
  purpose: MessagePurpose;
  to: string;
  body: string;
};

export interface MessagingProvider {
  send(input: MessageInput): Promise<{ provider: string; sent: boolean }>;
}

class MockMessagingProvider implements MessagingProvider {
  async send(input: MessageInput) {
    if (process.env.NODE_ENV !== "production")
      console.info(
        `[dev-${input.channel}]`,
        input.purpose,
        input.to,
        input.body,
      );
    return { provider: "mock", sent: false };
  }
}

export function getMessagingProvider(): MessagingProvider {
  return new MockMessagingProvider();
}

export async function sendMessage(input: MessageInput) {
  return getMessagingProvider().send(input);
}
