import { describe, expect, it } from "vitest";
import {
  activeHomepageItems,
  defaultHomepageSettings,
  validateHomepageSettings,
} from "@/server/site-settings";

describe("homepage CMS settings", () => {
  it("keeps disabled and expired hero slides out of active rendering", () => {
    const now = new Date("2026-07-16T10:00:00+06:00");
    const slides = [
      {
        ...defaultHomepageSettings.heroSlides[0],
        id: "disabled",
        enabled: false,
        sortOrder: 1,
      },
      {
        ...defaultHomepageSettings.heroSlides[0],
        id: "expired",
        enabled: true,
        sortOrder: 2,
        endDate: "2026-07-15T23:59",
      },
      {
        ...defaultHomepageSettings.heroSlides[0],
        id: "future",
        enabled: true,
        sortOrder: 3,
        startDate: "2026-07-17T00:00",
      },
      {
        ...defaultHomepageSettings.heroSlides[0],
        id: "active",
        enabled: true,
        sortOrder: 4,
      },
    ];

    expect(activeHomepageItems(slides, now).map((slide) => slide.id)).toEqual([
      "active",
    ]);
  });

  it("orders active homepage rows by sort order", () => {
    const rows = [
      { enabled: true, id: "third", sortOrder: 30, startDate: "", endDate: "" },
      { enabled: true, id: "first", sortOrder: 10, startDate: "", endDate: "" },
      { enabled: true, id: "second", sortOrder: 20, startDate: "", endDate: "" },
    ];

    expect(activeHomepageItems(rows).map((row) => row.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("rejects invalid scheduled date windows", () => {
    expect(() =>
      validateHomepageSettings({
        ...defaultHomepageSettings,
        heroSlides: [
          {
            ...defaultHomepageSettings.heroSlides[0],
            startDate: "2026-07-20T00:00",
            endDate: "2026-07-19T00:00",
          },
        ],
      }),
    ).toThrow(/start date must be before end date/i);
  });

  it("normalises unknown legacy JSON with typed defaults", () => {
    const settings = validateHomepageSettings({
      hero: { title: "Custom hero" },
      heroSlides: [{ title: "Typed slide", alignment: "sideways" }],
      reviewsConfig: { minimumRating: 9 },
    });

    expect(settings.hero.title).toBe("Custom hero");
    expect(settings.heroSlides[0].alignment).toBe("left");
    expect(settings.reviewsConfig.minimumRating).toBe(4);
    expect(settings.newsletterConfig.buttonLabel).toBe("Subscribe");
  });
});
