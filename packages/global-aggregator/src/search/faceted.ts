import type {
  NormalizedOpportunity,
  SearchFacets,
  FacetCount,
  SalaryRangeFacet,
} from "../types";

function buildFacetCounts(values: string[]): FacetCount[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v || v === "unknown" || v === "any") continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function buildSalaryRanges(items: NormalizedOpportunity[]): SalaryRangeFacet[] {
  const ranges: { label: string; min: number; max: number; count: number }[] = [
    { label: "Unpaid", min: 0, max: 0, count: 0 },
    { label: "Under $25K", min: 1, max: 25000, count: 0 },
    { label: "$25K-$50K", min: 25000, max: 50000, count: 0 },
    { label: "$50K-$75K", min: 50000, max: 75000, count: 0 },
    { label: "$75K-$100K", min: 75000, max: 100000, count: 0 },
    { label: "$100K-$150K", min: 100000, max: 150000, count: 0 },
    { label: "$150K-$200K", min: 150000, max: 200000, count: 0 },
    { label: "$200K+", min: 200000, max: Infinity, count: 0 },
  ];

  for (const item of items) {
    const salary = item.salaryMax ?? item.salaryMin;
    if (salary === null || salary === undefined) continue;
    const range = ranges.find((r) => salary >= r.min && salary < r.max);
    if (range) range.count++;
  }

  return ranges.filter((r) => r.count > 0);
}

export class FacetedSearch {
  getFacets(items: NormalizedOpportunity[]): SearchFacets {
    const typeValues: string[] = [];
    const categoryValues: string[] = [];
    const countryValues: string[] = [];
    const cityValues: string[] = [];
    const stateValues: string[] = [];
    const orgValues: string[] = [];
    const workModeValues: string[] = [];
    const educationValues: string[] = [];
    const experienceValues: string[] = [];
    const skillValues: string[] = [];
    const tagValues: string[] = [];
    const employmentTypeValues: string[] = [];

    for (const item of items) {
      typeValues.push(item.type);
      for (const cat of item.categories) categoryValues.push(cat);
      if (item.country) countryValues.push(item.country);
      if (item.city) cityValues.push(item.city);
      if (item.state) stateValues.push(item.state);
      if (item.organization) orgValues.push(item.organization);
      workModeValues.push(item.workMode);
      educationValues.push(item.educationLevel);
      experienceValues.push(item.experienceLevel);
      for (const s of item.skills) skillValues.push(s);
      for (const t of item.tags) tagValues.push(t);
      if (item.employmentType) employmentTypeValues.push(item.employmentType);
    }

    return {
      types: buildFacetCounts(typeValues),
      categories: buildFacetCounts(categoryValues),
      countries: buildFacetCounts(countryValues),
      cities: buildFacetCounts(cityValues),
      states: buildFacetCounts(stateValues),
      organizations: buildFacetCounts(orgValues),
      workModes: buildFacetCounts(workModeValues),
      educationLevels: buildFacetCounts(educationValues),
      experienceLevels: buildFacetCounts(experienceValues),
      skills: buildFacetCounts(skillValues),
      tags: buildFacetCounts(tagValues),
      employmentTypes: buildFacetCounts(employmentTypeValues),
      salaryRanges: buildSalaryRanges(items),
    };
  }
}
