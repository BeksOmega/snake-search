/**
 * SlitherScope - Data Module (Texas Snake Wildlife Dataset)
 * Contains comprehensive mock datasets for Austin & Central Texas reptiles.
 */

export const SPECIES_DATA = [
  {
    id: 'eastern-garter',
    name: 'Eastern Garter Snake',
    scientificName: 'Thamnophis sirtalis',
    family: 'garter',
    familyName: 'Water & Garter Snakes',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Harmless',
    percentage: 28,
    sightingCount: 95,
    habitats: ['creek', 'rocks', 'canopy'],
    primaryHabitat: 'creek',
    trailNote: 'Common sighting along Barton hike path',
    frequencyLabel: '1 in 4 snakes',
    description: 'A slender, harmless garden friend famous for its bright yellow or cream racing stripe down the spine and checkered dark patterns. Very active during mild sunny mornings.',
    kidFact: 'Garter snakes release a harmless, stinky musk to surprise predators when picked up. Best admired on the trail!',
    diet: 'Earthworms, slugs, minnows, small frogs, and salamanders.',
    size: '18 – 26 inches',
    activityTime: 'Daytime (Diurnal)',
    traits: {
      pattern: 'striped',
      color: 'yellow-green',
      headShape: 'narrow',
      scaleType: 'keeled'
    },
    idTips: [
      'Distinct yellow or turquoise dorsal racing stripe from head to tail',
      'Checkerboard pattern between stripes on dark body',
      'Slender head with bright dorsal stripe and checkered pattern'
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByVUtxIByBunqSKbbi1QnMk_--moKvCoH__Mp123ZSdxAyXNum0arkTJN33j3QlqU2a1KUk2y7J-J7HlDMUdl2F3_kXEds-P4D5gWEOQi9Bged4QEbaKSiHw7rxaQTD1TiWIqpC4_6pSQglwv08IX6gEeqMa3XuyNEkzUbXkXLtgFabezeXbmcqKY6u3HQod8JVZ19J3fohIHtfauHYA6_hISD6tN9GzquGwzad2zt2_t1IeqqxL3UuA',
    imageAlt: 'Eastern Garter Snake with bright yellow stripe resting on a river stone'
  },
  {
    id: 'western-rat',
    name: 'Western Rat Snake',
    scientificName: 'Pantherophis obsoletus',
    family: 'rat',
    familyName: 'Rat & King Snakes',
    dangerLevel: 'gentle',
    safetyBadge: '🌿 Gentle Glider',
    percentage: 22,
    sightingCount: 75,
    habitats: ['canopy', 'rocks'],
    primaryHabitat: 'canopy',
    trailNote: 'Often spotted exploring live oak branches',
    frequencyLabel: 'Rodent Patrol',
    description: 'Texas\'s favorite rodent control specialist! Large, powerful climbers with blotched gray-to-black patterns and a white or yellowish chin. Often found high in cedar or live oak trees.',
    kidFact: 'Texas Rat Snakes can climb straight up rough tree bark by wedging their angled belly scales into tiny crevices like rock climbers!',
    diet: 'Mice, rats, bird eggs, squirrels, and tree frogs.',
    size: '4 – 6 feet',
    activityTime: 'Day & Warm Evenings',
    traits: {
      pattern: 'blotched',
      color: 'black-gray',
      headShape: 'oval',
      scaleType: 'semi-smooth'
    },
    idTips: [
      'White throat/chin with blotchy patterned body',
      'Keeled belly scales shaped like bread loaf for vertical tree climbing',
      'Freezes in a crinkly, wiggly line when approached on paths'
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMwhrUHi_uPkwLPrB5g6pwO02U4IRmXFjCJ8nNh_zKS2z3BeMT6mLuUdYqpN6eabZ2ecLxxgW_s1tyvK9mELCb0mpqEdxjFUX3_4go3KFLw26gC6f7hVtJhMkiy1o6QdCsQt8hdFmoC2qZIzB5ilWcpOCo-BzobImfvZe6B0z1eqCMpWCzqPu0avwfG5ADSWXL-A_2UAjusT5wJM6QS-NATNQtg1Ko47JaCqBGhZKCtqAf3dPbVtUyBg',
    imageAlt: 'Western Rat Snake basking on limestone rocks'
  },
  {
    id: 'plain-bellied-water',
    name: 'Plain-bellied Water Snake',
    scientificName: 'Nerodia erythrogaster',
    family: 'garter',
    familyName: 'Water & Garter Snakes',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Harmless Swimmer',
    percentage: 18,
    sightingCount: 61,
    habitats: ['creek'],
    primaryHabitat: 'creek',
    trailNote: 'Master diver looking for small fish and minnows',
    frequencyLabel: 'Near Water',
    description: 'A stout, heavy-bodied water snake with a solid dark grey-olive back and a plain, unpatterned bright yellow or orange belly. Often seen basking on cypress roots above the water.',
    kidFact: 'Water snakes can hold their breath underwater for over 20 minutes while searching for tasty sunfish and crayfish!',
    diet: 'Fish, tadpoles, bullfrogs, and crayfish.',
    size: '30 – 48 inches',
    activityTime: 'Day & Dusk',
    traits: {
      pattern: 'solid',
      color: 'brown-olive',
      headShape: 'broad',
      scaleType: 'heavily keeled'
    },
    idTips: [
      'Solid plain yellow or red-orange belly with no dark half-moons',
      'Swims with entire body submerged or resting head on water surface',
      'Vertical dark bars on upper lip scales with plain belly'
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Fh4T3f1oKa_YZV5RPS5qvZYDCUUtD3uJ9EFZyzUZOYY-MlbqFMSzAIeNWFo3R0S8NXbX-r_W53ur4RQLaaiL7vTc7JYMmjhy6obkewViBEtywsmyjXdW7ioIDxV_lf2PhwTScKfq136x207YNyAQuz7Rd5ITQgEDIfCrggpGmrRKkEUCZvkpMR1tkDeFsbjW4x07UPUJTShuYise1zpRo6ykAnW1q6zCa7XB0UHFlIAE9XuyIjOR0Q',
    imageAlt: 'Plain-bellied Water Snake swimming in clear creek shallows'
  },
  {
    id: 'rough-green',
    name: 'Rough Green Snake',
    scientificName: 'Opheodrys aestivus',
    family: 'tiny',
    familyName: 'Tiny Bug Hunters',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Insect Eater',
    percentage: 12,
    sightingCount: 41,
    habitats: ['canopy', 'creek'],
    primaryHabitat: 'canopy',
    trailNote: 'Loves grasshoppers, crickets & caterpillars',
    frequencyLabel: 'Master of Hide & Seek',
    description: 'An exquisitely slender, bright lime-green snake with a pale yellow-cream underside. Highly arboreal, it spends its days gracefully weaving through vines and bushes overhanging creek beds.',
    kidFact: 'When resting among vines in the breeze, green snakes gently sway side-to-side to mimic leaves fluttering in the wind!',
    diet: 'Grasshoppers, caterpillars, spiders, crickets, and small moths.',
    size: '22 – 32 inches',
    activityTime: 'Daytime (Sun lover)',
    traits: {
      pattern: 'solid',
      color: 'emerald-green',
      headShape: 'slender',
      scaleType: 'keeled'
    },
    idTips: [
      'Brilliant uniform emerald green with creamy yellow belly',
      'Exceptionally slender body with large expressive golden eyes',
      'Never bites; relies on incredible camouflage'
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKyhOGC5ZgqN3W4h9V0B2dFUvsqvdx8t4Cyys7z3sRYKUUQddOHc8yETSxSeO2gxFBc6stKbA7_vKvLv6Ejyi1BZEsciym0kTkvd9EBMiaq9jRZmLQbqMEJz0slTpacF9_55OrGvdznwdsNCN7ZZlOqHfeJeUDR3K_BAwOiPu_1cydM7QzikWRsyzNp04i1l7-RyiaDz9WNICUbNW_ppIoT6ENP5Y0_lozVJe0dNN08EUsU-Am9v3Yg',
    imageAlt: 'Rough Green Snake gracefully coiled in green cedar foliage'
  },
  {
    id: 'broad-banded-copperhead',
    name: 'Broad-banded Copperhead',
    scientificName: 'Agkistrodon laticinctus',
    family: 'viper',
    familyName: 'Pit Vipers & Venomous',
    dangerLevel: 'venomous',
    safetyBadge: '⚠️ Caution: Venomous',
    percentage: 7,
    sightingCount: 24,
    habitats: ['rocks', 'leaf_litter'],
    primaryHabitat: 'rocks',
    trailNote: 'Keep 6 feet away and inform an adult leader',
    frequencyLabel: 'Rare Sight',
    description: 'A thick pit viper with copper-tinted head and broad hourglass or saddle-shaped crossbands across a tan body. Well-camouflaged in fallen leaves and limestone crevices.',
    kidFact: 'Baby copperheads have a bright neon yellow-green tail tip that they wiggle like a little worm to lure curious frogs within range!',
    diet: 'Cicadas, field mice, small lizards, and caterpillars.',
    size: '20 – 36 inches',
    activityTime: 'Nocturnal & Twilight (Warm months)',
    traits: {
      pattern: 'hourglass-bands',
      color: 'copper-tan',
      headShape: 'triangular',
      scaleType: 'keeled'
    },
    idTips: [
      'Distinct broad copper/chestnut hourglass crossbands wider on the sides',
      'Triangular head with heat-sensing pit between eye and nostril',
      'Hourglass crossbands wider on sides with triangular head'
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkE-cyi5guL4XunigsJav4G-BVBG99VF8schy87lQPCyBp_WpK3aZ7FWmX7tDXP7zjtLiwre5c5Nz_Y1mbkibxUmhhncVrGiQVVd-hll8RPNBttIo7otxyKrIv_VinhxzWcJcINCLk41tvYHyqKl5bg-mWQTweBc8qIQYqguzvVhN_-cGtnThai2I_U7Rbp4Fh4AnHWTqI67gth4lsU2NpeQkW55fkUc5y7HleoNsT9fCx5kJDPOmI7g',
    imageAlt: 'Broad-banded Copperhead showing distinctive hourglass bands'
  },
  {
    id: 'speckled-kingsnake',
    name: 'Speckled Kingsnake',
    scientificName: 'Lampropeltis holbrooki',
    family: 'rat',
    familyName: 'Rat & King Snakes',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Nature Protector',
    percentage: 8,
    sightingCount: 27,
    habitats: ['rocks', 'leaf_litter'],
    primaryHabitat: 'rocks',
    trailNote: 'Natural helper immune to pit viper venom',
    frequencyLabel: 'Garden Hero',
    description: 'Known as the "Salt and Pepper Snake", this handsome constrictor has a shiny black body with a brilliant yellow or white dot on almost every scale.',
    kidFact: 'Kingsnakes are immune to rattlesnake and copperhead venom and will actually hunt and eat venomous snakes!',
    diet: 'Other snakes, rodents, lizards, and turtle eggs.',
    size: '36 – 48 inches',
    activityTime: 'Morning & Dusk',
    traits: {
      pattern: 'speckled',
      color: 'black-yellow',
      headShape: 'oval',
      scaleType: 'smooth-glossy'
    },
    idTips: [
      'Shiny black scales each centered with a bright creamy yellow dot',
      'Smooth, glossy scales that reflect light like polished obsidian',
      'Docile behavior when observed quietly from trails'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Speckled Kingsnake with glistening yellow and black markings'
  },
  {
    id: 'ring-necked',
    name: 'Ring-necked Snake',
    scientificName: 'Diadophis punctatus',
    family: 'tiny',
    familyName: 'Tiny Bug Hunters',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Tiny Secret Keeper',
    percentage: 6,
    sightingCount: 20,
    habitats: ['leaf_litter', 'rocks'],
    primaryHabitat: 'leaf_litter',
    trailNote: 'Hides under flat limestone rocks and damp mulch',
    frequencyLabel: 'Pocket-Sized',
    description: 'A miniature, harmless snake with a slate-blue/gray back, a bright yellow-orange neck ring, and a dazzling neon orange belly that transitions to coral red near the tail.',
    kidFact: 'When startled, the Ring-necked snake curls its tail into a tight corkscrew showing its bright red belly like a danger signal!',
    diet: 'Tiny salamanders, earthworms, and beetle larvae.',
    size: '10 – 15 inches',
    activityTime: 'Nocturnal / Under Cover',
    traits: {
      pattern: 'ringed-neck',
      color: 'slate-orange',
      headShape: 'slender',
      scaleType: 'smooth'
    },
    idTips: [
      'Solid dark blue-gray body with distinct yellow neck necklace',
      'Vibrant yellow-to-coral belly with small black dots',
      'Very gentle, small enough to fit in a teaspoon when newborn'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Ring-necked Snake showing bright neck ring'
  },
  {
    id: 'western-cottonmouth',
    name: 'Western Cottonmouth',
    scientificName: 'Agkistrodon piscivorus',
    family: 'viper',
    familyName: 'Pit Vipers & Venomous',
    dangerLevel: 'venomous',
    safetyBadge: '⚠️ Caution: Venomous',
    percentage: 3,
    sightingCount: 10,
    habitats: ['creek'],
    primaryHabitat: 'creek',
    trailNote: 'Swims high on top of water like a floating log',
    frequencyLabel: 'Observe from 10ft',
    description: 'A heavy-bodied aquatic pit viper with dark olive-black coloring, blocky head, and a distinctive white mouth lining displayed when threatened.',
    kidFact: 'Cottonmouths swim buoyantly with their entire body on top of the water like a floating pool noodle, whereas harmless water snakes swim with only their head poked up!',
    diet: 'Fish, frogs, baby turtles, and small water birds.',
    size: '30 – 42 inches',
    activityTime: 'Dusk & Night',
    traits: {
      pattern: 'jagged-bands',
      color: 'dark-olive-black',
      headShape: 'angular-blocky',
      scaleType: 'keeled'
    },
    idTips: [
      'Opens mouth wide to flash bright snow-white warning lining ("cotton mouth")',
      'Dark facial mask band across the eye with a white lower stripe',
      'Angular ridge over eye gives a "stern" brow appearance'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Western Cottonmouth in riparian wetland habitat'
  },
  {
    id: 'texas-coral',
    name: 'Texas Coral Snake',
    scientificName: 'Micrurus tener',
    family: 'viper',
    familyName: 'Pit Vipers & Venomous',
    dangerLevel: 'venomous',
    safetyBadge: '⚠️ Caution: Venomous',
    percentage: 2,
    sightingCount: 7,
    habitats: ['leaf_litter', 'rocks'],
    primaryHabitat: 'leaf_litter',
    trailNote: 'Maintain a safe observation distance of at least 6 feet from all snakes.',
    frequencyLabel: 'Very Shy',
    description: 'A reclusive elapid with brilliant alternating red, yellow, and black rings. Extremely shy and secretive, spending most of its time buried in decaying leaf litter.',
    kidFact: 'Texas Coral Snakes are identified by their blunt black snout extending past the eyes and distinct ringed body pattern with alternating red, yellow, and black bands. Always maintain a safe observation distance of at least 6 feet!',
    diet: 'Small smooth-scaled snakes and little ground lizards.',
    size: '20 – 30 inches',
    activityTime: 'Morning & Overcast Days',
    traits: {
      pattern: 'ringed-bands',
      color: 'red-yellow-black',
      headShape: 'blunt-black-snout',
      scaleType: 'smooth'
    },
    idTips: [
      'Blunt, rounded head with a solid black snout extending past the eyes',
      'Ringed body pattern with alternating red, yellow, and black bands encircling the body',
      'Reclusive nature with short fixed fangs; always maintain a safe distance of at least 6 feet'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Texas Coral Snake with bright red, yellow, and black banding'
  },
  {
    id: 'ribbon-snake',
    name: 'Western Ribbon Snake',
    scientificName: 'Thamnophis proximus',
    family: 'garter',
    familyName: 'Water & Garter Snakes',
    dangerLevel: 'harmless',
    safetyBadge: '🌿 Agile Speedster',
    percentage: 11,
    sightingCount: 38,
    habitats: ['creek', 'canopy'],
    primaryHabitat: 'creek',
    trailNote: 'Speedy swimmer that darts into shoreline reeds',
    frequencyLabel: 'Speedy Friend',
    description: 'A super-sleek cousin of the garter snake with three bold yellow/orange stripes, immaculate white scales in front of the eyes, and a very long slender tail.',
    kidFact: 'More than one-third of a ribbon snake\'s total length is just its tail!',
    diet: 'Frogs, cricket frogs, minnows, and tadpoles.',
    size: '20 – 34 inches',
    activityTime: 'Daytime',
    traits: {
      pattern: 'striped',
      color: 'black-yellow-stripe',
      headShape: 'narrow',
      scaleType: 'keeled'
    },
    idTips: [
      'Bright yellow spot on top of the head between the eyes',
      'Clean pure-white or pale blue vertical scale in front of each eye',
      'Extremely slender build compared to chunky water snakes'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Slender Western Ribbon Snake gliding along creek stones'
  }
];

export const LOCATIONS_DATA = [
  {
    id: 'barton-creek',
    name: 'Barton Creek Census',
    area: 'Austin, Texas • 5-Mile Radius',
    subtitle: 'Greenbelt bio-survey for young wildlife detectives',
    totalSpecies: 14,
    totalNeighbors: 340,
    familyPercentages: {
      garter: 45,
      rat: 30,
      tiny: 18,
      viper: 7
    },
    harmlessPercent: 93,
    cautionPercent: 7,
    topSpeciesIds: ['eastern-garter', 'western-rat', 'plain-bellied-water', 'rough-green', 'broad-banded-copperhead'],
    habitatBreakdown: {
      creek: { percent: 40, label: 'Creek Edges', sub: 'Frogs & cool shallows', icon: 'water_drop' },
      rocks: { percent: 35, label: 'Sunny Rocks', sub: 'Morning sun & warmth', icon: 'sunny' },
      canopy: { percent: 25, label: 'Canopy / Logs', sub: 'Fallen limbs & trees', icon: 'park' }
    }
  },
  {
    id: 'mckinney-falls',
    name: 'McKinney Falls Census',
    area: 'Austin, Texas • Onion Creek Area',
    subtitle: 'Limestone falls & woodland ecology survey',
    totalSpecies: 12,
    totalNeighbors: 285,
    familyPercentages: {
      garter: 40,
      rat: 35,
      tiny: 15,
      viper: 10
    },
    harmlessPercent: 90,
    cautionPercent: 10,
    topSpeciesIds: ['western-rat', 'plain-bellied-water', 'speckled-kingsnake', 'eastern-garter', 'broad-banded-copperhead'],
    habitatBreakdown: {
      creek: { percent: 35, label: 'Falls & Pools', sub: 'Limestone ledges & eddies', icon: 'water_drop' },
      rocks: { percent: 45, label: 'Rock Shelters', sub: 'Warm slab basking zones', icon: 'sunny' },
      canopy: { percent: 20, label: 'Oak Savanna', sub: 'Old growth live oaks', icon: 'park' }
    }
  },
  {
    id: 'lady-bird-lake',
    name: 'Lady Bird Lake Census',
    area: 'Downtown Austin • Butler Trail Loop',
    subtitle: 'Urban wetland & boardwalk naturalist monitor',
    totalSpecies: 9,
    totalNeighbors: 410,
    familyPercentages: {
      garter: 60,
      rat: 25,
      tiny: 12,
      viper: 3
    },
    harmlessPercent: 97,
    cautionPercent: 3,
    topSpeciesIds: ['plain-bellied-water', 'eastern-garter', 'ribbon-snake', 'western-rat', 'rough-green'],
    habitatBreakdown: {
      creek: { percent: 65, label: 'Lake Shallows', sub: 'Cypress roots & reeds', icon: 'water_drop' },
      rocks: { percent: 15, label: 'Riprap Shoreline', sub: 'Boardwalk boulders', icon: 'sunny' },
      canopy: { percent: 20, label: 'Trail Canopy', sub: 'Pecan & cottonwood limbs', icon: 'park' }
    }
  },
  {
    id: 'walnut-creek',
    name: 'Walnut Creek Census',
    area: 'North Austin • Metropolitan Park',
    subtitle: 'Prairie border & riparian creek corridor',
    totalSpecies: 13,
    totalNeighbors: 290,
    familyPercentages: {
      garter: 38,
      rat: 32,
      tiny: 22,
      viper: 8
    },
    harmlessPercent: 92,
    cautionPercent: 8,
    topSpeciesIds: ['western-rat', 'rough-green', 'ring-necked', 'eastern-garter', 'broad-banded-copperhead'],
    habitatBreakdown: {
      creek: { percent: 30, label: 'Creek Bed', sub: 'Pebble bars & crossings', icon: 'water_drop' },
      rocks: { percent: 30, label: 'Cedar Scrub', sub: 'Sunlit limestone clearing', icon: 'sunny' },
      canopy: { percent: 40, label: 'Dense Woodland', sub: 'Rich leaf litter & logs', icon: 'park' }
    }
  }
];

export const DETECTIVE_TIPS = [
  {
    id: 1,
    title: 'Detective Tip #1',
    text: 'Reptiles are cold-blooded! On cloudy days, check dry limestone rocks near Twin Falls where stored heat keeps them cozy.'
  },
  {
    id: 2,
    title: 'Detective Tip #2',
    text: 'Look up! Rat snakes are supreme climbers. Scan horizontal live oak branches about 6-10 feet off the ground for gentle gliders.'
  },
  {
    id: 3,
    title: 'Detective Tip #3',
    text: 'Keep 6 feet of safety space! Use the "Rule of Thumb": extend your thumb at arm\'s length; if it doesn\'t cover the snake, take 3 steps back.'
  },
  {
    id: 4,
    title: 'Detective Tip #4',
    text: 'Listen for rustling leaves! Tiny ring-necked and rough green snakes make soft whispering sounds when foraging for crickets.'
  },
  {
    id: 5,
    title: 'Detective Tip #5',
    text: 'Focus on body patterns and color bands from at least 6 feet away! Identify species by observing overall markings, stripes, or saddle shapes from a safe distance.'
  }
];

export const ACHIEVEMENTS = [
  {
    id: 'first-sighting',
    title: 'First Discovery',
    description: 'Logged your very first reptile sighting on the trail',
    icon: 'emoji_nature',
    unlocked: true
  },
  {
    id: 'water-scout',
    title: 'Water Scout',
    description: 'Identified an aquatic snake in creek shallows',
    icon: 'water_drop',
    unlocked: true
  },
  {
    id: 'harmless-hero',
    title: 'Gentle Detective',
    description: 'Logged 3 harmless helper snakes',
    icon: 'favorite',
    unlocked: true
  },
  {
    id: 'safety-champion',
    title: 'Safety Champion',
    description: 'Reviewed all S.N.A.K.E. safety rules in the Field Guide',
    icon: 'security',
    unlocked: false
  },
  {
    id: 'canopy-spotter',
    title: 'Canopy Spotter',
    description: 'Logged a snake climbing or basking in trees',
    icon: 'park',
    unlocked: false
  },
  {
    id: 'master-naturalist',
    title: 'Master Naturalist',
    description: 'Reach 500 Explorer XP on SlitherScope',
    icon: 'military_tech',
    unlocked: false
  }
];

export const SAMPLE_LOGS = [
  {
    id: 'log-1',
    speciesId: 'eastern-garter',
    speciesName: 'Eastern Garter Snake',
    date: '2026-08-28T09:45:00Z',
    location: 'Barton Creek - Gus Fruh Trail',
    habitat: 'creek',
    notes: 'Saw it basking on a wet boulder near the water edge. Slithered smoothly into the weeds when hikers walked by!',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByVUtxIByBunqSKbbi1QnMk_--moKvCoH__Mp123ZSdxAyXNum0arkTJN33j3QlqU2a1KUk2y7J-J7HlDMUdl2F3_kXEds-P4D5gWEOQi9Bged4QEbaKSiHw7rxaQTD1TiWIqpC4_6pSQglwv08IX6gEeqMa3XuyNEkzUbXkXLtgFabezeXbmcqKY6u3HQod8JVZ19J3fohIHtfauHYA6_hISD6tN9GzquGwzad2zt2_t1IeqqxL3UuA',
    xpEarned: 50
  },
  {
    id: 'log-2',
    speciesId: 'western-rat',
    speciesName: 'Western Rat Snake',
    date: '2026-08-25T16:20:00Z',
    location: 'Barton Creek - Twin Falls',
    habitat: 'canopy',
    notes: 'Big beautiful rat snake curled along a low oak branch about 7 feet up. Completely calm, just resting in the shade.',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMwhrUHi_uPkwLPrB5g6pwO02U4IRmXFjCJ8nNh_zKS2z3BeMT6mLuUdYqpN6eabZ2ecLxxgW_s1tyvK9mELCb0mpqEdxjFUX3_4go3KFLw26gC6f7hVtJhMkiy1o6QdCsQt8hdFmoC2qZIzB5ilWcpOCo-BzobImfvZe6B0z1eqCMpWCzqPu0avwfG5ADSWXL-A_2UAjusT5wJM6QS-NATNQtg1Ko47JaCqBGhZKCtqAf3dPbVtUyBg',
    xpEarned: 50
  },
  {
    id: 'log-3',
    speciesId: 'rough-green',
    speciesName: 'Rough Green Snake',
    date: '2026-08-19T11:15:00Z',
    location: 'Sculpture Falls Path',
    habitat: 'canopy',
    notes: 'Amazing bright green color! It looked exactly like a leafy vine. It was eating a green caterpillar.',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKyhOGC5ZgqN3W4h9V0B2dFUvsqvdx8t4Cyys7z3sRYKUUQddOHc8yETSxSeO2gxFBc6stKbA7_vKvLv6Ejyi1BZEsciym0kTkvd9EBMiaq9jRZmLQbqMEJz0slTpacF9_55OrGvdznwdsNCN7ZZlOqHfeJeUDR3K_BAwOiPu_1cydM7QzikWRsyzNp04i1l7-RyiaDz9WNICUbNW_ppIoT6ENP5Y0_lozVJe0dNN08EUsU-Am9v3Yg',
    xpEarned: 50
  }
];

export const SAFETY_RULES = [
  {
    letter: 'S',
    word: 'Stop',
    desc: 'Freeze in your tracks when you see a snake. Don\'t run or make sudden lunges.'
  },
  {
    letter: 'N',
    word: 'Never Touch',
    desc: 'Keep your hands to yourself. Never poke with sticks or try to pick up any snake.'
  },
  {
    letter: 'A',
    word: 'Always Back Up',
    desc: 'Take 3 slow steps backwards until you are at least 6 feet away from the snake.'
  },
  {
    letter: 'K',
    word: 'Keep Eyes On It',
    desc: 'Keep watch on where the snake is resting so everyone in your group knows its location.'
  },
  {
    letter: 'E',
    word: 'Explain to Adult',
    desc: 'Tell your adult leader, parent, or park ranger where you spotted the creature!'
  }
];
