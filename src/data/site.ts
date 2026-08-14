import { reactive } from 'vue'

export interface NavLink {
  label: string
  to: string
}

export interface Addon {
  label: string
  price: number
  note?: string
}

/** One arrangement of photographs inside a tier's band. */
export interface PlateSet {
  /** frames laid edge to edge across the band */
  mains: string[]
  /** a small frame laid over the mains, used by the 'inset' composition */
  inset?: string
}

/**
 * How a tier's band is composed. Photographs always run as shot — the art
 * direction is the arrangement, never a filter over her work.
 *  - inset:    a spread with a small detail frame laid into it, and several
 *              sets you can page through
 *  - register: a standing frame, a wide frame, a standing frame — a measured
 *              row that reads across like a proof sheet
 *  - serial:   a run of four portraits, shoulder to shoulder
 */
export type TierComposition = 'inset' | 'register' | 'serial'

export interface PricingTier {
  slug: string
  title: string
  from: number
  blurb: string
  included: string[]
  addons: Addon[]
  composition: TierComposition
  /**
   * Bands run the full viewport width, and each frame's width comes from its
   * own aspect ratio — so a band's height is `viewportWidth / sum(ratios)`.
   * Every set below is curated to sum to ~2.9, which keeps the bands around
   * half a screen tall rather than overflowing it.
   */
  sets: PlateSet[]
}

export interface JournalBlock {
  type: 'text' | 'image' | 'spread'
  text?: string
  photoIds?: string[]
}

export interface JournalPost {
  slug: string
  title: string
  date: string
  deck: string
  coverId: string
  blocks: JournalBlock[]
}

export const nav: NavLink[] = [
  { label: 'Work', to: '/work' },
  { label: 'Rates', to: '/rates' },
  { label: 'Journal', to: '/journal' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export const content = reactive({
  name: 'Muddy Wellies Photography',
  photographer: 'Ashley Montoya',
  location: 'Southern Colorado',
  instagram: 'https://www.instagram.com/muddywelliesphotography/',
  email: 'hello@muddywelliesphotography.com',

  home: {
    strap: 'Documentary photography, full of movement. Southern Colorado and anywhere the road goes.',
    tagline: 'Let’s document the grittiness that life has to offer.',
  },

  pricing: {
    intro:
      'No fine print, no fog. These are the real numbers. Pick a starting point, stack on what you want, and send it over. We figure out the rest together.',
    tiers: [
      {
        slug: 'campaign',
        title: 'The Campaign',
        from: 2800,
        blurb:
          'The whole story, stills and motion. A day embedded with your brand, your ranch, your beautiful chaos. One shoot, a season of content.',
        included: [
          'Up to a full day of coverage',
          'Photo and video, one storyteller for both',
          'Edited highlight film',
          'No limit on photos given',
          'Drone, weather pending',
          'Game planning call',
          '3 week turnaround',
        ],
        addons: [
          { label: 'Second shooter', price: 700 },
          { label: 'Social cutdowns', price: 350, note: '3 vertical edits' },
          { label: '48 hour rush', price: 400 },
          { label: 'Extra hour', price: 250 },
          { label: 'Polaroid', price: 125 },
        ],
        composition: 'inset',
        // three spreads to page through; each pair of landscapes sums to ~2.98
        // and carries a standing detail frame laid into it
        sets: [
          { mains: ['023-dsc-6642-1-2', '038-img-2715'], inset: '035-dsc-7022-1' },
          { mains: ['044-dsc-2399-1', '009-dsc-4183'], inset: '025-img-2718' },
          { mains: ['020-dsc-4960-2', '003-dsc-8066-1'], inset: '076-dsc-5719' },
        ],
      },
      {
        slug: 'branding',
        title: 'Branding',
        from: 650,
        blurb:
          'Small business owner shooting for small business owners. Your brand deserves better than stock photos of strangers shaking hands.',
        included: [
          'Minimum 2 hours',
          'No limit on photos given',
          'Drone, weather and location pending',
          'Game planning call',
          'Small content video',
        ],
        addons: [
          { label: 'Extra hour', price: 200 },
          { label: 'Additional content video', price: 300 },
        ],
        composition: 'register',
        // standing, wide, standing: 0.668 + 1.527 + 0.667 = 2.861
        sets: [{ mains: ['032-dsc-7014-1', '062-dsc-7028-1', '013-dsc-0101'] }],
      },
      {
        slug: 'portraits',
        title: 'Portraits',
        from: 350,
        blurb:
          'A classic national park, a UFO scene, a bowling alley. Send your session vibes and we wing it.',
        included: [
          '1 hour of photographs',
          'No limit on photos given',
          'Drone, weather pending',
          'Location scouting',
        ],
        addons: [
          { label: 'Polaroid', price: 125 },
          { label: 'Extra hour', price: 250 },
        ],
        composition: 'serial',
        // four portraits shoulder to shoulder — 0.668 + 0.833 + 0.668 + 0.668 = 2.835
        sets: [
          {
            mains: ['071-dsc-9676', '010-dsc-7552', '028-dsc-8602-1', '068-img-7310-2'],
          },
        ],
      },
    ] as PricingTier[],
  },

  about: {
    heading: 'Howdy, I’m Ashley.',
    portraitId: '072-img-7284',
    paragraphs: [
      'I’m a photographer in rural Southern Colorado. I wish I could say I have a niche, but at the end of the day I just like taking photographs of what inspires me, to retell a story.',
      'Muddy Wellies comes from my Scottish background. Being born in the Highlands gave me the roots of my wellies. Nothing like a jump in a muddy puddle to fill the soul.',
      'I’m a nurse by trade, and I know specializing is supposed to matter. I don’t have one and I’m proud of it. It doesn’t mean I won’t research, learn, study, and ask questions about your project. I just wanna shoot, so let’s go.',
      'What I love to capture is a documentary style shoot that’s full of movement. I love meeting folks and making their ideas come to fruition.',
    ],
    fieldNote: 'Born in the Highlands of Scotland. Based in Southern Colorado. Adventuring everywhere.',
  },

  contact: {
    heading: 'Say howdy.',
    line: 'Send your ideas and project vibes and we can wing it from there.',
    availability: 'Southern Colorado and beyond',
    response: 'Replies within 48 hours',
    sessionTypes: ['The Campaign', 'Branding', 'Portraits', 'Something else'],
  },

  // Ashley's three real posts, lifted from the old site's single blog page.
  // NOTE: the source page carried no publication dates — these are ordering
  // placeholders for Ashley to correct before launch.
  journal: [
    {
      slug: 'passion-a-love-story',
      title: 'Passion: creating a love story through photography',
      date: '2024-03-02',
      deck: 'A love torn romance, a borrowed bar, a train two hours late, and a couple who answered every idea with LETS GO.',
      coverId: '073-dsc-6462',
      blocks: [
        {
          type: 'text',
          text: 'I cruised up the stairs and into the small little Airbnb room. Both Kat and Glenn had an amazing spread of outfits, accessories, and props. Of course, I went straight for the best accessory in the room, the big ol puppy dawgs! I digress, back to the story. Beautiful vintage clothing lined the rails on the bed. Jewelry neatly organized on the table. Shoes and boots on display in hopes to be paired with the right outfit. It was almost like in the movies, touching each piece of clothing, waiting for the photography shoot to happen. My thoughts for this shoot was a love torn romance. A love that was almost, but would never be. The response from the models: LETS GO.',
        },
        {
          type: 'text',
          text: 'All dolled up and we are off to the first shoot; a local watering hole called The Hive. The owners graciously let us in before opening. We had the whole place to ourselves. I loved the attention to detail Glenn and I pulled together. (Let’s be honest, mostly Glenn.) For weeks we sent each other ideas, samples, and photos inspo. Even down to the detail of the paint on the walls in the Hive. The yellow hat and red coat were intentional against the background of the lightly yellow wall with splatters of different colors in the pictures surrounding the walls. Excellent warm up shoot and great start to the weekend.',
        },
        { type: 'image', photoIds: ['074-dsc-6345'] },
        {
          type: 'text',
          text: 'We head to the train station to only find out that the train was almost 2 hours delayed. This would put us in the dark for the shoot. On the fly we turn and look at the bridge across the tracks. The falling sun beams struck the bridge like a flashlight in your eyes. On the spot we switched gears and headed to the new location. All I needed was 10 min and I got the shots. We wondered back-alley ways, stopping in front of the church. I watched Sex and the City growing up and Kat’s shoes screamed a walk in Central Park. We wrap up day one and a margarita to celebrate.',
        },
        {
          type: 'text',
          text: 'Day Two. We lucked out and was able to reschedule the train tickets for Sunday morning. We head to the train, fully re dolled up and ready to rock. We have one hour to capture what we had been working on for weeks. My vision to provoke the love lost emotion was now or never. I saw glimpses of it the day before, but something was missing. It was the light. I need the glow to be surrounding them at different times, looks, scenes. I need the obsession in my head to be realized. Then Kat looked to the left out the train window, then down. The sun came through, highlighting just half of her face. Nailed it. I couldn’t believe I got the emotion I wanted. There’s this feeling where your obsession is completed but you know there’s still more. We move to the middle of the train, where one box car meets the other box car. The obnoxious light from the exit sign added to the dramatic illustrative and only to promote the cinematic visuals. An intimate, almost, but not quite look, touch, feeling. A love that cannot happen. SNAP, nailed it again. This felt so much of a journey that was longing, but when the seduction of the destination arrives, we know that the love will end. Almost mirrors the passion for photography.',
        },
      ],
    },
    {
      slug: 'cigarettes-and-dr-pepper',
      title: 'Cigarettes & Dr Pepper',
      date: '2024-07-20',
      deck: 'A bullrider’s 8 seconds. A hand painted sign on a dirt road, a small but mighty arena, and the longest eight seconds in sport.',
      coverId: '075-dsc-4585',
      blocks: [
        {
          type: 'text',
          text: 'As I turned onto the dirt road, passing the makeshift sign that say Rodeo 6pm in hand painted lettering, I knew I was heading into a wild night. Following the dirt road, a truck in front of me was guiding the direction. The lights of the rodeo peaked through as we turned the corner. Have you ever seen in the movies when you walk down a random alley way, knock on an old door, open it up and walk into a grand room with lots of lights and dancing? That’s what this felt like as I rolled into the parking lot of the rodeo. What a random but spectacular area. People filled the space with laughter and music. I parked the truck towards the back near the bulls. I always like to have easy access to the truck and equipment during any shoot. I gather up my gear and walk past some cowboys getting ready. I never want to get in anyone’s way, but at the same time I try to sneak into places to see what shots I can snag. Right away I go for the cattle shoots. I start to capture all the fellas getting ready. Gear slung over cattle panels, tape dangling being ready to use, and soda cans with cigarette butts flung on the ground.',
        },
        { type: 'image', photoIds: ['076-dsc-5719'] },
        {
          type: 'text',
          text: 'This felt like a small but mighty arena. MC calling folks to be ready to be entertained, owners shaking hands with the fellas and the bulls being prepped. I step on the grate to catch a glimpse of the riders. They climb over the panel and sit down on the bull. What a process it is for a rider to go for 8 seconds. A team of gents surround the rider. Torquing the rope so his hand won’t fly loose (the process of roping down the hand during the prepping session is an intense scene), helmet check, position locked. I didn’t know if I was hearing my heart race or the riders. CLANK, the gate opens and the rider holds on. Up to 8 seconds of pure adrenaline. Absolutely insane.',
        },
        {
          type: 'text',
          text: 'I couldn’t get enough. Duckin and diving around the fellas and snagging photos. One fella invited me to hop the next stall to get a different angle for the next rider. I couldn’t get into the area fast enough, but that would be a crazy shot. NEXT TIME!! Pure high for the entire time. When the sun set, the arena lights came on. This gave my photos more of an interesting vibe. The greens and reds and blues of the lights just added to the dramatic scene of the riders trying to catch their 8 seconds on the bull. The zone that is locked in for this 8 second ride is more than what I can imagine.',
        },
        {
          type: 'text',
          text: 'I will say, I am hooked.',
        },
      ],
    },
    {
      slug: 'a-photographers-storytelling',
      title: 'A Photographer’s Storytelling',
      date: '2024-11-09',
      deck: 'A one traffic light town out east, a bay window, and a small room full of books you can lose an afternoon in.',
      coverId: '077-dsc-6241',
      blocks: [
        {
          type: 'text',
          text: 'I turned left on the highway, little pup and Bodhi with me for the ride. The GPS says 7 more min to my destination. The little town of Rocky Ford is your adorable one traffic light town out east of Colorado. The little book shop is off to the right. Each book shop has their own unique store front. Sometimes you can even judge a store by its store front cover. I knew I was going to love this store by it petite display, bay window and simple sign above. Not quite on the corner but placed just right.',
        },
        {
          type: 'text',
          text: 'I walk into the aroma of warmth. I instantly felt cozy. The comfort vibe and colorful books had me circling the store more times than I can count. The book covers of Sherlock Homes, Jane Eyre and my favorite Peter Rabbit filled my soul. You can get lost in a place like this. It is a small room, but the books and the feel can make one lose track of time in their own wonderous thoughts and dreams, and I did exactly that.',
        },
        {
          type: 'text',
          text: 'After a few more laps and a couple purchases, I still wasn’t ready to leave. The imagination and dreams filled my head on my journey home. It is a friendly reminder to always ponder. And as Peter Rabbit would say: “There is something delicious about writing the first words of a story. You never quite know where they’ll take you.”',
        },
        {
          type: 'text',
          text: 'Chandler & Fable Bookshop, Rocky Ford, Colorado.',
        },
      ],
    },
  ] as JournalPost[],
})
