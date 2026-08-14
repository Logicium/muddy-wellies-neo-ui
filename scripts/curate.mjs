// One-shot curation pass: applies eyeballed categories + alt text to the
// generated manifest, keyed by the photo's 3-digit prefix. Safe to rerun.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MANIFEST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'photos.ts',
)

// vows: weddings, elopements, couples · folks: portraits, people
// branding: businesses, craft, food · wild: ranch, rodeo, horses, land
// wander: journal, travel, atmosphere
const MAP = {
  '003': ['wild', 'Saddle up in the barn'],
  '004': ['wild', 'Splashing through the shallows'],
  '005': ['folks', 'Cowgirl and her horse'],
  '006': ['wild', 'Crossing the creek on horseback'],
  '007': ['folks', 'Silhouette in the barn door'],
  '008': ['folks', 'Last light vows at the lake'],
  '009': ['wild', 'Behind the rodeo chutes'],
  '010': ['folks', 'At-home session, mid laugh'],
  '011': ['folks', 'Red boots at the bar'],
  '012': ['folks', 'Portrait in low light'],
  '013': ['branding', 'Pie and coffee at the diner'],
  '014': ['folks', 'Wading in, dress and all'],
  '015': ['folks', 'Floating portrait'],
  '016': ['folks', 'Portrait in the dunes'],
  '017': ['folks', 'White dress on the dunes'],
  '018': ['wander', 'Smoke over the campfire'],
  '019': ['folks', 'Cowboy and his dog at the cabin'],
  '020': ['wild', 'Horses on the sand'],
  '021': ['folks', 'Bride in the ruins'],
  '022': ['folks', 'Backpacks and a kiss in the meadow'],
  '023': ['wild', 'Moving the herd'],
  '024': ['folks', 'Bouquet under a felt hat'],
  '025': ['wild', 'Pink shirt, dusty arena'],
  '026': ['folks', 'Cake and the girls'],
  '027': ['folks', 'Three generations, one hug'],
  '028': ['folks', 'Porch light portrait'],
  '029': ['branding', 'The pour'],
  '030': ['branding', 'House bar, local dog'],
  '031': ['branding', 'Dinosaur painting in progress'],
  '032': ['branding', 'At the saddlery'],
  '033': ['folks', 'Pizza, but make it bridal'],
  '034': ['folks', 'Through the veil'],
  '035': ['wild', 'Rope out over the herd'],
  '036': ['folks', 'Wildflower elopement'],
  '037': ['folks', 'Hat to hat'],
  '038': ['wild', 'Neck and neck in the arena'],
  '039': ['folks', 'Tattoos and tulle'],
  '040': ['folks', 'Getting ready, heels first'],
  '041': ['wander', 'Climber at sundown'],
  '042': ['folks', 'Carried across the creek, dog supervising'],
  '043': ['folks', 'Boots under the dress'],
  '044': ['wild', 'Bronc at the rails'],
  '045': ['wander', 'Roped into the redrock'],
  '046': ['folks', 'Snowy engagement'],
  '047': ['folks', 'The quiet hold'],
  '048': ['folks', 'The yes, on one knee'],
  '049': ['folks', 'Two hats on the open plain'],
  '050': ['folks', 'Wind, white dress, wild horses'],
  '051': ['folks', 'Just married in the redrocks'],
  '052': ['wander', 'Crowd surfing the encore'],
  '053': ['folks', 'Lamp-lit slow dance'],
  '054': ['folks', 'Upside down in tulle'],
  '055': ['folks', 'The bouquet, held close'],
  '056': ['folks', 'First look flowers'],
  '057': ['wander', 'Whiskey and a quiet booth'],
  '058': ['folks', 'Between the lamps'],
  '059': ['folks', 'Disco ball elopement'],
  '060': ['branding', 'Coffee in hand'],
  '061': ['folks', 'Winter light through the pines'],
  '062': ['branding', 'Hands at work in the kitchen'],
  '063': ['folks', 'Turquoise and a straw brim'],
  '064': ['wander', 'The strange table'],
  '065': ['branding', 'The workshop regulars'],
  '066': ['wander', 'Cave mouth silhouettes'],
  '067': ['branding', 'The antler bench'],
  '068': ['folks', 'Mid-laugh in magenta'],
  '069': ['folks', 'Lakeshore ceremony'],
  '070': ['folks', 'Golden hour cowboy'],
  '071': ['folks', 'Boots on the bumper'],
  '072': ['folks', 'Ashley, a lamb, and a camera'],
  '073': ['wander', 'Train table for two'],
  '074': ['wander', 'Trench coat by the window'],
  '075': ['wander', 'Taped hands, lit cigarette'],
  '076': ['wild', 'Resting on the saddle pile'],
  '077': ['wander', 'Peter Rabbit, on loan'],
  '078': ['folks', 'UFO mug, lunch break'],
}

let src = await readFile(MANIFEST, 'utf8')
let applied = 0
for (const [prefix, [category, alt]] of Object.entries(MAP)) {
  const re = new RegExp(`(\\{ id: '${prefix}-[^']*'[^\\n]*category: ')[a-z]+(', alt: )"[^"]*"`)
  const next = src.replace(re, `$1${category}$2${JSON.stringify(alt)}`)
  if (next !== src) applied++
  src = next
}
await writeFile(MANIFEST, src)
console.log(`curated ${applied} entries`)
