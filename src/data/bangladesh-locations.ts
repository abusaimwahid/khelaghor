export type Area = {
  id: string;
  districtId: string;
  name: string;
  nameBn?: string;
  postalCode?: string;
  remote?: boolean;
};

export type District = {
  id: string;
  divisionId: string;
  name: string;
  nameBn?: string;
  areas: Area[];
};

export type Division = {
  id: string;
  name: string;
  nameBn?: string;
  districts: District[];
};

const divisionRows = [
  ["dhaka", "Dhaka", "ঢাকা"],
  ["chattogram", "Chattogram", "চট্টগ্রাম"],
  ["rajshahi", "Rajshahi", "রাজশাহী"],
  ["khulna", "Khulna", "খুলনা"],
  ["barishal", "Barishal", "বরিশাল"],
  ["sylhet", "Sylhet", "সিলেট"],
  ["rangpur", "Rangpur", "রংপুর"],
  ["mymensingh", "Mymensingh", "ময়মনসিংহ"],
] as const;

const districtsByDivision: Record<string, string[]> = {
  dhaka: [
    "Dhaka",
    "Faridpur",
    "Gazipur",
    "Gopalganj",
    "Kishoreganj",
    "Madaripur",
    "Manikganj",
    "Munshiganj",
    "Narayanganj",
    "Narsingdi",
    "Rajbari",
    "Shariatpur",
    "Tangail",
  ],
  chattogram: [
    "Bandarban",
    "Brahmanbaria",
    "Chandpur",
    "Chattogram",
    "Cumilla",
    "Cox's Bazar",
    "Feni",
    "Khagrachhari",
    "Lakshmipur",
    "Noakhali",
    "Rangamati",
  ],
  rajshahi: [
    "Bogura",
    "Chapainawabganj",
    "Joypurhat",
    "Naogaon",
    "Natore",
    "Pabna",
    "Rajshahi",
    "Sirajganj",
  ],
  khulna: [
    "Bagerhat",
    "Chuadanga",
    "Jashore",
    "Jhenaidah",
    "Khulna",
    "Kushtia",
    "Magura",
    "Meherpur",
    "Narail",
    "Satkhira",
  ],
  barishal: [
    "Barguna",
    "Barishal",
    "Bhola",
    "Jhalokathi",
    "Patuakhali",
    "Pirojpur",
  ],
  sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
  rangpur: [
    "Dinajpur",
    "Gaibandha",
    "Kurigram",
    "Lalmonirhat",
    "Nilphamari",
    "Panchagarh",
    "Rangpur",
    "Thakurgaon",
  ],
  mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
};

const areaOverrides: Record<string, Omit<Area, "districtId">[]> = {
  "dhaka-dhaka": [
    { id: "dhaka-dhanmondi", name: "Dhanmondi", postalCode: "1205" },
    { id: "dhaka-gulshan", name: "Gulshan", postalCode: "1212" },
    { id: "dhaka-banani", name: "Banani", postalCode: "1213" },
    { id: "dhaka-mirpur", name: "Mirpur", postalCode: "1216" },
    { id: "dhaka-uttara", name: "Uttara", postalCode: "1230" },
    { id: "dhaka-mohammadpur", name: "Mohammadpur", postalCode: "1207" },
    { id: "dhaka-wari", name: "Wari", postalCode: "1203" },
    { id: "dhaka-motijheel", name: "Motijheel", postalCode: "1000" },
    { id: "dhaka-bashundhara", name: "Bashundhara R/A", postalCode: "1229" },
    { id: "dhaka-savar", name: "Savar", postalCode: "1340" },
    { id: "dhaka-keraniganj", name: "Keraniganj", postalCode: "1310" },
  ],
  "dhaka-gazipur": [
    { id: "gazipur-sadar", name: "Gazipur Sadar", postalCode: "1700" },
    { id: "gazipur-tongi", name: "Tongi", postalCode: "1710" },
  ],
  "dhaka-narayanganj": [
    { id: "narayanganj-sadar", name: "Narayanganj Sadar", postalCode: "1400" },
    { id: "narayanganj-fatullah", name: "Fatullah", postalCode: "1421" },
  ],
  "chattogram-chattogram": [
    { id: "chattogram-agrabad", name: "Agrabad", postalCode: "4100" },
    { id: "chattogram-panchlaish", name: "Panchlaish", postalCode: "4203" },
    { id: "chattogram-patenga", name: "Patenga", postalCode: "4204" },
  ],
  "chattogram-bandarban": [
    { id: "bandarban-sadar", name: "Bandarban Sadar", postalCode: "4600", remote: true },
    { id: "bandarban-thanchi", name: "Thanchi", remote: true },
  ],
  "chattogram-rangamati": [
    { id: "rangamati-sadar", name: "Rangamati Sadar", postalCode: "4500", remote: true },
  ],
  "rangpur-kurigram": [
    { id: "kurigram-sadar", name: "Kurigram Sadar", postalCode: "5600" },
    { id: "kurigram-char-rajibpur", name: "Char Rajibpur", remote: true },
  ],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export const bangladeshDivisions: Division[] = divisionRows.map(
  ([divisionId, divisionName, nameBn]) => ({
    id: divisionId,
    name: divisionName,
    nameBn,
    districts: districtsByDivision[divisionId].map((districtName) => {
      const districtId = `${divisionId}-${slugify(districtName)}`;
      const areas =
        areaOverrides[districtId] ??
        [
          {
            id: `${districtId}-sadar`,
            name: `${districtName} Sadar`,
          },
        ];
      return {
        id: districtId,
        divisionId,
        name: districtName,
        areas: areas.map((area) => ({ ...area, districtId })),
      };
    }),
  }),
);

export function getDivisions() {
  return bangladeshDivisions;
}

export function getDistrictsByDivision(divisionId: string) {
  return getDivisions().find((division) => division.id === divisionId)?.districts ?? [];
}

export function getAreasByDistrict(districtId: string) {
  for (const division of getDivisions()) {
    const district = division.districts.find((item) => item.id === districtId);
    if (district) return district.areas;
  }
  return [];
}

export function findLocationByIds(input: {
  divisionId: string;
  districtId: string;
  areaId?: string | null;
}) {
  const division = getDivisions().find((item) => item.id === input.divisionId);
  const district = division?.districts.find((item) => item.id === input.districtId);
  const area = input.areaId
    ? district?.areas.find((item) => item.id === input.areaId)
    : undefined;
  return { division, district, area };
}

export function validateBangladeshAddress(input: {
  divisionId: string;
  districtId: string;
  areaId?: string | null;
}) {
  const { division, district, area } = findLocationByIds(input);
  if (!division) return { ok: false as const, message: "Select a valid division." };
  if (!district || district.divisionId !== division.id) {
    return { ok: false as const, message: "Select a valid district for the division." };
  }
  if (input.areaId && (!area || area.districtId !== district.id)) {
    return { ok: false as const, message: "Select a valid area for the district." };
  }
  return { ok: true as const, division, district, area };
}

export function allDistrictIdsExcept(ids: string[]) {
  const excluded = new Set(ids);
  return getDivisions().flatMap((division) =>
    division.districts
      .filter((district) => !excluded.has(district.id))
      .map((district) => district.id),
  );
}
