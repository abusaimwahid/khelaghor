import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSiteSettings } from "./site-settings";
import {
  findLocationByIds,
  validateBangladeshAddress,
} from "@/data/bangladesh-locations";

export type DeliveryMethod = "standard" | "express" | "pickup";

export type DeliveryQuoteInput = {
  divisionId: string;
  districtId: string;
  areaId?: string | null;
  deliveryMethod: DeliveryMethod;
  subtotal: Prisma.Decimal | number;
  paymentMethod: string;
};

export type DeliveryQuote = {
  zoneId: string;
  zoneName: string;
  deliveryFee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  codAvailable: boolean;
  expressAvailable: boolean;
  matchedRuleId?: string;
  divisionName: string;
  districtName: string;
  areaName?: string;
  freeDeliveryApplied: boolean;
};

export class DeliveryError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

type ZoneWithRules = Prisma.DeliveryZoneGetPayload<{
  include: { rules: true };
}>;

export async function quoteDelivery(
  input: DeliveryQuoteInput,
): Promise<DeliveryQuote> {
  const settings = await getSiteSettings();
  const validated = validateBangladeshAddress(input);
  if (!validated.ok)
    throw new DeliveryError(validated.message, "INVALID_ADDRESS");
  const subtotal = Number(input.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new DeliveryError("Subtotal is invalid.", "INVALID_SUBTOTAL");
  }

  const zones = await prisma.deliveryZone.findMany({
    where: { active: true, archivedAt: null },
    include: { rules: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (!zones.length) {
    throw new DeliveryError("Delivery zones are not configured.", "NO_ZONES");
  }

  const match = matchDeliveryZone(
    zones,
    {
      divisionId: input.divisionId,
      districtId: input.districtId,
      areaId: input.areaId,
    },
    input.deliveryMethod,
  );
  if (!match) {
    throw new DeliveryError(
      input.deliveryMethod === "pickup"
        ? "Store pickup is not available for this address."
        : "No delivery zone matched.",
      input.deliveryMethod === "pickup" ? "PICKUP_UNAVAILABLE" : "NO_MATCH",
    );
  }

  const { zone, rule } = match;
  if (input.deliveryMethod === "pickup" && !zone.pickup) {
    throw new DeliveryError(
      "Store pickup is not available for this address.",
      "PICKUP_UNAVAILABLE",
    );
  }
  if (
    input.deliveryMethod === "express" &&
    (!settings.commerce.expressDeliveryEnabled || !zone.expressAvailable)
  ) {
    throw new DeliveryError(
      "Express delivery is not available for this address.",
      "EXPRESS_UNAVAILABLE",
    );
  }
  const codAvailable = settings.commerce.codEnabled && zone.codAvailable;
  if (input.paymentMethod === "COD" && !codAvailable) {
    throw new DeliveryError(
      "Cash on Delivery is not available for this address.",
      "COD_UNAVAILABLE",
    );
  }
  if (zone.minDeliveryDays < 0 || zone.maxDeliveryDays < zone.minDeliveryDays) {
    throw new DeliveryError(
      "Delivery estimate is invalid.",
      "INVALID_ESTIMATE",
    );
  }

  const threshold = zone.freeDeliveryThreshold
    ? Number(zone.freeDeliveryThreshold)
    : null;
  const freeDeliveryApplied =
    input.deliveryMethod !== "pickup" &&
    threshold !== null &&
    threshold > 0 &&
    subtotal >= threshold;
  let fee =
    input.deliveryMethod === "pickup"
      ? 0
      : input.deliveryMethod === "express"
        ? Number(zone.expressFee ?? zone.deliveryFee)
        : Number(zone.deliveryFee);
  if (freeDeliveryApplied) fee = 0;
  if (!Number.isFinite(fee) || fee < 0) {
    throw new DeliveryError("Delivery fee is invalid.", "INVALID_FEE");
  }

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    deliveryFee: fee,
    estimatedMinDays: zone.minDeliveryDays,
    estimatedMaxDays: zone.maxDeliveryDays,
    codAvailable,
    expressAvailable:
      settings.commerce.expressDeliveryEnabled && zone.expressAvailable,
    matchedRuleId: rule?.id,
    divisionName: validated.division.name,
    districtName: validated.district.name,
    areaName: validated.area?.name,
    freeDeliveryApplied,
  };
}

function matchDeliveryZone(
  zones: ZoneWithRules[],
  location: { divisionId: string; districtId: string; areaId?: string | null },
  deliveryMethod: DeliveryMethod,
) {
  const { area } = findLocationByIds(location);
  const eligibleZones =
    deliveryMethod === "pickup"
      ? zones.filter((zone) => zone.pickup)
      : zones.filter((zone) => !zone.pickup);
  const rules = eligibleZones
    .flatMap((zone) =>
      zone.rules.map((rule) => ({
        zone,
        rule,
        specificity: rule.areaId
          ? 4
          : rule.districtId
            ? 3
            : rule.divisionId
              ? 2
              : rule.remoteOnly
                ? 1
                : 0,
      })),
    )
    .filter(({ rule }) => {
      if (rule.areaId) return rule.areaId === location.areaId;
      if (rule.districtId) return rule.districtId === location.districtId;
      if (rule.divisionId) return rule.divisionId === location.divisionId;
      if (rule.remoteOnly) return Boolean(area?.remote);
      return false;
    })
    .sort((a, b) => {
      if (b.specificity !== a.specificity) return b.specificity - a.specificity;
      if (b.rule.priority !== a.rule.priority)
        return b.rule.priority - a.rule.priority;
      return a.zone.sortOrder - b.zone.sortOrder;
    });
  if (rules[0]) return rules[0];
  const fallbackZones = eligibleZones.filter((zone) => zone.fallback);
  if (fallbackZones.length > 1) {
    throw new DeliveryError(
      "Multiple fallback delivery zones are active.",
      "AMBIGUOUS_FALLBACK",
    );
  }
  const fallback = fallbackZones[0];
  return fallback ? { zone: fallback, rule: undefined, specificity: 0 } : null;
}
