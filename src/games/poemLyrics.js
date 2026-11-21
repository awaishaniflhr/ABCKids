// Sing-along lyrics with the time (in seconds) each line starts in the app's
// recordings. Times were measured from the recordings with speech
// recognition, then rounded. To fine-tune a song, nudge a verse's start time.

// Builds timed lines for one verse: `start` is when the verse begins and each
// line is [secondsAfterStart, text].
function verse(start, lines) {
  return lines.map(([offset, text]) => ({
    at: Math.round((start + offset) * 10) / 10,
    text,
  }));
}

const ABC = [
  [0, 'A B C D E F G'],
  [4.4, 'H I J K L M N O P'],
  [8.9, 'Q R S, T U V'],
  [14, 'W X, Y and Z'],
  [18.2, 'Now I know my A B Cs'],
  [21, 'Next time won’t you sing with me?'],
];

const TWINKLE = [
  [0, 'Twinkle, twinkle, little star,'],
  [3, 'How I wonder what you are!'],
  [8.9, 'Up above the world so high,'],
  [12.7, 'Like a diamond in the sky.'],
  [18.7, 'Twinkle, twinkle, little star,'],
  [23.8, 'How I wonder what you are!'],
];

const BAA_BAA = [
  'Baa, baa, black sheep,',
  'Have you any wool?',
  'Yes sir, yes sir,',
  'Three bags full!',
  'One for the master,',
  'One for the dame,',
  'And one for the little boy',
  'Who lives down the lane.',
];
// Pairs each lyric line with the time it starts.
const timed = (texts, times) =>
  texts.map((text, index) => ({ at: times[index], text }));

const FISH = [
  [0, 'One, two, three, four, five,'],
  [3, 'Once I caught a fish alive,'],
  [6, 'Six, seven, eight, nine, ten,'],
  [9, 'Then I let it go again.'],
  [12, 'Why did you let it go?'],
  [15, 'Because it bit my finger so.'],
  [18, 'Which finger did it bite?'],
  [21, 'This little finger on my right!'],
];

// One "Wheels on the Bus" verse, e.g. busVerse('wipers', 'go', 'swish, swish, swish').
const busVerse = (thing, verb, sound) => [
  `The ${thing} on the bus ${verb} ${sound},`,
  `${sound[0].toUpperCase()}${sound.slice(1)}, ${sound}.`,
  `The ${thing} on the bus ${verb} ${sound},`,
  'All day long!',
];

// One "Down at the Station" verse.
const stationVerse = (place, things, driver, sound) => [
  `Down at the ${place}, early in the morning,`,
  `See all the ${things} standing in a row.`,
  `See the ${driver} start up the engine,`,
  `${sound} And off we go!`,
];

// One "This Old Man" (Nick Nack Paddy Whack) verse.
const oldManVerse = (number, place) => [
  [0, `This old man, he played ${number},`],
  [2.5, `He played knick-knack ${place};`],
  [4.8, 'With a knick-knack paddywhack, give a dog a bone,'],
  [7.3, 'This old man came rolling home.'],
];
const OLD_MAN = [
  [1.5, 'one', 'on my thumb'],
  [11.9, 'two', 'on my shoe'],
  [21.3, 'three', 'on my knee'],
  [30.5, 'four', 'on my door'],
  [39.5, 'five', 'on my hive'],
  [58.5, 'six', 'on my sticks'],
  [67.8, 'seven', 'up in heaven'],
  [81, 'eight', 'on my gate'],
  [90, 'nine', 'on my spine'],
  [99.3, 'ten', 'on my hen'],
];

// One "The Big Ship Sails" verse: [first line, repeated phrase].
const shipVerse = (first, repeat) => [
  [0, first],
  [3, `${repeat}, ${repeat.toLowerCase()};`],
  [6, first],
  [9, 'On the last day of September.'],
];
const SHIP_SAILS = shipVerse(
  'The big ship sails on the alley-alley-oh,',
  'The alley-alley-oh',
);

export const POEM_LYRICS = {
  1: [
    ...verse(20.8, ABC),
    ...verse(56.6, ABC),
    ...verse(94.2, ABC),
    ...verse(122.1, [
      [0, 'Now I know my A B Cs'],
      [3, 'Next time won’t you sing with me?'],
    ]),
  ],
  2: [...verse(26.8, TWINKLE), ...verse(92.3, TWINKLE)],
  3: [
    ...timed(BAA_BAA, [20.8, 23.8, 26.8, 28.3, 29.8, 32.8, 35.7, 37.5]),
    ...timed(BAA_BAA, [46.5, 48.5, 50.6, 52.5, 55.5, 57.5, 59.5, 61.5]),
  ],
  4: [...verse(14.9, FISH), ...verse(65.5, FISH), ...verse(113.2, FISH)],
  5: [
    ...timed(busVerse('wheels', 'go', 'round and round'), [6, 8.9, 11.9, 14.9]),
    ...timed(
      busVerse('bell', 'goes', 'ding, ding, ding'),
      [20.8, 23.8, 26.8, 29.8],
    ),
    ...timed(
      busVerse('horn', 'goes', 'beep, beep, beep'),
      [35.7, 38.7, 41.7, 44.7],
    ),
    ...timed(
      busVerse('wipers', 'go', 'swish, swish, swish'),
      [79.4, 82.4, 85.4, 88.4],
    ),
    ...timed(busVerse('people', 'go', 'up and down'), [93.8, 96.8, 99.8, 103]),
    ...timed(
      busVerse('wheels', 'go', 'round and round'),
      [106.2, 109.2, 112.2, 115.5],
    ),
    ...timed(
      ['The wheels on the bus go round and round,', 'All day long!'],
      [119.1, 122.1],
    ),
  ],
  6: [
    ...timed(
      [
        'Down at the station, early in the morning,',
        'See the little puffer trains all in a row.',
        'See the engine driver pull the little handle,',
        'Choo! Choo! Choo! And off we go!',
      ],
      [11.9, 14.9, 19.5, 23.8],
    ),
    ...timed(
      stationVerse('airport', 'airplanes', 'pilot', 'Zoom! Zoom! Zoom!'),
      [32.8, 35.7, 38.7, 42.5],
    ),
    ...timed(
      stationVerse('taxi rank', 'taxis', 'taxi driver', 'Vroom! Vroom! Vroom!'),
      [71.5, 75.5, 80.4, 83.4],
    ),
    ...timed(
      stationVerse('harbour', 'big boats', 'captain', 'Toot! Toot! Toot!'),
      [92.3, 96, 99.8, 103],
    ),
  ],
  7: OLD_MAN.flatMap(([start, number, place]) =>
    verse(start, oldManVerse(number, place)),
  ),
  8: [
    ...verse(6, SHIP_SAILS),
    ...verse(
      23.8,
      shipVerse(
        'The captain said, “It will never, never do,”',
        'Never, never do',
      ),
    ),
    ...verse(
      47.6,
      shipVerse(
        'The big ship sank to the bottom of the sea,',
        'The bottom of the sea',
      ),
    ),
    ...verse(
      65.5,
      shipVerse(
        'We all dip our heads in the deep blue sea,',
        'The deep blue sea',
      ),
    ),
    ...verse(78, SHIP_SAILS),
  ],
};

// Index of the line being sung at `time`, or -1 before the singing starts.
export function activeLine(lines, time) {
  let found = -1;
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].at <= time) found = index;
    else break;
  }
  return found;
}

// Index of the word being sung in that line. Words are spread across the
// line's time (most of the gap until the next line), so the highlight walks
// along the line in step with the singer.
export function activeWord(lines, lineIndex, time, duration = 0) {
  if (lineIndex < 0 || lineIndex >= lines.length) return -1;
  const line = lines[lineIndex];
  const words = line.text.split(' ').length;
  const nextAt =
    lines[lineIndex + 1]?.at ?? Math.min(duration || line.at + 4, line.at + 4);
  const span = Math.max(0.6, (nextAt - line.at) * 0.85);
  const progress = (time - line.at) / span;
  return Math.max(0, Math.min(words - 1, Math.floor(progress * words)));
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
