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
  {
    id: 'flower',
    name: 'Flower',
    subtitle: 'Grow a rainbow garden',
    accent: '#E982AC',
    tint: '#FFF0F6',
    regions: [
      path('stem', 'Stem', 'M192 153 L208 153 L208 274 L192 274 Z'),
      path(
        'left-leaf',
        'Left leaf',
        'M194 236 Q126 242 115 188 Q172 176 194 236 Z',
      ),
      path(
        'right-leaf',
        'Right leaf',
        'M205 221 Q226 164 285 181 Q273 231 205 221 Z',
      ),
      path(
        'pot',
        'Flower pot',
        'M136 274 L264 274 L246 359 Q200 377 154 359 Z',
      ),
      path('pot-rim', 'Pot rim', 'M128 258 L272 258 L272 285 L128 285 Z'),
      path(
        'pot-heart',
        'Heart on the pot',
        'M200 339 L181 321 Q166 303 181 299 Q194 295 200 307 Q206 295 219 299 Q234 303 219 321 Z',
      ),
      path('top-petal', 'Top petal', 'M181 99 Q158 35 200 33 Q242 35 219 99 Z'),
      path(
        'upper-right-petal',
        'Upper right petal',
        'M219 99 Q230 47 264 59 Q295 76 234 123 Z',
      ),
      path(
        'right-petal',
        'Right petal',
        'M230 105 Q296 79 302 122 Q299 161 230 140 Z',
      ),
      path(
        'lower-right-petal',
        'Lower right petal',
        'M229 139 Q292 166 263 190 Q229 203 211 151 Z',
      ),
      path(
        'bottom-petal',
        'Bottom petal',
        'M217 148 Q244 211 200 213 Q158 211 183 148 Z',
      ),
      path(
        'lower-left-petal',
        'Lower left petal',
        'M184 149 Q161 206 130 188 Q102 166 171 133 Z',
      ),
      path(
        'left-petal',
        'Left petal',
        'M170 139 Q104 162 99 122 Q102 82 172 105 Z',
      ),
      path(
        'upper-left-petal',
        'Upper left petal',
        'M170 123 Q105 82 136 59 Q170 45 181 99 Z',
      ),
      circle('centre', 'Flower centre', 200, 123, 34),
    ],
    details: [
      dot(188, 119, 4),
      dot(212, 119, 4),
      detail('M188 133 Q200 145 212 133'),
    ],
  },
  {
    id: 'house',
    name: 'House',
    subtitle: 'A happy home for colours',
    accent: '#E6A151',
    tint: '#FFF5E4',
    regions: [
      path('chimney', 'Chimney', 'M267 65 L301 65 L301 147 L267 147 Z'),
      path('chimney-cap', 'Chimney top', 'M260 52 L308 52 L308 72 L260 72 Z'),
      path('walls', 'House walls', 'M83 190 L317 190 L317 343 L83 343 Z'),
      path(
        'gable',
        'Wall under the roof',
        'M83 190 L83 183 L200 94 L317 183 L317 190 Z',
      ),
      path(
        'roof',
        'Roof',
        'M45 177 L188 67 Q200 58 212 67 L355 177 L337 198 L200 94 L63 198 Z',
      ),
      path(
        'door-frame',
        'Door frame',
        'M167 232 Q200 217 233 232 L233 343 L167 343 Z',
      ),
      path('door', 'Door', 'M178 241 Q200 231 222 241 L222 343 L178 343 Z'),
      circle('door-knob', 'Door knob', 208, 294, 6),
      path(
        'left-window-frame',
        'Left window frame',
        'M101 215 L153 215 L153 273 L101 273 Z',
      ),
      path(
        'left-window-top',
        'Left upper window pane',
        'M110 224 L144 224 L144 240 L110 240 Z',
      ),
      path(
        'left-window-bottom',
        'Left lower window pane',
        'M110 248 L144 248 L144 264 L110 264 Z',
      ),
      path(
        'right-window-frame',
        'Right window frame',
        'M247 215 L299 215 L299 273 L247 273 Z',
      ),
      path(
        'right-window-top',
        'Right upper window pane',
        'M256 224 L290 224 L290 240 L256 240 Z',
      ),
      path(
        'right-window-bottom',
        'Right lower window pane',
        'M256 248 L290 248 L290 264 L256 264 Z',
      ),
      circle('attic-frame', 'Round attic window frame', 200, 159, 25),
      circle('attic-window', 'Round attic window', 200, 159, 15),
      path('step', 'Front doorstep', 'M157 343 L243 343 L251 361 L149 361 Z'),
    ],
    details: [],
  },
  {
    id: 'rocket',
    name: 'Rocket',
    subtitle: 'Blast off into colour',
    accent: '#8F8DE0',
    tint: '#F1F0FF',
    regions: [
      path(
        'flame',
        'Rocket flame',
        'M170 288 L230 288 L241 352 Q230 348 217 335 Q215 352 201 377 L185 333 Q179 346 158 352 Z',
      ),
      path(
        'left-fin',
        'Left rocket fin',
        'M148 203 Q110 214 101 288 L153 267 Z',
      ),
      path(
        'right-fin',
        'Right rocket fin',
        'M252 203 Q290 214 299 288 L247 267 Z',
      ),
      path(
        'body',
        'Rocket body',
        'M200 40 Q256 87 258 158 L250 282 L150 282 L142 158 Q144 89 200 40 Z',
      ),
      path(
        'nose',
        'Rocket nose',
        'M200 40 Q231 66 247 97 L153 97 Q169 64 200 40 Z',
      ),
      path(
        'booster',
        'Rocket booster',
        'M150 264 L250 264 L245 291 Q200 306 155 291 Z',
      ),
      circle('window-frame', 'Window frame', 200, 171, 42),
      circle('window', 'Space window', 200, 171, 29),
      path(
        'badge',
        'Rocket star',
        'M200 223 L205 234 L218 234 L208 242 L212 255 L200 247 L188 255 L192 242 L182 234 L195 234 Z',
      ),
    ],
    details: [detail('M186 161 Q190 153 198 151')],
  },
  {
    id: 'turtle',
    name: 'Turtle',
    subtitle: 'A little shell of surprises',
    accent: '#69B89D',
    tint: '#EAF9F0',
    regions: [
      path('tail', 'Tail', 'M310 210 L362 185 Q370 190 364 201 L313 240 Z'),
      path(
        'front-top-flipper',
        'Front upper flipper',
        'M151 166 Q100 103 128 97 Q146 91 181 148 Z',
      ),
      path(
        'back-top-flipper',
        'Back upper flipper',
        'M267 160 Q303 92 327 111 Q343 132 299 184 Z',
      ),
      path(
        'front-bottom-flipper',
        'Front lower flipper',
        'M160 269 Q111 288 128 322 Q148 336 182 285 Z',
      ),
      path(
        'back-bottom-flipper',
        'Back lower flipper',
        'M266 281 Q316 339 334 315 Q346 294 296 263 Z',
      ),
      ellipse('head', 'Face', 81, 202, 46, 40),
      path(
        'shell-top',
        'Top shell panel',
        'M197 180 L173 143 Q215 119 262 140 L236 178 Z',
      ),
      path(
        'shell-upper-right',
        'Upper back shell panel',
        'M236 178 L262 140 Q311 160 324 200 L260 208 Z',
      ),
      path(
        'shell-lower-right',
        'Lower back shell panel',
        'M260 208 L324 200 Q330 255 280 283 L247 243 Z',
      ),
      path(
        'shell-bottom',
        'Bottom shell panel',
        'M247 243 L280 283 Q232 311 178 290 L207 252 Z',
      ),
      path(
        'shell-lower-left',
        'Lower front shell panel',
        'M207 252 L178 290 Q129 270 120 226 L180 221 Z',
      ),
      path(
        'shell-upper-left',
        'Upper front shell panel',
        'M180 221 L120 226 Q114 178 173 143 L197 180 Z',
      ),
      path(
        'shell-centre',
        'Centre shell panel',
        'M197 180 L236 178 L260 208 L247 243 L207 252 L180 221 Z',
      ),
      circle('eye', 'Eye', 67, 191, 9),
    ],
    details: [
      dot(65, 190, 4),
      dot(43, 205, 2.5),
      detail('M52 217 Q65 228 78 217'),
    ],
  },
  {
    id: 'sailboat',
    name: 'Sailboat',
    subtitle: 'Sail away on a rainbow',
    accent: '#64AFE0',
    tint: '#ECF7FF',
    regions: [
      path('mast', 'Mast', 'M196 61 L207 61 L207 261 L196 261 Z'),
      path('flag', 'Flag', 'M207 62 L270 73 L207 94 Z'),
      path(
        'left-sail-bottom',
        'Lower left sail',
        'M122 167 L183 167 L183 245 L57 245 Z',
      ),
      path(
        'left-sail-stripe',
        'Left sail stripe',
        'M147 137 L183 137 L183 167 L122 167 Z',
      ),
      path('left-sail-top', 'Upper left sail', 'M183 94 L183 137 L147 137 Z'),
      path(
        'right-sail-top',
        'Upper right sail',
        'M220 112 Q263 142 295 185 L220 185 Z',
      ),
      path(
        'right-sail-stripe',
        'Right sail stripe',
        'M220 185 L295 185 Q308 202 317 219 L220 219 Z',
      ),
      path(
        'right-sail-bottom',
        'Lower right sail',
        'M220 219 L317 219 Q328 234 335 245 L220 245 Z',
      ),
      path('hull', 'Boat hull', 'M54 280 L346 280 L321 317 Q200 348 79 317 Z'),
      path(
        'hull-band',
        'Top of the boat hull',
        'M42 261 L358 261 L346 280 L54 280 Z',
      ),
      circle('left-porthole', 'Left porthole', 130, 296, 12),
      circle('middle-porthole', 'Middle porthole', 200, 303, 12),
      circle('right-porthole', 'Right porthole', 270, 296, 12),
    ],
    details: [
      detail(
        'M43 358 Q63 344 83 358 Q103 372 123 358 M155 358 Q175 344 195 358 Q215 372 235 358 M267 358 Q287 344 307 358 Q327 372 347 358',
      ),
    ],
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    subtitle: 'Scoop up your favourite colours',
    accent: '#DB99CB',
    tint: '#FFF0FB',
    regions: [
      path('cone-tip', 'Cone tip', 'M176 319 L224 319 L200 378 Z'),
      path(
        'cone-middle',
        'Middle cone section',
        'M161 281 L239 281 L224 319 L176 319 Z',
      ),
      path(
        'cone-top',
        'Upper cone section',
        'M146 243 L254 243 L239 281 L161 281 Z',
      ),
      path('cone-rim', 'Cone rim', 'M137 219 L263 219 L254 243 L146 243 Z'),
      circle('left-scoop', 'Left ice cream scoop', 155, 205, 48),
      circle('right-scoop', 'Right ice cream scoop', 245, 205, 48),
      circle('top-scoop', 'Top ice cream scoop', 200, 136, 55),
      circle('cherry', 'Cherry', 200, 65, 17),
      path(
        'top-sprinkle',
        'Top scoop sprinkle',
        'M167 111 Q164 107 168 104 Q172 101 175 105 L182 113 Q185 117 181 120 Q177 123 174 119 Z',
      ),
      ellipse('left-sprinkle', 'Left scoop sprinkle', 142, 203, 5, 12),
      circle('right-sprinkle', 'Right scoop sprinkle', 256, 205, 7),
    ],
    details: [
      detail('M200 48 Q207 26 223 28 M187 146 Q200 159 213 146'),
      dot(184, 133, 4),
      dot(216, 133, 4),
    ],
  },
];

export function getColoringTemplate(id) {
  // Accept links from the previous picker (including its ButterFly spelling).
  return (
    COLORING_TEMPLATES.find(item => item.id === String(id).toLowerCase()) ||
    COLORING_TEMPLATES[0]
  );
}
