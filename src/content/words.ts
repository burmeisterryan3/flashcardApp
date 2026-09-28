// Original word sets written for this app (CR-01). Not copied from any published list.
// Sight words are grouped by theme within each grade so decks feel purposeful.

export const SIGHT_WORDS: Record<string, { name: string; grade: number; words: string[] }> = {
  k: {
    name: 'Kindergarten words',
    grade: 0,
    words: [
      'a', 'I', 'me', 'my', 'we', 'you', 'he', 'she', 'it', 'is',
      'am', 'at', 'an', 'and', 'the', 'to', 'in', 'on', 'up', 'go',
      'no', 'yes', 'see', 'can', 'big', 'red', 'mom', 'dad', 'cat', 'dog',
    ],
  },
  g1: {
    name: 'Grade 1 words',
    grade: 1,
    words: [
      'look', 'come', 'play', 'said', 'was', 'have', 'like', 'this', 'that', 'with',
      'what', 'when', 'where', 'who', 'they', 'them', 'there', 'here', 'out', 'down',
      'good', 'help', 'make', 'jump', 'run', 'ran', 'saw', 'want', 'went', 'from',
      'just', 'some', 'many', 'into', 'over',
    ],
  },
  g2: {
    name: 'Grade 2 words',
    grade: 2,
    words: [
      'because', 'before', 'after', 'around', 'always', 'never', 'again', 'every', 'people', 'friend',
      'school', 'water', 'would', 'could', 'should', 'which', 'their', 'these', 'those', 'other',
      'about', 'through', 'thought', 'found', 'right', 'write', 'first', 'second', 'better', 'together',
      'very', 'only', 'does', 'goes', 'done',
    ],
  },
  g3: {
    name: 'Grade 3 words',
    grade: 3,
    words: [
      'although', 'another', 'answer', 'enough', 'during', 'different', 'important', 'minute', 'hour', 'until',
      'while', 'either', 'neither', 'whole', 'heard', 'question', 'probably', 'believe', 'caught', 'brought',
      'measure', 'several', 'special', 'usually', 'almost', 'already', 'certain', 'country', 'beautiful', 'surprise',
      'straight', 'weight', 'favorite', 'library', 'family',
    ],
  },
};

export interface SpellingWord {
  word: string;
  sentence: string;
}

/** Sample spelling decks (original sentences). */
export const SAMPLE_SPELLING: Record<string, { name: string; grade: number; words: SpellingWord[] }> = {
  s1: {
    name: 'Sample list · Grade 1',
    grade: 1,
    words: [
      { word: 'cake', sentence: 'We shared a cake with pink frosting.' },
      { word: 'bike', sentence: 'My bike has a bell on the handle.' },
      { word: 'home', sentence: 'We walked home after the game.' },
      { word: 'tree', sentence: 'A bird built a nest in the tree.' },
      { word: 'fish', sentence: 'The fish swam in a circle.' },
      { word: 'ship', sentence: 'The ship sailed across the bay.' },
      { word: 'much', sentence: 'How much does the apple cost?' },
      { word: 'rain', sentence: 'The rain made puddles on the path.' },
      { word: 'play', sentence: 'Can you play outside after lunch?' },
      { word: 'blue', sentence: 'The sky is blue today.' },
    ],
  },
  s2: {
    name: 'Sample list · Grade 2',
    grade: 2,
    words: [
      { word: 'because', sentence: 'We stayed inside because it was raining.' },
      { word: 'friend', sentence: 'My friend saved me a seat on the bus.' },
      { word: 'people', sentence: 'Many people came to the park.' },
      { word: 'light', sentence: 'Please turn on the light.' },
      { word: 'night', sentence: 'The moon was bright last night.' },
      { word: 'stairs', sentence: 'The cat ran up the stairs.' },
      { word: 'water', sentence: 'Drink some water after you run.' },
      { word: 'story', sentence: 'Grandpa read us a funny story.' },
      { word: 'chair', sentence: 'Pull your chair up to the table.' },
      { word: 'jumped', sentence: 'The frog jumped into the pond.' },
      { word: 'happy', sentence: 'The puppy looked happy to see us.' },
      { word: 'window', sentence: 'Snow piled up against the window.' },
    ],
  },
  s3: {
    name: 'Sample list · Grade 3',
    grade: 3,
    words: [
      { word: 'caught', sentence: 'She caught the ball with one hand.' },
      { word: 'thought', sentence: 'I thought the movie was too short.' },
      { word: 'different', sentence: 'Each leaf is a different color.' },
      { word: 'answer', sentence: 'Raise your hand to answer the question.' },
      { word: 'enough', sentence: 'Is there enough soup for everyone?' },
      { word: 'favorite', sentence: 'Pizza is my favorite dinner.' },
      { word: 'library', sentence: 'We borrowed three books from the library.' },
      { word: 'surprise', sentence: 'The party was a big surprise.' },
      { word: 'important', sentence: 'It is important to wash your hands.' },
      { word: 'beautiful', sentence: 'The garden looks beautiful in spring.' },
      { word: 'knowledge', sentence: 'Reading every day builds knowledge.' },
      { word: 'measure', sentence: 'Use a ruler to measure the line.' },
      { word: 'straight', sentence: 'Draw a straight line across the page.' },
      { word: 'weight', sentence: 'The nurse checked my weight and height.' },
      { word: 'happiness', sentence: 'The new puppy brought us happiness.' },
    ],
  },
};
