// U.S. states & capitals (public-domain facts). Region uses the 5-region model taught in
// elementary school; used for same-region distractors (CG-04).
export type Region = 'Northeast' | 'Southeast' | 'Midwest' | 'Southwest' | 'West';

export interface StateInfo {
  name: string;
  capital: string;
  region: Region;
  capitalAlt?: string[];
}

export const STATES: StateInfo[] = [
  { name: 'Alabama', capital: 'Montgomery', region: 'Southeast' },
  { name: 'Alaska', capital: 'Juneau', region: 'West' },
  { name: 'Arizona', capital: 'Phoenix', region: 'Southwest' },
  { name: 'Arkansas', capital: 'Little Rock', region: 'Southeast' },
  { name: 'California', capital: 'Sacramento', region: 'West' },
  { name: 'Colorado', capital: 'Denver', region: 'West' },
  { name: 'Connecticut', capital: 'Hartford', region: 'Northeast' },
  { name: 'Delaware', capital: 'Dover', region: 'Northeast' },
  { name: 'Florida', capital: 'Tallahassee', region: 'Southeast' },
  { name: 'Georgia', capital: 'Atlanta', region: 'Southeast' },
  { name: 'Hawaii', capital: 'Honolulu', region: 'West' },
  { name: 'Idaho', capital: 'Boise', region: 'West' },
  { name: 'Illinois', capital: 'Springfield', region: 'Midwest' },
  { name: 'Indiana', capital: 'Indianapolis', region: 'Midwest' },
  { name: 'Iowa', capital: 'Des Moines', region: 'Midwest' },
  { name: 'Kansas', capital: 'Topeka', region: 'Midwest' },
  { name: 'Kentucky', capital: 'Frankfort', region: 'Southeast' },
  { name: 'Louisiana', capital: 'Baton Rouge', region: 'Southeast' },
  { name: 'Maine', capital: 'Augusta', region: 'Northeast' },
  { name: 'Maryland', capital: 'Annapolis', region: 'Northeast' },
  { name: 'Massachusetts', capital: 'Boston', region: 'Northeast' },
  { name: 'Michigan', capital: 'Lansing', region: 'Midwest' },
  { name: 'Minnesota', capital: 'Saint Paul', region: 'Midwest', capitalAlt: ['St. Paul', 'St Paul'] },
  { name: 'Mississippi', capital: 'Jackson', region: 'Southeast' },
  { name: 'Missouri', capital: 'Jefferson City', region: 'Midwest' },
  { name: 'Montana', capital: 'Helena', region: 'West' },
  { name: 'Nebraska', capital: 'Lincoln', region: 'Midwest' },
  { name: 'Nevada', capital: 'Carson City', region: 'West' },
  { name: 'New Hampshire', capital: 'Concord', region: 'Northeast' },
  { name: 'New Jersey', capital: 'Trenton', region: 'Northeast' },
  { name: 'New Mexico', capital: 'Santa Fe', region: 'Southwest' },
  { name: 'New York', capital: 'Albany', region: 'Northeast' },
  { name: 'North Carolina', capital: 'Raleigh', region: 'Southeast' },
  { name: 'North Dakota', capital: 'Bismarck', region: 'Midwest' },
  { name: 'Ohio', capital: 'Columbus', region: 'Midwest' },
  { name: 'Oklahoma', capital: 'Oklahoma City', region: 'Southwest' },
  { name: 'Oregon', capital: 'Salem', region: 'West' },
  { name: 'Pennsylvania', capital: 'Harrisburg', region: 'Northeast' },
  { name: 'Rhode Island', capital: 'Providence', region: 'Northeast' },
  { name: 'South Carolina', capital: 'Columbia', region: 'Southeast' },
  { name: 'South Dakota', capital: 'Pierre', region: 'Midwest' },
  { name: 'Tennessee', capital: 'Nashville', region: 'Southeast' },
  { name: 'Texas', capital: 'Austin', region: 'Southwest' },
  { name: 'Utah', capital: 'Salt Lake City', region: 'West' },
  { name: 'Vermont', capital: 'Montpelier', region: 'Northeast' },
  { name: 'Virginia', capital: 'Richmond', region: 'Southeast' },
  { name: 'Washington', capital: 'Olympia', region: 'West' },
  { name: 'West Virginia', capital: 'Charleston', region: 'Southeast' },
  { name: 'Wisconsin', capital: 'Madison', region: 'Midwest' },
  { name: 'Wyoming', capital: 'Cheyenne', region: 'West' },
];

export const CONTINENTS: Array<{ q: string; a: string; hint?: string }> = [
  { q: 'Which continent is the largest?', a: 'Asia' },
  { q: 'Which continent is the smallest?', a: 'Australia' },
  { q: 'Which continent is covered in ice at the South Pole?', a: 'Antarctica' },
  { q: 'Which continent is the United States on?', a: 'North America' },
  { q: 'Which continent is Brazil on?', a: 'South America' },
  { q: 'Which continent is Egypt on?', a: 'Africa' },
  { q: 'Which continent is France on?', a: 'Europe' },
  { q: 'Which continent is China on?', a: 'Asia' },
  { q: 'Which continent is Canada on?', a: 'North America' },
  { q: 'Which continent is Kenya on?', a: 'Africa' },
  { q: 'Which continent is Japan on?', a: 'Asia' },
  { q: 'Which continent is Argentina on?', a: 'South America' },
  { q: 'Which continent is Mexico on?', a: 'North America' },
  { q: 'Which continent is Italy on?', a: 'Europe' },
  { q: 'Which continent is India on?', a: 'Asia' },
  { q: 'Which continent has kangaroos in the wild?', a: 'Australia' },
  { q: 'Which continent has the Sahara Desert?', a: 'Africa' },
  { q: 'Which continent has the Amazon Rainforest?', a: 'South America' },
  { q: 'Which continent has penguins but no countries?', a: 'Antarctica' },
  { q: 'How many continents are there?', a: '7' },
];
export const CONTINENT_NAMES = ['Africa', 'Antarctica', 'Asia', 'Australia', 'Europe', 'North America', 'South America'];

export const OCEANS: Array<{ q: string; a: string }> = [
  { q: 'Which ocean is the largest?', a: 'Pacific Ocean' },
  { q: 'Which ocean is between North America and Europe?', a: 'Atlantic Ocean' },
  { q: 'Which ocean is south of India?', a: 'Indian Ocean' },
  { q: 'Which ocean is at the North Pole?', a: 'Arctic Ocean' },
  { q: 'Which ocean surrounds Antarctica?', a: 'Southern Ocean' },
  { q: 'Which ocean is on the west coast of the United States?', a: 'Pacific Ocean' },
  { q: 'Which ocean is on the east coast of the United States?', a: 'Atlantic Ocean' },
  { q: 'Which ocean is the smallest?', a: 'Arctic Ocean' },
  { q: 'How many oceans are there?', a: '5' },
];
export const OCEAN_NAMES = ['Arctic Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Southern Ocean'];
