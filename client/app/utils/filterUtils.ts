import type { Person, GroupedPersons } from '../types';

export interface FilterOptions {
  isManager: boolean;
  isSiteManager: boolean;
  isDirectManager: boolean;
}

export const filterPeople = (
  people: Person[],
  currentUser: Person | null,
  sitesManaged: string[],
  filters: FilterOptions,
  commandChainPeople: Person[] = [],
  sitePeople: Person[] = [],
  directReportsPeople: Person[] = []
) => {
  if (!people || !currentUser) return people;

  let isManagedByMeFiltered: Person[] = [];
  let isInMySitefiltered: Person[] = [];
  let isDirectlyManagedByMeFiltered: Person[] = [];

  if (filters.isManager) {
    isManagedByMeFiltered = commandChainPeople;
  }
  // Filter people from sites that the current user manages
  if (filters.isSiteManager && sitesManaged.length > 0) {
    isInMySitefiltered = sitePeople;
  }

  // Filter people who report directly to the current user
  if (filters.isDirectManager) {
    isDirectlyManagedByMeFiltered = directReportsPeople;
  }

  // Combine all filtered people and deduplicate by ID
  const allFilteredPeople = [...isManagedByMeFiltered, ...isInMySitefiltered, ...isDirectlyManagedByMeFiltered];
  
  // Deduplicate by person ID
  const uniquePeopleMap = new Map<string, Person>();
  allFilteredPeople.forEach(person => {
    uniquePeopleMap.set(person.id, person);
  });
  
  const uniquePeople = Array.from(uniquePeopleMap.values());
  console.log("uniquePeople", uniquePeople);
  return uniquePeople;
};

// Fuzzy search function
export const fuzzyMatch = (text: string, pattern: string) => {
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  let patternIdx = 0;
  let textIdx = 0;

  while (patternIdx < pattern.length && textIdx < text.length) {
    if (pattern[patternIdx] === text[textIdx]) {
      patternIdx++;
    }
    textIdx++;
  }

  return patternIdx === pattern.length;
};

export const applyFiltersAndSearch = (
  basePeople: Person[],
  commandChainPeople: Person[],
  sitePeople: Person[],
  directReportsPeople: Person[],
  searchTerm: string,
  currentUser: Person | null,
  sitesManaged: string[],
  filters: FilterOptions
) => {
  let peopleToFilter: Person[] = [];
  
  if (filters.isManager) {
    peopleToFilter = [...peopleToFilter, ...commandChainPeople];
  }
  if (filters.isSiteManager) {
    peopleToFilter = [...peopleToFilter, ...sitePeople]; 
  }
  if (filters.isDirectManager) {
    peopleToFilter = [...peopleToFilter, ...directReportsPeople];
  }
  
  // If no filters are applied, use base people
  if (!filters.isManager && !filters.isSiteManager && !filters.isDirectManager) {
    peopleToFilter = basePeople;
  }

  // First apply search filter
  let filtered = searchTerm
    ? peopleToFilter.filter((person: Person) => fuzzyMatch(person.name, searchTerm))
    : peopleToFilter;

  // Then apply manager/site filters (union)
  return filterPeople(filtered, currentUser || null, sitesManaged, filters, commandChainPeople, sitePeople, directReportsPeople);
};

// Function to get flat list of people from all sources
export const applyFiltersAndSearchFlat = (
  groupedCommandChainData: GroupedPersons,
  sitePeople: Person[],
  directReportsPeople: Person[],
  searchTerm: string,
  currentUser: Person | null,
  sitesManaged: string[],
  filters: FilterOptions
): Person[] => {
  // Extract all people from grouped command chain data
  const commandChainPeople: Person[] = [];
  Object.values(groupedCommandChainData).forEach(({ persons }) => {
    commandChainPeople.push(...persons);
  });
  // Use existing flat filter logic
  return applyFiltersAndSearch(
    commandChainPeople,
    commandChainPeople,
    sitePeople,
    directReportsPeople,
    searchTerm,
    currentUser,
    sitesManaged,
    filters
  );
};

// New function to apply filters and search to grouped data while maintaining group structure
export const applyFiltersAndSearchToGroupedData = (
  groupedCommandChainData: GroupedPersons,
  sitePeople: Person[],
  directReportsPeople: Person[],
  searchTerm: string,
  currentUser: Person | null,
  sitesManaged: string[],
  filters: FilterOptions
): GroupedPersons => {
  const result: GroupedPersons = {};

  // Create sets of person IDs for filtering
  const sitePersonIds = new Set(sitePeople.map(p => p.id));
  const directReportPersonIds = new Set(directReportsPeople.map(p => p.id));

  // Helper function to check if a person should be included based on filters
  const shouldIncludePerson = (person: Person) => {
    let include = false;
    
    if (filters.isManager) {
      include = true; // All command chain people are included if manager filter is on
    }
    if (filters.isSiteManager && sitePersonIds.has(person.id)) {
      include = true;
    }
    if (filters.isDirectManager && directReportPersonIds.has(person.id)) {
      include = true;
    }
    
    // If no filters are applied, include everyone
    if (!filters.isManager && !filters.isSiteManager && !filters.isDirectManager) {
      include = true;
    }
    
    return include;
  };

  // Process each group from the command chain data
  Object.entries(groupedCommandChainData).forEach(([groupId, { group, persons }]) => {
    // Filter persons based on the active filters
    let filteredPersons = persons.filter(shouldIncludePerson);
    
    // Apply search filter
    if (searchTerm) {
      filteredPersons = filteredPersons.filter(person => fuzzyMatch(person.name, searchTerm));
    }
    
    // Only include group if it has persons after filtering
    if (filteredPersons.length > 0) {
      result[groupId] = {
        group,
        persons: filteredPersons
      };
    }
  });

  return result;
}; 