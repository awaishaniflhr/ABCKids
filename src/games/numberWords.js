import { COUNTING } from './learningData';

// Word and cartoon picture for every number in Number Tracing. 1-10 come from
// the counting data; 11-20 are pictures made by joining those same cartoon
// digits (src/assets/numbers).
const TEENS = [
  [11, 'Eleven', require('../assets/numbers/11.png')],
  [12, 'Twelve', require('../assets/numbers/12.png')],
  [13, 'Thirteen', require('../assets/numbers/13.png')],
  [14, 'Fourteen', require('../assets/numbers/14.png')],
  [15, 'Fifteen', require('../assets/numbers/15.png')],
  [16, 'Sixteen', require('../assets/numbers/16.png')],
  [17, 'Seventeen', require('../assets/numbers/17.png')],
  [18, 'Eighteen', require('../assets/numbers/18.png')],
  [19, 'Nineteen', require('../assets/numbers/19.png')],
  [20, 'Twenty', require('../assets/numbers/20.png')],
];

const NUMBERS = [
  ...COUNTING.map(item => ({
    number: item.count,
    word: item.numbers,
    image: item.imgf,
  })),
  ...TEENS.map(([number, word, image]) => ({ number, word, image })),
];

export function numberWord(number) {
  return NUMBERS.find(item => String(item.number) === String(number));
}
