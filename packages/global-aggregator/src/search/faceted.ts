import type {
  NormalizedOpportunity,
  SearchFacets,
  FacetCount,
  ClassificationLabel,
  EducationLevel,
  ExperienceLevel,
  OpportunityType,
  WorkMode,
} from "../types";

function buildFacetCounts(values: string[]): FacetCount[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export class FacetedSearch {
  getFacets(items: NormalizedOpportunity[]): SearchFacets {
    const typeValues: string[] = [];
    const categoryValues: string[] = [];
    const countryValues: string[] = [];
    const workModeValues: string[] = [];
    const educationValues: string[] = [];
    const experienceValues: string[] = [];

    for (const item of items) {
      typeValues.push(item.type);
      for (const cat of item.categories) {
        categoryValues.push(cat);
      }
      if (item.country) {
        countryValues.push(item.country);
      }
      workModeValues.push(item.workMode);
      educationValues.push(item.educationLevel);
      experienceValues.push(item.experienceLevel);
    }

    return {
      types: buildFacetCounts(typeValues),
      categories: buildFacetCounts(categoryValues),
      countries: buildFacetCounts(countryValues),
      workModes: buildFacetCounts(workModeValues),
      educationLevels: buildFacetCounts(educationValues),
      experienceLevels: buildFacetCounts(experienceValues),
    };
  }
}
