// Each region is closed. The same geometry draws the outline and receives taps,
// so colors cannot escape into another region or the page background.
const path = (id, label, d) => ({ id, label, type: 'path', props: { d } });
const circle = (id, label, cx, cy, r) => ({
  id,
  label,
  type: 'circle',
  props: { cx, cy, r },
});
const ellipse = (id, label, cx, cy, rx, ry) => ({
  id,
  label,
  type: 'ellipse',
  props: { cx, cy, rx, ry },
});
const detail = d => ({ type: 'path', props: { d, fill: 'none' } });
const dot = (cx, cy, r = 5) => ({
  type: 'circle',
  props: { cx, cy, r, fill: '#263b50', strokeWidth: 0 },
});

export const COLORING_PALETTE = [
  { name: 'Red', value: '#EF5350' },
  { name: 'Orange', value: '#FF963F' },
  { name: 'Yellow', value: '#FFD54F' },
  { name: 'Green', value: '#66BB6A' },
  { name: 'Teal', value: '#26BBAE' },
  { name: 'Blue', value: '#42A5F5' },
  { name: 'Purple', value: '#AB7BE0' },
  { name: 'Pink', value: '#F48FB1' },
  { name: 'Brown', value: '#B58463' },
  { name: 'Navy', value: '#465B83' },
];

export const COLORING_TEMPLATES = [
  {
    id: 'fish',
    name: 'Fish',
    subtitle: 'An ocean of colours',
    accent: '#53BFCB',
    tint: '#E5F9F8',
    regions: [
      path('top-fin', 'Top fin', 'M139 145 Q155 62 250 88 L270 154 Z'),
      path('bottom-fin', 'Bottom fin', 'M157 244 Q172 322 237 292 L257 243 Z'),
      path(
        'tail',
        'Tail fin',
        'M295 184 Q332 123 367 132 Q342 197 367 263 Q327 268 293 220 Z',
      ),
      path(
        'body',
        'Body',
        'M116 134 Q153 120 193 127 Q238 194 193 273 Q153 277 116 261 Q150 202 116 134 Z',
      ),
      path(
        'rear-body',
        'Tail-side body',
        'M230 132 Q286 148 310 200 Q283 248 230 266 Q278 199 230 132 Z',
      ),
      path(
        'head',
        'Head',
        'M43 200 Q69 148 116 134 Q150 202 116 261 Q68 243 43 200 Z',
      ),
      path(
        'stripe',
        'Body stripe',
        'M193 127 Q238 194 193 273 L230 266 Q278 199 230 132 Z',
      ),
      path(
        'side-fin',
        'Side fin',
        'M155 209 Q177 174 208 180 Q200 227 172 239 Z',
      ),
      circle('eye', 'Eye', 94, 187, 19),
      circle('bubble-one', 'Big bubble', 65, 86, 18),
      circle('bubble-two', 'Small bubble', 38, 122, 10),
    ],
    details: [
      dot(98, 187, 7),
      detail(
        'M65 221 Q82 231 94 218 M169 215 L190 194 M167 132 L183 104 M323 191 L346 160 M324 210 L345 240',
      ),
    ],
  },
  {
    id: 'cat',
    name: 'Cat',
    subtitle: 'A purr-fect little friend',
    accent: '#C195E7',
    tint: '#F5EDFC',
    regions: [
      path(
        'tail',
        'Curly tail',
        'M267 291 Q353 328 332 226 Q325 209 312 222 Q321 283 281 266 Z',
      ),
      ellipse('body', 'Body', 198, 271, 85, 78),
      path(
        'left-ear',
        'Left ear',
        'M113 153 L105 61 Q108 48 124 58 L173 109 Z',
      ),
      path(
        'right-ear',
        'Right ear',
        'M224 106 L278 56 Q291 48 291 66 L284 155 Z',
      ),
      path('left-inner-ear', 'Left inner ear', 'M122 115 L118 77 L151 104 Z'),
      path('right-inner-ear', 'Right inner ear', 'M247 106 L279 77 L277 118 Z'),
      path(
        'head',
        'Face',
        'M108 156 Q108 101 199 104 Q290 102 290 164 Q290 224 199 230 Q107 224 108 156 Z',
      ),
      ellipse('tummy', 'Tummy', 198, 276, 43, 48),
      ellipse('left-paw', 'Left paw', 150, 331, 34, 22),
      ellipse('right-paw', 'Right paw', 246, 331, 34, 22),
      path(
        'bow-left',
        'Left bow',
        'M189 234 Q150 202 157 248 Q162 266 190 245 Z',
      ),
      path(
        'bow-right',
        'Right bow',
        'M207 234 Q245 202 239 248 Q234 266 207 245 Z',
      ),
      circle('bow-knot', 'Bow centre', 198, 238, 11),
      path('nose', 'Nose', 'M187 175 Q198 169 210 175 L199 186 Z'),
    ],
    details: [
      dot(161, 161, 7),
      dot(237, 161, 7),
      detail(
        'M199 186 L199 194 Q184 207 177 193 M199 194 Q214 207 221 193 M138 181 L91 170 M138 193 L88 197 M260 181 L307 170 M261 193 L310 197 M138 331 L138 342 M153 332 L153 345 M235 332 L235 345 M250 331 L250 342',
      ),
    ],
  },
  {
    id: 'car',
    name: 'Car',
    subtitle: 'Ready, set, rainbow!',
    accent: '#F5AD50',
    tint: '#FFF2DC',
    regions: [
      path(
        'body',
        'Car body',
        'M43 211 L87 194 L125 117 Q132 102 151 102 L251 102 Q269 103 280 121 L321 192 L357 207 Q369 212 369 231 L369 277 L32 277 L32 235 Q32 218 43 211 Z',
      ),
      path(
        'left-door',
        'Left door',
        'M137 121 L193 121 L193 263 L101 263 L101 199 Z',
      ),
      path(
        'right-door',
        'Right door',
        'M209 121 L249 121 Q255 121 261 131 L297 197 L297 263 L209 263 Z',
      ),
      path(
        'left-window',
        'Left window',
        'M145 132 L181 132 L181 190 L119 190 Z',
      ),
      path(
        'right-window',
        'Right window',
        'M220 132 L247 132 L280 190 L220 190 Z',
      ),
      circle('left-tyre', 'Left tyre', 99, 278, 43),
      circle('right-tyre', 'Right tyre', 302, 278, 43),
      circle('left-hub', 'Left wheel centre', 99, 278, 23),
      circle('right-hub', 'Right wheel centre', 302, 278, 23),
      path('headlight', 'Headlight', 'M339 211 L367 223 L367 242 L338 242 Z'),
      path('rear-light', 'Rear light', 'M33 228 L54 222 L54 245 L32 245 Z'),
      path(
        'left-handle',
        'Left door handle',
        'M162 212 L181 212 L181 223 L162 223 Z',
      ),
      path(
        'right-handle',
        'Right door handle',
        'M220 212 L239 212 L239 223 L220 223 Z',
      ),
    ],
    details: [detail('M66 345 L147 345 M173 345 L329 345')],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    subtitle: 'Let your colours fly',
    accent: '#EE8FB5',
    tint: '#FFF0F6',
    regions: [
      path(
        'lower-left-wing',
        'Lower left wing',
        'M190 230 Q105 183 77 266 Q50 346 130 338 Q173 333 190 273 Z',
      ),
      path(
        'lower-right-wing',
        'Lower right wing',
        'M210 230 Q295 183 323 266 Q350 346 270 338 Q227 333 210 273 Z',
      ),
      path(
        'upper-left-wing',
        'Upper left wing',
        'M185 178 Q126 54 64 80 Q17 106 60 190 Q102 263 187 229 Z',
      ),
      path(
        'upper-right-wing',
        'Upper right wing',
        'M215 178 Q274 54 336 80 Q383 106 340 190 Q298 263 213 229 Z',
      ),
      ellipse('left-wing-spot', 'Upper left wing spot', 102, 148, 27, 35),
      ellipse('right-wing-spot', 'Upper right wing spot', 298, 148, 27, 35),
      circle('lower-left-spot', 'Lower left wing spot', 120, 285, 19),
      circle('lower-right-spot', 'Lower right wing spot', 280, 285, 19),
      ellipse('body', 'Body', 200, 249, 23, 68),
      ellipse('body-patch', 'Body patch', 200, 260, 22, 19),
      circle('head', 'Face', 200, 168, 35),
      circle('left-antenna', 'Left antenna tip', 166, 98, 9),
      circle('right-antenna', 'Right antenna tip', 234, 98, 9),
    ],
    details: [
      detail(
        'M183 137 Q182 113 166 107 M217 137 Q218 113 234 107 M189 180 Q200 192 211 180',
      ),
      dot(188, 162, 4),
      dot(212, 162, 4),
    ],
  },
  {
    id: 'dog',
    name: 'Dog',
    subtitle: 'Meet your colourful puppy',
    accent: '#7CBF90',
    tint: '#EAF8EE',
    regions: [
      path(
        'tail',
        'Tail',
        'M273 283 Q322 290 330 239 Q333 224 345 237 Q362 289 291 313 Z',
      ),
      ellipse('body', 'Body', 202, 269, 78, 76),
      ellipse('tummy', 'Tummy', 202, 283, 40, 47),
      ellipse('left-paw', 'Left paw', 152, 335, 34, 21),
      ellipse('right-paw', 'Right paw', 254, 335, 34, 21),
      path(
        'left-ear',
        'Left floppy ear',
        'M138 101 Q83 87 86 155 Q86 221 117 218 Q141 215 152 153 Z',
      ),
      path(
        'right-ear',
        'Right floppy ear',
        'M265 101 Q320 87 317 155 Q317 221 286 218 Q262 215 251 153 Z',
      ),
      path(
        'head',
        'Face',
        'M123 135 Q119 78 202 78 Q285 78 281 143 L273 192 Q259 231 202 231 Q142 231 130 193 Z',
      ),
      ellipse('eye-patch', 'Eye patch', 244, 145, 24, 30),
      ellipse('muzzle', 'Muzzle', 202, 190, 43, 28),
      path('tongue', 'Tongue', 'M192 205 L212 205 L212 223 Q202 237 192 223 Z'),
      path(
        'nose',
        'Nose',
        'M188 176 Q202 169 216 176 Q212 192 202 192 Q192 192 188 176 Z',
      ),
      path(
        'collar',
        'Collar',
        'M149 218 Q202 243 256 218 L253 236 Q202 258 152 236 Z',
      ),
      circle('tag', 'Collar tag', 202, 250, 12),
    ],
    details: [
      dot(163, 147, 6),
      dot(242, 147, 6),
      detail(
        'M202 192 L202 201 M181 199 Q188 207 202 201 Q216 207 223 199 M141 335 L141 346 M156 336 L156 348 M243 336 L243 348 M258 335 L258 346',
      ),
    ],
  },
  {
    id: 'ball',
    name: 'Ball',
    subtitle: 'A whole world of colour',
    accent: '#6AAAE5',
    tint: '#EBF5FF',
    regions: [
      path(
        'top-right-panel',
        'Top right panel',
        'M200 136 L200 40 A160 160 0 0 1 352.17 150.56 L260.87 180.22 Z',
      ),
      path(
        'right-panel',
        'Right panel',
        'M260.87 180.22 L352.17 150.56 A160 160 0 0 1 294.05 329.44 L237.62 251.78 Z',
      ),
      path(
        'bottom-panel',
        'Bottom panel',
        'M237.62 251.78 L294.05 329.44 A160 160 0 0 1 105.95 329.44 L162.38 251.78 Z',
      ),
      path(
        'left-panel',
        'Left panel',
        'M162.38 251.78 L105.95 329.44 A160 160 0 0 1 47.83 150.56 L139.13 180.22 Z',
      ),
      path(
        'top-left-panel',
        'Top left panel',
        'M139.13 180.22 L47.83 150.56 A160 160 0 0 1 200 40 L200 136 Z',
      ),
      path(
        'centre-panel',
        'Centre panel',
        'M200 136 L260.87 180.22 L237.62 251.78 L162.38 251.78 L139.13 180.22 Z',
      ),
    ],
    details: [],
  },
];

export function getColoringTemplate(id) {
  // Accept links from the previous picker (including its ButterFly spelling).
  return (
    COLORING_TEMPLATES.find(item => item.id === String(id).toLowerCase()) ||
    COLORING_TEMPLATES[0]
  );
}
