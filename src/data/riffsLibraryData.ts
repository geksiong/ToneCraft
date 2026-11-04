import { PracticeRiff } from '../types/riffs';

export const PRACTICE_RIFFS: PracticeRiff[] = [
  {
    id: 'riff-classic-chuck-berry',
    name: 'The Classic Blues-Rock Repeating Box Lick',
    subtitle: 'The universal rock & roll signature lick with bending double-stops',
    primaryArtist: 'Chuck Berry',
    year: 1958,
    genre: 'Classic Rock',
    difficulty: 'Intermediate',
    tempo: 120,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'A Minor Pentatonic',
    scaleOrMode: 'A Minor Pentatonic (Box 1, 5th position)',
    isMovable: true,
    movableConfig: {
      baseFret: 5,
      baseKey: 'A',
      rootString: 6,
      fretMinOffset: -3, // Can slide down to G (3rd fret) or E (open position requires different fingering)
      fretMaxOffset: 7,  // Can slide up to E (12th fret)
      explanation: 'Uses exclusively closed fingerings on the 5th and 7th frets with no open strings. Root is on string 6 or string 4. Transpose this entire lick to any key simply by moving your index finger to the target root fret!'
    },
    techniques: ['bend-full', 'bend-release', 'pull-off', 'vibrato', 'slide-up'],
    totalBeats: 8,
    recommendedPresetId: 'texas-blues-solo',
    recommendedPresetName: 'Texas Blues Solo (TS808 + Tweed Deluxe)',
    pickupStyle: 'rock',
    description: 'The single most influential lick in electric guitar history. Built on Box 1 of the minor pentatonic scale, featuring a whole-step bend on the G string followed by a barre double-stop on the B and high E strings.',
    practiceTips: [
      'Anchor your index finger across strings 1 and 2 (high E and B) at fret 5 as a stationary barre.',
      'Use your ring finger reinforced by your middle finger on fret 7 of the G string to bend up a full step (target pitch is fret 9).',
      'Keep your wrist relaxed and bend with forearm rotation rather than straining individual fingers.',
      'Practice slowly at 50% speed to ensure the bend reaches true pitch before plucking the high strings.'
    ],
    songs: [
      {
        title: 'Johnny B. Goode',
        artist: 'Chuck Berry',
        album: 'Chuck Berry Is on Top',
        year: 1958,
        genre: 'Rock & Roll',
        key: 'Bb',
        isPrimary: true,
        usageNote: 'The iconic opening solo intro and repeating chorus punctuation that defined modern rock guitar.'
      },
      {
        title: 'Whole Lotta Love',
        artist: 'Led Zeppelin (Jimmy Page)',
        album: 'Led Zeppelin II',
        year: 1969,
        genre: 'Hard Rock',
        key: 'E',
        isPrimary: false,
        usageNote: 'Transposed up to the 12th fret (Key of E). Jimmy Page repeats this lick in the central climax of the guitar solo.'
      },
      {
        title: 'Voodoo Child (Slight Return)',
        artist: 'Jimi Hendrix',
        album: 'Electric Ladyland',
        year: 1968,
        genre: 'Psychedelic Blues',
        key: 'Eb / E',
        isPrimary: false,
        usageNote: 'Hendrix uses this lick with fierce wah-wah filtering and heavy Marshall saturation in both the intro fills and main solo.'
      },
      {
        title: 'Sweet Child O\' Mine',
        artist: 'Guns N\' Roses (Slash)',
        album: 'Appetite for Destruction',
        year: 1987,
        genre: 'Hard Rock',
        key: 'Eb / Ebm',
        isPrimary: false,
        usageNote: 'Slash uses variations of this lick to build screaming tension in the fast wah solo outro.'
      },
      {
        title: 'You Shook Me All Night Long',
        artist: 'AC/DC (Angus Young)',
        album: 'Back in Black',
        year: 1980,
        genre: 'Hard Rock',
        key: 'G',
        isPrimary: false,
        usageNote: 'Angus Young starts the legendary guitar solo with this lick shifted down to the 3rd fret (Key of G).'
      }
    ],
    columns: [
      // Measure 1
      {
        id: 'c1',
        time: 0.0,
        duration: 0.5,
        measure: 1,
        notes: [{ string: 4, fret: 5, technique: 'slide-up', targetFret: 7 }],
        annotation: '/7'
      },
      {
        id: 'c2',
        time: 0.5,
        duration: 0.5,
        notes: [{ string: 3, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c3',
        time: 1.0,
        duration: 0.5,
        notes: [{ string: 3, fret: 7, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'c4',
        time: 1.5,
        duration: 0.25,
        notes: [{ string: 2, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c5',
        time: 1.75,
        duration: 0.25,
        notes: [{ string: 1, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c6',
        time: 2.0,
        duration: 0.5,
        notes: [{ string: 3, fret: 7, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'c7',
        time: 2.5,
        duration: 0.25,
        notes: [{ string: 2, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c8',
        time: 2.75,
        duration: 0.25,
        notes: [{ string: 1, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c9',
        time: 3.0,
        duration: 0.5,
        notes: [{ string: 3, fret: 7, technique: 'bend-release', bendAmount: 2, releaseToFret: 7 }],
        annotation: 'b-r'
      },
      {
        id: 'c10',
        time: 3.5,
        duration: 0.5,
        notes: [{ string: 3, fret: 5, technique: 'pull-off', targetFret: 5 }],
        annotation: 'p'
      },
      // Measure 2
      {
        id: 'c11',
        time: 4.0,
        duration: 0.75,
        measure: 2,
        notes: [{ string: 4, fret: 7, technique: 'vibrato', vibrato: true }],
        annotation: '~'
      },
      {
        id: 'c12',
        time: 4.75,
        duration: 0.25,
        notes: [{ string: 3, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c13',
        time: 5.0,
        duration: 0.5,
        notes: [{ string: 3, fret: 7, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'c14',
        time: 5.5,
        duration: 0.5,
        notes: [{ string: 2, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c15',
        time: 6.0,
        duration: 0.5,
        notes: [{ string: 1, fret: 8, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'c16',
        time: 6.5,
        duration: 0.5,
        notes: [{ string: 1, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'c17',
        time: 7.0,
        duration: 1.0,
        notes: [{ string: 2, fret: 8, technique: 'vibrato', vibrato: true }],
        annotation: 'Vib ~'
      }
    ]
  },
  {
    id: 'riff-layla-blues-curl',
    name: 'The "Layla" / Albert King High Register Turnaround',
    subtitle: 'Expressive high-register singing bends with 1.5-step overbends and microtonal curls',
    primaryArtist: 'Derek and the Dominos (Eric Clapton & Duane Allman)',
    year: 1970,
    genre: 'Blues',
    difficulty: 'Advanced',
    tempo: 114,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'D Minor',
    scaleOrMode: 'D Minor Blues Scale (Box 1, 10th position)',
    isMovable: true,
    movableConfig: {
      baseFret: 10,
      baseKey: 'D',
      rootString: 6,
      fretMinOffset: -5, // Down to A (5th fret)
      fretMaxOffset: 5,  // Up to G (15th fret)
      explanation: 'Played entirely in the 10th-13th fret upper register with no open strings. Root is on string 6 fret 10 (or string 1 fret 10). Transpose across all 12 keys by shifting the 10th fret anchor up or down!'
    },
    techniques: ['bend-full', 'bend-release', 'pull-off', 'hammer-on', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'british-plexi-crunch',
    recommendedPresetName: 'Plexi Crunch & Drive',
    pickupStyle: 'rock',
    description: 'The monumental opening hook and vocal-like solo theme of Layla, originating from blues king Albert King. Characterized by wide, screaming bends that cry out into sustained, singing vibrato.',
    practiceTips: [
      'The bend on the 13th fret of string 2 (B) is a dramatic full step (up to D) or sometimes 1.5 steps (up to Eb). Support with 3 fingers.',
      'Control the release so it does not choke: allow the note to descend smoothly before pulling off to fret 10.',
      'Apply subtle wrist vibrato right at the peak of the bend before releasing.',
      'Use the neck or neck+middle pickup for that warm, round "woman tone" signature sound.'
    ],
    songs: [
      {
        title: 'Layla',
        artist: 'Derek and the Dominos (Eric Clapton & Duane Allman)',
        album: 'Layla and Other Assorted Love Songs',
        year: 1970,
        genre: 'Blues Rock',
        key: 'Dm',
        isPrimary: true,
        usageNote: 'The core guitar hook played simultaneously in octaves and harmony by Clapton and Allman.'
      },
      {
        title: 'Born Under a Bad Sign',
        artist: 'Albert King',
        album: 'Born Under a Bad Sign',
        year: 1967,
        genre: 'Electric Blues',
        key: 'C#m / Dm',
        isPrimary: false,
        usageNote: 'Albert King\'s upside-down Flying V playing style birthed this exact overbend and descending vibrato cadence.'
      },
      {
        title: 'The Thrill Is Gone',
        artist: 'B.B. King',
        album: 'Completely Well',
        year: 1969,
        genre: 'Blues',
        key: 'Bm',
        isPrimary: false,
        usageNote: 'Transposed to Key of B (7th position). B.B. King\'s signature hummingbird trill vibrato punctuates each vocal pause.'
      },
      {
        title: 'Texas Flood',
        artist: 'Stevie Ray Vaughan',
        album: 'Texas Flood',
        year: 1983,
        genre: 'Texas Blues',
        key: 'G#m / Am',
        isPrimary: false,
        usageNote: 'SRV adopts this exact phrasing with heavy .013 gauge strings, giving immense percussive snap.'
      }
    ],
    columns: [
      // Measure 1
      {
        id: 'l1',
        time: 0.0,
        duration: 0.5,
        measure: 1,
        notes: [{ string: 1, fret: 10, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'l2',
        time: 0.5,
        duration: 0.5,
        notes: [{ string: 1, fret: 13, technique: 'pull-off', targetFret: 10 }],
        annotation: '13p10'
      },
      {
        id: 'l3',
        time: 1.0,
        duration: 0.5,
        notes: [{ string: 2, fret: 13, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'l4',
        time: 1.5,
        duration: 0.5,
        notes: [{ string: 2, fret: 13, technique: 'bend-release', bendAmount: 2, releaseToFret: 13 }],
        annotation: 'b-r'
      },
      {
        id: 'l5',
        time: 2.0,
        duration: 0.5,
        notes: [{ string: 2, fret: 10, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'l6',
        time: 2.5,
        duration: 0.5,
        notes: [{ string: 3, fret: 12, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'l7',
        time: 3.0,
        duration: 0.5,
        notes: [{ string: 3, fret: 10, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'l8',
        time: 3.5,
        duration: 0.5,
        notes: [{ string: 4, fret: 12, technique: 'vibrato', vibrato: true }],
        annotation: '~'
      },
      // Measure 2
      {
        id: 'l9',
        time: 4.0,
        duration: 0.5,
        measure: 2,
        notes: [{ string: 3, fret: 10, technique: 'hammer-on', targetFret: 12 }],
        annotation: '10h12'
      },
      {
        id: 'l10',
        time: 4.5,
        duration: 0.5,
        notes: [{ string: 2, fret: 10, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'l11',
        time: 5.0,
        duration: 0.75,
        notes: [{ string: 1, fret: 13, technique: 'bend-full', bendAmount: 2 }],
        annotation: 'Full'
      },
      {
        id: 'l12',
        time: 5.75,
        duration: 0.25,
        notes: [{ string: 1, fret: 10, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'l13',
        time: 6.0,
        duration: 0.5,
        notes: [{ string: 2, fret: 13, technique: 'pull-off', targetFret: 10 }],
        annotation: 'p'
      },
      {
        id: 'l14',
        time: 6.5,
        duration: 0.5,
        notes: [{ string: 3, fret: 12, technique: 'pull-off', targetFret: 10 }],
        annotation: 'p'
      },
      {
        id: 'l15',
        time: 7.0,
        duration: 1.0,
        notes: [{ string: 4, fret: 12, technique: 'vibrato', vibrato: true }],
        annotation: 'Root ~'
      }
    ]
  },
  {
    id: 'riff-hendrix-little-wing',
    name: 'Neo-Soul & Hendrix Double-Stop Chime',
    subtitle: 'Sliding fourths, minor-to-major third hammer-ons, and dynamic chordal blooms',
    primaryArtist: 'Jimi Hendrix',
    year: 1967,
    genre: 'Neo-Soul',
    difficulty: 'Advanced',
    tempo: 72,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'G Major / E Minor',
    scaleOrMode: 'G Major Pentatonic / E Dorian',
    isMovable: true,
    movableConfig: {
      baseFret: 3,
      baseKey: 'G',
      rootString: 6,
      fretMinOffset: -2, // Down to F
      fretMaxOffset: 7,  // Up to D (10th fret)
      explanation: 'Uses movable barre and thumb-over chord shapes with ornamental hammer-on double stops. Shifting the base root on string 6 moves this lush soul-guitar texture to any key.'
    },
    techniques: ['hammer-on', 'pull-off', 'slide-up', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'hendrix-fuzz-vibe',
    recommendedPresetName: 'Jimi Psych Experience (Fuzz + Uni-Vibe)',
    pickupStyle: 'clean-quack',
    description: 'The golden standard of rhythm-and-lead hybrid guitar playing. Instead of strumming static chords, Hendrix treated every chord shape as an interconnected web of ringing double-stops and hammer-ons.',
    practiceTips: [
      'Fret the bass note with your left thumb hooked gently over the top of the neck (or use your index finger).',
      'Keep your index finger barring strings 3 and 2 while hammering on with your ring finger from fret 5 to 7.',
      'Allow the non-hammered notes to ring continuously to create a lush, harpsichord-like cascade.',
      'Select the neck or neck-middle pickup with clean head-room for maximum crystalline chime.'
    ],
    songs: [
      {
        title: 'Little Wing',
        artist: 'Jimi Hendrix Experience',
        album: 'Axis: Bold as Love',
        year: 1967,
        genre: 'Psychedelic Rock / Soul',
        key: 'G',
        isPrimary: true,
        usageNote: 'The breathtaking intro progression that established this style as essential modern guitar vocabulary.'
      },
      {
        title: 'Slow Dancing in a Burning Room',
        artist: 'John Mayer',
        album: 'Continuum',
        year: 2006,
        genre: 'Neo-Blues / Pop',
        key: 'C#m / E',
        isPrimary: false,
        usageNote: 'Mayer transposes this technique to C#m (9th position) for the famous melancholy double-stop intro riff.'
      },
      {
        title: 'Lenny',
        artist: 'Stevie Ray Vaughan',
        album: 'Texas Flood',
        year: 1983,
        genre: 'Blues / Soul',
        key: 'Eb / E',
        isPrimary: false,
        usageNote: 'SRV weaves gentle whammy bar warble and crystalline Strat chime through these exact double-stops.'
      },
      {
        title: 'Under the Bridge',
        artist: 'Red Hot Chili Peppers (John Frusciante)',
        album: 'Blood Sugar Sex Magik',
        year: 1991,
        genre: 'Alt Rock',
        key: 'D / E',
        isPrimary: false,
        usageNote: 'Frusciante credited Hendrix\'s Little Wing directly as the structural blueprint for this verse arrangement.'
      }
    ],
    columns: [
      // Measure 1 - G chord arpeggiation & sliding 4ths
      {
        id: 'nw1',
        time: 0.0,
        duration: 0.5,
        measure: 1,
        notes: [{ string: 6, fret: 3, technique: 'normal' }],
        annotation: 'Bass G'
      },
      {
        id: 'nw2',
        time: 0.5,
        duration: 0.5,
        notes: [
          { string: 4, fret: 5, technique: 'normal' },
          { string: 3, fret: 4, technique: 'normal' }
        ],
        annotation: 'G triad'
      },
      {
        id: 'nw3',
        time: 1.0,
        duration: 0.5,
        notes: [
          { string: 3, fret: 5, technique: 'slide-up', targetFret: 7 },
          { string: 2, fret: 5, technique: 'slide-up', targetFret: 7 }
        ],
        annotation: '5/7 slide'
      },
      {
        id: 'nw4',
        time: 1.5,
        duration: 0.5,
        notes: [
          { string: 3, fret: 7, technique: 'pull-off', targetFret: 5 },
          { string: 2, fret: 7, technique: 'pull-off', targetFret: 5 }
        ],
        annotation: '7p5'
      },
      {
        id: 'nw5',
        time: 2.0,
        duration: 0.5,
        notes: [{ string: 4, fret: 5, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'nw6',
        time: 2.5,
        duration: 0.5,
        notes: [
          { string: 3, fret: 5, technique: 'hammer-on', targetFret: 7 },
          { string: 2, fret: 5, technique: 'normal' }
        ],
        annotation: '5h7'
      },
      {
        id: 'nw7',
        time: 3.0,
        duration: 0.5,
        notes: [{ string: 2, fret: 8, technique: 'vibrato', vibrato: true }],
        annotation: '~'
      },
      {
        id: 'nw8',
        time: 3.5,
        duration: 0.5,
        notes: [{ string: 1, fret: 7, technique: 'normal' }],
        annotation: ''
      },
      // Measure 2 - Am chord embellishment
      {
        id: 'nw9',
        time: 4.0,
        duration: 0.5,
        measure: 2,
        notes: [{ string: 6, fret: 5, technique: 'normal' }],
        annotation: 'Bass A'
      },
      {
        id: 'nw10',
        time: 4.5,
        duration: 0.5,
        notes: [
          { string: 4, fret: 7, technique: 'normal' },
          { string: 3, fret: 5, technique: 'normal' }
        ],
        annotation: 'Am'
      },
      {
        id: 'nw11',
        time: 5.0,
        duration: 0.5,
        notes: [
          { string: 3, fret: 5, technique: 'hammer-on', targetFret: 7 },
          { string: 2, fret: 5, technique: 'normal' }
        ],
        annotation: '5h7'
      },
      {
        id: 'nw12',
        time: 5.5,
        duration: 0.5,
        notes: [{ string: 3, fret: 5, technique: 'pull-off', targetFret: 5 }],
        annotation: '7p5'
      },
      {
        id: 'nw13',
        time: 6.0,
        duration: 0.5,
        notes: [{ string: 4, fret: 7, technique: 'normal' }],
        annotation: ''
      },
      {
        id: 'nw14',
        time: 6.5,
        duration: 0.5,
        notes: [
          { string: 2, fret: 8, technique: 'slide-up', targetFret: 10 },
          { string: 1, fret: 8, technique: 'slide-up', targetFret: 10 }
        ],
        annotation: '8/10'
      },
      {
        id: 'nw15',
        time: 7.0,
        duration: 1.0,
        notes: [
          { string: 2, fret: 10, technique: 'vibrato', vibrato: true },
          { string: 1, fret: 10, technique: 'vibrato', vibrato: true }
        ],
        annotation: 'Chime ~'
      }
    ]
  },
  {
    id: 'riff-maiden-metal-gallop',
    name: 'The Iron Maiden Gallop & Palm-Mute Charge',
    subtitle: '16th-note galloping rhythm with tight palm mutes and melodic power harmonizations',
    primaryArtist: 'Iron Maiden',
    year: 1983,
    genre: 'Metal',
    difficulty: 'Intermediate',
    tempo: 144,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor',
    scaleOrMode: 'E Natural Minor (Aeolian)',
    isMovable: true,
    movableConfig: {
      baseFret: 7,
      baseKey: 'E',
      rootString: 5,
      fretMinOffset: -5, // Down to B (2nd fret)
      fretMaxOffset: 5,  // Up to A (12th fret)
      explanation: 'Rooted on string 5 (A string) at the 7th fret (E5 power chord position). Because every note is played closed with resting palm muting, the entire galloping engine can shift to D, C, F#, or A across the neck.'
    },
    techniques: ['palm-mute', 'hammer-on', 'pull-off', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'djent-high-gain-gate',
    recommendedPresetName: 'Modern Metal Tight Gate & Boost',
    pickupStyle: 'heavy',
    description: 'The heartbeat of British Heavy Metal. The driving 16th-note rhythm (eighth-two sixteenths: da... da-da, da... da-da) creates relentless forward momentum, punctuated by melodic single-string answers.',
    practiceTips: [
      'Rest the fleshy heel of your picking hand lightly right where the strings cross the bridge saddles.',
      'The pick stroke pattern is down, down-up, down, down-up (never let your right hand stumble out of sync).',
      'Keep palm pressure consistent: too light sounds buzzy; too heavy suppresses the note pitch completely.',
      'Lock in with the metronome at 100 BPM first before working up to Maiden\'s 144+ BPM stage tempo.'
    ],
    songs: [
      {
        title: 'The Trooper',
        artist: 'Iron Maiden',
        album: 'Piece of Mind',
        year: 1983,
        genre: 'Heavy Metal',
        key: 'Em',
        isPrimary: true,
        usageNote: 'The signature twin-guitar galloping charge depicting the Charge of the Light Brigade.'
      },
      {
        title: 'Master of Puppets',
        artist: 'Metallica',
        album: 'Master of Puppets',
        year: 1986,
        genre: 'Thrash Metal',
        key: 'Em',
        isPrimary: false,
        usageNote: 'Metallica adopted and accelerated this galloping palm-mute cadence for their thrash masterpieces.'
      },
      {
        title: 'Run to the Hills',
        artist: 'Iron Maiden',
        album: 'The Number of the Beast',
        year: 1982,
        genre: 'Heavy Metal',
        key: 'Em',
        isPrimary: false,
        usageNote: 'Steve Harris\'s bass and Adrian Smith\'s guitar gallop together in tight unison throughout the verses.'
      },
      {
        title: 'Painkiller',
        artist: 'Judas Priest',
        album: 'Painkiller',
        year: 1990,
        genre: 'Speed Metal',
        key: 'Em',
        isPrimary: false,
        usageNote: 'Glenn Tipton and K.K. Downing drove this gallop into furious speed metal overdrive.'
      }
    ],
    columns: [
      // Measure 1 - E5 Gallop (string 5 fret 7, string 4 fret 9)
      { id: 'mg1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg2', time: 0.5, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg3', time: 0.75, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg4', time: 1.0, duration: 0.5, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg5', time: 1.5, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg6', time: 1.75, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      // Melodic turnaround on strings 4 & 3
      { id: 'mg7', time: 2.0, duration: 0.5, notes: [{ string: 4, fret: 9, technique: 'normal' }], annotation: '' },
      { id: 'mg8', time: 2.5, duration: 0.5, notes: [{ string: 3, fret: 9, technique: 'hammer-on', targetFret: 11 }], annotation: '9h11' },
      { id: 'mg9', time: 3.0, duration: 0.5, notes: [{ string: 3, fret: 12, technique: 'pull-off', targetFret: 11 }], annotation: '12p11' },
      { id: 'mg10', time: 3.5, duration: 0.5, notes: [{ string: 3, fret: 9, technique: 'vibrato', vibrato: true }], annotation: '~' },
      // Measure 2 - Gallop and resolution
      { id: 'mg11', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg12', time: 4.5, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg13', time: 4.75, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg14', time: 5.0, duration: 0.5, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg15', time: 5.5, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      { id: 'mg16', time: 5.75, duration: 0.25, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'PM' },
      // Power chord hits (D5 to C5 to E5)
      { id: 'mg17', time: 6.0, duration: 0.5, notes: [{ string: 5, fret: 5 }, { string: 4, fret: 7 }], annotation: 'D5' },
      { id: 'mg18', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 3 }, { string: 4, fret: 5 }], annotation: 'C5' },
      { id: 'mg19', time: 7.0, duration: 1.0, notes: [{ string: 5, fret: 7 }, { string: 4, fret: 9 }], annotation: 'E5 !' }
    ]
  },
  {
    id: 'riff-funk-nile-rodgers',
    name: 'The 16th-Note Dorian Funk Vamp & Chucking',
    subtitle: 'Ultra-tight syncopated funk rhythm with percussive muted rakes and 9th chord stabs',
    primaryArtist: 'Chic (Nile Rodgers)',
    year: 1979,
    genre: 'Funk & R&B',
    difficulty: 'Intermediate',
    tempo: 112,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Dorian / Em7',
    scaleOrMode: 'E Dorian Mode',
    isMovable: true,
    movableConfig: {
      baseFret: 7,
      baseKey: 'E',
      rootString: 5,
      fretMinOffset: -5, // Down to B (2nd fret)
      fretMaxOffset: 5,  // Up to A (12th fret)
      explanation: 'Uses compact three-note closed triads and 9th voicings on the top 3-4 strings. Left-hand finger muting handles all syncopated stops, making this groove 100% transposable to any key.'
    },
    techniques: ['rake', 'dead-note', 'hammer-on', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'clean-funk-sparkle',
    recommendedPresetName: 'Funk Master Strat (Clean Quack + Comp)',
    pickupStyle: 'clean-quack',
    description: 'The foundation of disco, funk, and modern pop rhythm guitar. Nile Rodgers coined the technique "chucking": the right hand keeps an uninterrupted 16th-note motor running while the left hand alternates between pressing the frets and lifting off to mute.',
    practiceTips: [
      'Never stop your right wrist: keep swinging in an unbroken down-up-down-up 16th note pendulum.',
      'Squeeze the fretboard only on the beat accents; relax left-hand pressure immediately for the "chicka-chicka" dead notes.',
      'Select Stratocaster pickup position 4 (neck + middle) or position 2 (bridge + middle) for the hollow "quack" tone.',
      'Use a thin-to-medium pick (0.60mm to 0.73mm) for flexible strumming across strings without snagging.'
    ],
    songs: [
      {
        title: 'Good Times',
        artist: 'Chic (Nile Rodgers)',
        album: 'Risqué',
        year: 1979,
        genre: 'Funk / Disco',
        key: 'Em',
        isPrimary: true,
        usageNote: 'The most sampled groove in music history, directly fueling Sugarhill Gang\'s "Rapper\'s Delight" and Queen\'s "Another One Bites the Dust".'
      },
      {
        title: 'Get Lucky',
        artist: 'Daft Punk ft. Pharrell Williams & Nile Rodgers',
        album: 'Random Access Memories',
        year: 2013,
        genre: 'Nu-Disco / Funk',
        key: 'F#m',
        isPrimary: false,
        usageNote: 'Nile Rodgers brought this exact movable chucking technique into the 21st century Grammy-winning global hit.'
      },
      {
        title: 'Kiss',
        artist: 'Prince',
        album: 'Parade',
        year: 1986,
        genre: 'Funk',
        key: 'A',
        isPrimary: false,
        usageNote: 'Prince used this tight 16th-note Telecaster funk stab transposed to Key of A with extreme compression.'
      },
      {
        title: 'Cosmic Sans',
        artist: 'Cory Wong',
        album: 'Motivational Music for the Syncopated Soul',
        year: 2019,
        genre: 'Modern Funk',
        key: 'Dm',
        isPrimary: false,
        usageNote: 'Cory Wong\'s supersonic right-hand wrist technique is the modern evolution of this exact lick.'
      }
    ],
    columns: [
      // Measure 1 - Em7 to E9 funk syncopation
      { id: 'fk1', time: 0.0, duration: 0.25, measure: 1, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7' },
      { id: 'fk2', time: 0.25, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }, { string: 3, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk3', time: 0.5, duration: 0.25, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7' },
      { id: 'fk4', time: 0.75, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }, { string: 3, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk5', time: 1.0, duration: 0.25, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7' },
      { id: 'fk6', time: 1.25, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk7', time: 1.5, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk8', time: 1.75, duration: 0.25, notes: [{ string: 4, fret: 6 }, { string: 3, fret: 7 }, { string: 2, fret: 7 }, { string: 1, fret: 7 }], annotation: 'E9' },
      // Measure 1 beat 3 & 4
      { id: 'fk9', time: 2.0, duration: 0.25, notes: [{ string: 4, fret: 6 }, { string: 3, fret: 7 }, { string: 2, fret: 7 }, { string: 1, fret: 7 }], annotation: 'E9' },
      { id: 'fk10', time: 2.25, duration: 0.25, notes: [{ string: 3, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk11', time: 2.5, duration: 0.25, notes: [{ string: 3, fret: 7, technique: 'hammer-on', targetFret: 9 }, { string: 2, fret: 7 }], annotation: '7h9' },
      { id: 'fk12', time: 2.75, duration: 0.25, notes: [{ string: 3, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk13', time: 3.0, duration: 0.25, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7' },
      { id: 'fk14', time: 3.25, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk15', time: 3.5, duration: 0.25, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7' },
      { id: 'fk16', time: 3.75, duration: 0.25, notes: [{ string: 3, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      // Measure 2 - Dorian Single-Note Fill
      { id: 'fk17', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 5, fret: 7, technique: 'normal' }], annotation: 'Low E' },
      { id: 'fk18', time: 4.5, duration: 0.25, notes: [{ string: 4, fret: 5, technique: 'hammer-on', targetFret: 7 }], annotation: '5h7' },
      { id: 'fk19', time: 4.75, duration: 0.25, notes: [{ string: 3, fret: 7, technique: 'normal' }], annotation: '' },
      { id: 'fk20', time: 5.0, duration: 0.5, notes: [{ string: 2, fret: 8, technique: 'vibrato', vibrato: true }], annotation: '~' },
      { id: 'fk21', time: 5.5, duration: 0.5, notes: [{ string: 3, fret: 9, technique: 'pull-off', targetFret: 7 }], annotation: '9p7' },
      { id: 'fk22', time: 6.0, duration: 0.25, notes: [{ string: 4, fret: 7, technique: 'normal' }], annotation: '' },
      { id: 'fk23', time: 6.25, duration: 0.25, notes: [{ string: 4, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'fk24', time: 6.5, duration: 0.5, notes: [{ string: 4, fret: 6 }, { string: 3, fret: 7 }, { string: 2, fret: 7 }], annotation: 'E9' },
      { id: 'fk25', time: 7.0, duration: 1.0, notes: [{ string: 4, fret: 7 }, { string: 3, fret: 7 }, { string: 2, fret: 8 }], annotation: 'Em7 !' }
    ]
  },
  {
    id: 'riff-acdc-back-in-black',
    name: 'Open-String Hard Rock Monster Riff',
    subtitle: 'Crisp open E pedal drone with explosive E-D-A power chord punch and blues curl',
    primaryArtist: 'AC/DC (Angus & Malcolm Young)',
    year: 1980,
    genre: 'Classic Rock',
    difficulty: 'Beginner',
    tempo: 92,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor / E Major',
    scaleOrMode: 'E Blues Scale with Open Drone',
    isMovable: false, // <--- EXPLICITLY NOT MOVABLE!
    techniques: ['bend-quarter', 'pull-off', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'classic-rock-crunch',
    recommendedPresetName: '70s British Stack Crunch',
    pickupStyle: 'rock',
    description: 'One of the most recognizable guitar riffs ever written. The riff commands immense power precisely because it relies on the booming resonance of the open Low E, open D, and open A strings ringing in a silent room.',
    practiceTips: [
      'This riff CANNOT be easily moved to other keys without a physical capo because it fundamentally depends on the ringing open 6th, 5th, and 4th strings.',
      'Silence is as important as the notes: choke the strings completely with your right palm immediately after the D and A chord hits.',
      'The G note on fret 3 of the high E string receives a subtle "quarter bend" curl towards G# before pulling off to the open E string.',
      'Set your amplifier with moderate gain and high master volume for that uncompressed dynamic thud.'
    ],
    songs: [
      {
        title: 'Back in Black',
        artist: 'AC/DC',
        album: 'Back in Black',
        year: 1980,
        genre: 'Hard Rock',
        key: 'E',
        isPrimary: true,
        usageNote: 'The title track of the second best-selling album of all time.'
      },
      {
        title: 'Highway to Hell',
        artist: 'AC/DC',
        album: 'Highway to Hell',
        year: 1979,
        genre: 'Hard Rock',
        key: 'A',
        isPrimary: false,
        usageNote: 'Uses the exact same open-string chord voicings (A, D/F#, G) with open A pedal authority.'
      },
      {
        title: 'Rock and Roll',
        artist: 'Led Zeppelin (Jimmy Page)',
        album: 'Led Zeppelin IV',
        year: 1971,
        genre: 'Hard Rock',
        key: 'A',
        isPrimary: false,
        usageNote: 'Page pairs ringing open A and D strings with aggressive blues turnaround curls.'
      }
    ],
    columns: [
      // Measure 1 - E5 chord strike followed by rests
      { id: 'bb1', time: 0.0, duration: 1.0, measure: 1, notes: [{ string: 6, fret: 0 }, { string: 5, fret: 2 }, { string: 4, fret: 2 }], annotation: 'E5 Open' },
      // D chord hits
      { id: 'bb2', time: 1.0, duration: 0.25, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      { id: 'bb3', time: 1.33, duration: 0.25, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      { id: 'bb4', time: 1.66, duration: 0.34, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      // A chord hits
      { id: 'bb5', time: 2.0, duration: 0.25, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      { id: 'bb6', time: 2.33, duration: 0.25, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      { id: 'bb7', time: 2.66, duration: 0.34, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      // Blues lick 1 (High E string 3rd fret curl)
      { id: 'bb8', time: 3.0, duration: 0.25, notes: [{ string: 1, fret: 3, technique: 'bend-quarter', bendAmount: 0.5 }], annotation: '3b¼' },
      { id: 'bb9', time: 3.25, duration: 0.25, notes: [{ string: 1, fret: 0, technique: 'pull-off', targetFret: 0 }], annotation: '0' },
      { id: 'bb10', time: 3.5, duration: 0.25, notes: [{ string: 2, fret: 3, technique: 'bend-quarter', bendAmount: 0.5 }], annotation: '3b¼' },
      { id: 'bb11', time: 3.75, duration: 0.25, notes: [{ string: 2, fret: 0, technique: 'pull-off', targetFret: 0 }], annotation: '0' },
      // Measure 2 - E5 chord strike
      { id: 'bb12', time: 4.0, duration: 1.0, measure: 2, notes: [{ string: 6, fret: 0 }, { string: 5, fret: 2 }, { string: 4, fret: 2 }], annotation: 'E5 Open' },
      // D chord hits
      { id: 'bb13', time: 5.0, duration: 0.25, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      { id: 'bb14', time: 5.33, duration: 0.25, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      { id: 'bb15', time: 5.66, duration: 0.34, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D' },
      // A chord hits
      { id: 'bb16', time: 6.0, duration: 0.25, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      { id: 'bb17', time: 6.33, duration: 0.25, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      { id: 'bb18', time: 6.66, duration: 0.34, notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }, { string: 3, fret: 2 }], annotation: 'A' },
      // Ascending chromatic turnaround on low E string: 2-4-2-5-2-6-2-7
      { id: 'bb19', time: 7.0, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'bb20', time: 7.25, duration: 0.25, notes: [{ string: 5, fret: 4 }], annotation: '4' },
      { id: 'bb21', time: 7.5, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'bb22', time: 7.75, duration: 0.25, notes: [{ string: 5, fret: 5 }], annotation: '5' }
    ]
  },
  {
    id: 'riff-country-pedal-steel',
    name: 'Country Pedal-Steel Oblique Double-Stop Bend',
    subtitle: 'Singing oblique bend holding high E while bending the B string up a full tone',
    primaryArtist: 'Brent Mason / Brad Paisley',
    year: 1993,
    genre: 'Country',
    difficulty: 'Intermediate',
    tempo: 124,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'A Major / A Mixolydian',
    scaleOrMode: 'A Mixolydian / Major Pentatonic',
    isMovable: true,
    movableConfig: {
      baseFret: 5,
      baseKey: 'A',
      rootString: 6,
      fretMinOffset: -3, // Down to G (3rd fret)
      fretMaxOffset: 7,  // Up to E (12th fret)
      explanation: 'Uses no open strings. Root is on string 6 fret 5 or string 1 fret 5. Transpose across any key on the neck for that authentic Nashville pedal-steel crying sound.'
    },
    techniques: ['bend-full', 'bend-release', 'pull-off', 'hammer-on', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'country-tele-twang',
    recommendedPresetName: 'Nashville Telecaster Clean Twang',
    pickupStyle: 'twang',
    description: 'The defining trick of modern Nashville electric guitarists. By holding the high E string stationary with your pinky while bending the B string up a whole step with your ring and middle fingers, you perfectly simulate the crying mechanical pedals of a pedal-steel guitar.',
    practiceTips: [
      'The hardest part is pitch independence: do NOT allow the high E string to shift pitch while you push the B string upward.',
      'Use hybrid picking: pluck the B string with your pick and pluck the high E string with your middle finger for maximum snappy snap.',
      'Select a bright bridge pickup on a Telecaster or Strat with a subtle slapback delay and compressor.',
      'Release the bend gracefully on beat 4 into the chromatic slide.'
    ],
    songs: [
      {
        title: 'Hot Wired',
        artist: 'Brent Mason',
        album: 'Hot Wired',
        year: 1997,
        genre: 'Country / Western Swing',
        key: 'A',
        isPrimary: true,
        usageNote: 'Brent Mason\'s masterclass instrumental showcasing blazing pedal-steel emulation.'
      },
      {
        title: 'The Nervous Breakdown',
        artist: 'Brad Paisley',
        album: 'Who Needs Pictures',
        year: 1999,
        genre: 'Country',
        key: 'A',
        isPrimary: false,
        usageNote: 'Brad Paisley uses this exact lick to kick off his high-octane chicken-pickin\' guitar solo.'
      },
      {
        title: 'Sultans of Swing',
        artist: 'Dire Straits (Mark Knopfler)',
        album: 'Dire Straits',
        year: 1978,
        genre: 'Roots Rock',
        key: 'Dm / F',
        isPrimary: false,
        usageNote: 'Mark Knopfler incorporates this oblique double-stop bend fingerstyle in the celebrated second solo.'
      },
      {
        title: 'Workin\' Man Blues',
        artist: 'Merle Haggard (James Burton / Roy Nichols)',
        album: 'A Portrait of Merle Haggard',
        year: 1969,
        genre: 'Bakersfield Country',
        key: 'A',
        isPrimary: false,
        usageNote: 'The genesis of the West Coast telecaster chicken-pickin\' style.'
      }
    ],
    columns: [
      // Measure 1 - Oblique bend setup
      { id: 'ps1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 3, fret: 6, technique: 'normal' }], annotation: 'C#' },
      { id: 'ps2', time: 0.5, duration: 0.5, notes: [{ string: 2, fret: 5, technique: 'normal' }], annotation: 'E' },
      // Oblique bend: hold fret 5 on high E, bend fret 7 on B string
      {
        id: 'ps3',
        time: 1.0,
        duration: 1.0,
        notes: [
          { string: 1, fret: 5, technique: 'normal' },
          { string: 2, fret: 7, technique: 'bend-full', bendAmount: 2 }
        ],
        annotation: 'Steel Bend'
      },
      {
        id: 'ps4',
        time: 2.0,
        duration: 0.5,
        notes: [
          { string: 1, fret: 5, technique: 'normal' },
          { string: 2, fret: 7, technique: 'bend-release', bendAmount: 2, releaseToFret: 7 }
        ],
        annotation: 'Release'
      },
      { id: 'ps5', time: 2.5, duration: 0.5, notes: [{ string: 2, fret: 5, technique: 'pull-off', targetFret: 5 }], annotation: '7p5' },
      { id: 'ps6', time: 3.0, duration: 0.5, notes: [{ string: 3, fret: 6, technique: 'hammer-on', targetFret: 6 }], annotation: 'M3' },
      { id: 'ps7', time: 3.5, duration: 0.5, notes: [{ string: 4, fret: 7, technique: 'normal' }], annotation: 'Root A' },
      // Measure 2 - Snappy chicken pickin' cascade
      { id: 'ps8', time: 4.0, duration: 0.25, measure: 2, notes: [{ string: 3, fret: 7, technique: 'slide-up', targetFret: 9 }], annotation: '7/9' },
      { id: 'ps9', time: 4.25, duration: 0.25, notes: [{ string: 2, fret: 8, technique: 'normal' }], annotation: 'Snap' },
      { id: 'ps10', time: 4.5, duration: 0.5, notes: [{ string: 1, fret: 9, technique: 'vibrato', vibrato: true }], annotation: '~' },
      { id: 'ps11', time: 5.0, duration: 0.25, notes: [{ string: 2, fret: 8, technique: 'normal' }], annotation: '' },
      { id: 'ps12', time: 5.25, duration: 0.25, notes: [{ string: 3, fret: 9, technique: 'pull-off', targetFret: 7 }], annotation: '9p7' },
      { id: 'ps13', time: 5.5, duration: 0.5, notes: [{ string: 3, fret: 6, technique: 'normal' }], annotation: '' },
      { id: 'ps14', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 7, technique: 'normal' }], annotation: '' },
      { id: 'ps15', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 7, technique: 'normal' }], annotation: '' },
      { id: 'ps16', time: 7.0, duration: 1.0, notes: [{ string: 6, fret: 5, technique: 'vibrato', vibrato: true }], annotation: 'Root A ~' }
    ]
  },
  {
    id: 'riff-yngwie-phrygian-shred',
    name: 'Neo-Classical Phrygian Dominant Shred Run',
    subtitle: 'Lightning-fast descending harmonic minor cadence with rapid hammer-ons & pedal-point',
    primaryArtist: 'Yngwie Malmsteen',
    year: 1984,
    genre: 'Prog & Shred',
    difficulty: 'Advanced',
    tempo: 132,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'A Phrygian Dominant / D Harmonic Minor',
    scaleOrMode: 'A Phrygian Dominant (5th mode of D Harmonic Minor)',
    isMovable: true,
    movableConfig: {
      baseFret: 5,
      baseKey: 'A',
      rootString: 6,
      fretMinOffset: -4, // Down to F
      fretMaxOffset: 5,  // Up to D
      explanation: 'Uses closed linear scale shapes across strings 1, 2, and 3. Because every note is fretted without open strings, this dramatic baroque cadence moves seamlessly to E, B, or C#.'
    },
    techniques: ['hammer-on', 'pull-off', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: '80s-hair-metal-lead',
    recommendedPresetName: '80s Sunset Strip Shred Lead',
    pickupStyle: 'rock',
    description: 'The definitive neo-classical baroque guitar run popularized by Yngwie Malmsteen and Ritchie Blackmore. It blends the exotic Spanish/Middle-Eastern flavor of the Phrygian Dominant scale with Bach-style violin arpeggiation.',
    practiceTips: [
      'Maintain an upright left-hand posture with your thumb positioned flat on the middle of the back of the neck for maximum finger spread.',
      'Practice with a metronome at 60 BPM with 16th-note subdivision before accelerating: every pull-off must be crisp and percussive.',
      'Do not lift your index finger too far from the fretboard during pull-offs to maintain minimal hand movement.',
      'Use a bright overdrive pedal into a British stack with wide delay for that singing sustain.'
    ],
    songs: [
      {
        title: 'Black Star',
        artist: 'Yngwie Malmsteen',
        album: 'Rising Force',
        year: 1984,
        genre: 'Neo-Classical Metal',
        key: 'A Phrygian / Dm',
        isPrimary: true,
        usageNote: 'The groundbreaking instrumental opener that revolutionized rock guitar technique in 1984.'
      },
      {
        title: 'Gates of Babylon',
        artist: 'Rainbow (Ritchie Blackmore)',
        album: 'Long Live Rock \'n\' Roll',
        year: 1978,
        genre: 'Hard Rock',
        key: 'E Phrygian',
        isPrimary: false,
        usageNote: 'Blackmore\'s pioneering fusion of European classical scales with heavy rock orchestration.'
      },
      {
        title: 'Crazy Train',
        artist: 'Ozzy Osbourne (Randy Rhoads)',
        album: 'Blizzard of Ozz',
        year: 1980,
        genre: 'Heavy Metal',
        key: 'F#m',
        isPrimary: false,
        usageNote: 'Randy Rhoads interweaves classical minor scale runs with explosive blues bends in his legendary solo.'
      },
      {
        title: 'Highway Star',
        artist: 'Deep Purple (Ritchie Blackmore)',
        album: 'Machine Head',
        year: 1972,
        genre: 'Hard Rock',
        key: 'Dm',
        isPrimary: false,
        usageNote: 'Blackmore constructed the solo note-for-note using Bach-inspired violin arpeggios.'
      }
    ],
    columns: [
      // Measure 1 - High register descending cascade (16th notes)
      { id: 'yn1', time: 0.0, duration: 0.25, measure: 1, notes: [{ string: 1, fret: 10, technique: 'pull-off', targetFret: 9 }], annotation: '10p9' },
      { id: 'yn2', time: 0.25, duration: 0.25, notes: [{ string: 1, fret: 9, technique: 'pull-off', targetFret: 6 }], annotation: '9p6' },
      { id: 'yn3', time: 0.5, duration: 0.25, notes: [{ string: 1, fret: 6, technique: 'hammer-on', targetFret: 9 }], annotation: '6h9' },
      { id: 'yn4', time: 0.75, duration: 0.25, notes: [{ string: 1, fret: 10, technique: 'normal' }], annotation: '10' },
      { id: 'yn5', time: 1.0, duration: 0.25, notes: [{ string: 2, fret: 8, technique: 'normal' }], annotation: '8' },
      { id: 'yn6', time: 1.25, duration: 0.25, notes: [{ string: 2, fret: 7, technique: 'pull-off', targetFret: 5 }], annotation: '7p5' },
      { id: 'yn7', time: 1.5, duration: 0.25, notes: [{ string: 2, fret: 5, technique: 'hammer-on', targetFret: 7 }], annotation: '5h7' },
      { id: 'yn8', time: 1.75, duration: 0.25, notes: [{ string: 2, fret: 8, technique: 'normal' }], annotation: '8' },
      { id: 'yn9', time: 2.0, duration: 0.25, notes: [{ string: 3, fret: 7, technique: 'normal' }], annotation: '7' },
      { id: 'yn10', time: 2.25, duration: 0.25, notes: [{ string: 3, fret: 6, technique: 'pull-off', targetFret: 4 }], annotation: '6p4' },
      { id: 'yn11', time: 2.5, duration: 0.25, notes: [{ string: 3, fret: 4, technique: 'hammer-on', targetFret: 6 }], annotation: '4h6' },
      { id: 'yn12', time: 2.75, duration: 0.25, notes: [{ string: 3, fret: 7, technique: 'normal' }], annotation: '7' },
      { id: 'yn13', time: 3.0, duration: 0.5, notes: [{ string: 4, fret: 7, technique: 'vibrato', vibrato: true }], annotation: '~' },
      { id: 'yn14', time: 3.5, duration: 0.5, notes: [{ string: 4, fret: 5, technique: 'normal' }], annotation: '' },
      // Measure 2 - Dramatic Baroque Resolution
      { id: 'yn15', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 4, fret: 4, technique: 'normal' }], annotation: '' },
      { id: 'yn16', time: 4.5, duration: 0.5, notes: [{ string: 3, fret: 6, technique: 'normal' }], annotation: 'C#' },
      { id: 'yn17', time: 5.0, duration: 0.5, notes: [{ string: 2, fret: 5, technique: 'normal' }], annotation: 'E' },
      { id: 'yn18', time: 5.5, duration: 0.5, notes: [{ string: 1, fret: 6, technique: 'bend-half', bendAmount: 1 }], annotation: 'Bb b½' },
      { id: 'yn19', time: 6.0, duration: 0.5, notes: [{ string: 1, fret: 5, technique: 'normal' }], annotation: 'A' },
      { id: 'yn20', time: 6.5, duration: 0.5, notes: [{ string: 2, fret: 8, technique: 'pull-off', targetFret: 5 }], annotation: '8p5' },
      { id: 'yn21', time: 7.0, duration: 1.0, notes: [{ string: 3, fret: 6, technique: 'vibrato', vibrato: true }], annotation: 'Tonic ~' }
    ]
  },
  {
    id: 'riff-srv-texas-blues-turnaround',
    name: 'Texas Blues Open-E Shuffle Turnaround',
    subtitle: 'Driving Texas shuffle turnaround with chromatic descending double-stops over an open-E pedal',
    primaryArtist: 'Stevie Ray Vaughan / Robert Johnson',
    year: 1983,
    genre: 'Blues',
    difficulty: 'Intermediate',
    tempo: 126,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Blues',
    scaleOrMode: 'E Blues Scale with Open Bass Drone',
    isMovable: false, // <--- NOT MOVABLE (Relies on open E drone)
    techniques: ['slide-down', 'pull-off', 'hammer-on', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'texas-blues-solo',
    recommendedPresetName: 'Texas Blues Solo (TS808 + Tweed Deluxe)',
    pickupStyle: 'rock',
    description: 'The cornerstone 12-bar blues turnaround pattern in the key of E. Originating from Delta blues pioneer Robert Johnson and electrified by Stevie Ray Vaughan, this lick features ringing open-string resonance paired with chromatic sliding 6ths.',
    practiceTips: [
      'This riff CANNOT be transposed to another fret without a physical capo because the thumb continuously strikes the open 6th string as a bass drone while fingers 1 and 2 slide on the treble strings.',
      'Pluck the treble strings with your index and middle fingers while your pick or thumb handles the low E string.',
      'Keep the shuffle swing rhythm loose and bouncy: think "dah-da, dah-da, dah-da".',
      'The B7 chord stab at the end of measure 2 sets up the next 12-bar blues chorus.'
    ],
    songs: [
      {
        title: 'Pride and Joy',
        artist: 'Stevie Ray Vaughan and Double Trouble',
        album: 'Texas Flood',
        year: 1983,
        genre: 'Texas Blues',
        key: 'Eb / E',
        isPrimary: true,
        usageNote: 'The master turnaround concluding each verse of SRV\'s immortal Texas shuffle.'
      },
      {
        title: 'Sweet Home Chicago',
        artist: 'Robert Johnson',
        album: 'Vocalion 78 RPM / King of the Delta Blues Singers',
        year: 1936,
        genre: 'Delta Blues',
        key: 'E',
        isPrimary: false,
        usageNote: 'The acoustic Delta blues origins of this descending chromatic turnaround.'
      },
      {
        title: 'Crossroads (Live at Wheels of Fire)',
        artist: 'Cream (Eric Clapton)',
        album: 'Wheels of Fire',
        year: 1968,
        genre: 'Blues Rock',
        key: 'A / E',
        isPrimary: false,
        usageNote: 'Clapton modernized this turnaround with screaming Marshall tube saturation.'
      },
      {
        title: 'Cold Shot',
        artist: 'Stevie Ray Vaughan',
        album: 'Couldn\'t Stand the Weather',
        year: 1984,
        genre: 'Blues',
        key: 'Am / Em',
        isPrimary: false,
        usageNote: 'SRV pairs this turnaround with a rotating Leslie speaker cabinet.'
      }
    ],
    columns: [
      // Measure 1 - Chromatic descent from 4th fret to 1st fret
      {
        id: 'tt1',
        time: 0.0,
        duration: 0.5,
        measure: 1,
        notes: [
          { string: 6, fret: 0 },
          { string: 3, fret: 4 },
          { string: 1, fret: 4 }
        ],
        annotation: 'Open E Drone'
      },
      {
        id: 'tt2',
        time: 0.5,
        duration: 0.5,
        notes: [
          { string: 6, fret: 0 },
          { string: 3, fret: 3 },
          { string: 1, fret: 3 }
        ],
        annotation: 'Slide down'
      },
      {
        id: 'tt3',
        time: 1.0,
        duration: 0.5,
        notes: [
          { string: 6, fret: 0 },
          { string: 3, fret: 2 },
          { string: 1, fret: 2 }
        ],
        annotation: 'Fret 2'
      },
      {
        id: 'tt4',
        time: 1.5,
        duration: 0.5,
        notes: [
          { string: 6, fret: 0 },
          { string: 3, fret: 1 },
          { string: 1, fret: 0 }
        ],
        annotation: 'E7 chime'
      },
      // Bass walkup
      { id: 'tt5', time: 2.0, duration: 0.5, notes: [{ string: 5, fret: 0 }], annotation: 'Open A' },
      { id: 'tt6', time: 2.5, duration: 0.5, notes: [{ string: 5, fret: 1 }], annotation: 'A#' },
      { id: 'tt7', time: 3.0, duration: 0.5, notes: [{ string: 5, fret: 2 }], annotation: 'B' },
      { id: 'tt8', time: 3.5, duration: 0.5, notes: [{ string: 5, fret: 2 }], annotation: '' },
      // Measure 2 - B7 chord turnaround resolution
      {
        id: 'tt9',
        time: 4.0,
        duration: 0.75,
        measure: 2,
        notes: [
          { string: 5, fret: 2 },
          { string: 4, fret: 1 },
          { string: 3, fret: 2 },
          { string: 2, fret: 0 },
          { string: 1, fret: 2 }
        ],
        annotation: 'B7'
      },
      { id: 'tt10', time: 4.75, duration: 0.25, notes: [{ string: 6, fret: 0 }], annotation: '0' },
      { id: 'tt11', time: 5.0, duration: 0.5, notes: [{ string: 3, fret: 2, technique: 'bend-quarter', bendAmount: 0.5 }], annotation: '2b¼' },
      { id: 'tt12', time: 5.5, duration: 0.5, notes: [{ string: 3, fret: 0, technique: 'pull-off', targetFret: 0 }], annotation: '0' },
      { id: 'tt13', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 2, technique: 'vibrato', vibrato: true }], annotation: 'E ~' },
      { id: 'tt14', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 2 }], annotation: 'B' },
      {
        id: 'tt15',
        time: 7.0,
        duration: 1.0,
        notes: [
          { string: 5, fret: 2 },
          { string: 4, fret: 1 },
          { string: 3, fret: 2 },
          { string: 1, fret: 2 }
        ],
        annotation: 'B7 Turnaround'
      }
    ]
  },
  {
    id: 'riff-smoke-on-the-water',
    name: 'Smoke on the Water (The 4th Double-Stop Anthem)',
    subtitle: 'Parallel fourth double-stops plucked with thumb and index fingers',
    primaryArtist: 'Deep Purple (Ritchie Blackmore)',
    year: 1972,
    genre: 'Classic Rock',
    difficulty: 'Beginner',
    tempo: 112,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'G Minor / G Dorian',
    scaleOrMode: 'G Blues / Dorian Mode (Parallel 4ths)',
    isMovable: false,
    techniques: ['normal'],
    totalBeats: 12,
    recommendedPresetId: 'british-plexi-crunch',
    recommendedPresetName: 'Plexi Crunch & Drive (Marshall 1959SLP)',
    pickupStyle: 'rock',
    description: 'The universally recognized guitar riff that every guitarist learns. Ritchie Blackmore famously plucked the two middle strings (D and G) simultaneously with his right-hand thumb and index finger rather than a pick, producing snappy, percussive parallel 4th intervals.',
    practiceTips: [
      'This classic version uses open D and G strings for the root G5 chord, so it is a fixed open-string pattern in standard tuning.',
      'Pluck both strings simultaneously using your right-hand thumb on the D string and index finger on the G string.',
      'Kill each double-stop cleanly with your left hand on the rests; silence between the chords creates the famous punch.',
      'Keep your amplifier gain moderate: Blackmore used a 200W Marshall Major with light preamp breakup rather than fizzy high-gain.'
    ],
    songs: [
      {
        title: 'Smoke on the Water',
        artist: 'Deep Purple',
        album: 'Machine Head',
        year: 1972,
        genre: 'Hard Rock',
        key: 'Gm',
        isPrimary: true,
        usageNote: 'The defining opening riff written at Montreux Casino on Lake Geneva after Frank Zappa\'s concert fire.'
      },
      {
        title: 'Iron Man (Live Medley)',
        artist: 'Metallica',
        album: 'Live at Milton Keynes',
        year: 1993,
        genre: 'Heavy Metal',
        key: 'Gm',
        isPrimary: false,
        usageNote: 'Kirk Hammett and James Hetfield frequently jam this riff as an impromptu encore salute.'
      },
      {
        title: 'Cat\'s Squirrel',
        artist: 'Cream (Eric Clapton)',
        album: 'Fresh Cream',
        year: 1966,
        genre: 'Blues Rock',
        key: 'E',
        isPrimary: false,
        usageNote: 'Early British blues exploration of parallel 4th double-stops that inspired Blackmore\'s phrasing.'
      }
    ],
    columns: [
      // Measure 1: 0 - 3 - 5
      { id: 'sow1', time: 0.0, duration: 0.75, measure: 1, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 0 }], annotation: 'G5 (0)' },
      { id: 'sow2', time: 1.0, duration: 0.75, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb (3)' },
      { id: 'sow3', time: 2.0, duration: 1.5, notes: [{ string: 4, fret: 5 }, { string: 3, fret: 5 }], annotation: 'C (5)' },
      // Measure 2: 0 - 3 - 6 - 5
      { id: 'sow4', time: 4.0, duration: 0.75, measure: 2, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 0 }], annotation: 'G5 (0)' },
      { id: 'sow5', time: 5.0, duration: 0.75, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb (3)' },
      { id: 'sow6', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 6 }, { string: 3, fret: 6 }], annotation: 'Db (6)' },
      { id: 'sow7', time: 6.75, duration: 1.25, notes: [{ string: 4, fret: 5 }, { string: 3, fret: 5 }], annotation: 'C (5)' },
      // Measure 3: 0 - 3 - 5 - 3 - 0
      { id: 'sow8', time: 8.0, duration: 0.75, measure: 3, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 0 }], annotation: 'G5 (0)' },
      { id: 'sow9', time: 9.0, duration: 0.75, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb (3)' },
      { id: 'sow10', time: 10.0, duration: 1.0, notes: [{ string: 4, fret: 5 }, { string: 3, fret: 5 }], annotation: 'C (5)' },
      { id: 'sow11', time: 11.0, duration: 0.5, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb (3)' },
      { id: 'sow12', time: 11.5, duration: 0.5, notes: [{ string: 4, fret: 0 }, { string: 3, fret: 0 }], annotation: 'G5 (0)' }
    ]
  },
  {
    id: 'riff-stairway-to-heaven',
    name: 'Stairway to Heaven (Chromatic Arpeggio Cascade)',
    subtitle: 'Chromatic descending bassline with ringing high-E string fingerpicking',
    primaryArtist: 'Led Zeppelin (Jimmy Page)',
    year: 1971,
    genre: 'Classic Rock',
    difficulty: 'Intermediate',
    tempo: 76,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'A Minor',
    scaleOrMode: 'A Natural Minor / Chromatic Bass Walk',
    isMovable: false,
    techniques: ['normal'],
    totalBeats: 8,
    recommendedPresetId: 'folk-acoustic-sparkle',
    recommendedPresetName: 'Acoustic / Electric Clean Resonance',
    pickupStyle: 'acoustic',
    description: 'The monumental acoustic-electric intro to rock\'s most revered ballad. Jimmy Page weaves a chromatic descending bassline (A -> G# -> G -> F# -> F) against a stationary high A note on string 1, creating rich, evocative harmonic movement.',
    practiceTips: [
      'This riff relies on open string resonance (high open E ringing on the F major turnaround), making it fixed to standard tuning.',
      'Use Travis fingerpicking or classical P-I-M-A style (thumb plays bass notes on strings 4 and 5; index, middle, ring pluck strings 3, 2, and 1).',
      'Anchor your index finger on fret 5 of strings 1, 2, and 3 as a half-barre during the opening Am chord.',
      'Allow the notes to ring out into each other to build a lush, harp-like harmonic resonance.'
    ],
    songs: [
      {
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin IV',
        year: 1971,
        genre: 'Progressive / Hard Rock',
        key: 'Am',
        isPrimary: true,
        usageNote: 'The haunting opening acoustic/electric 12-string passage that builds into the climactic guitar solo.'
      },
      {
        title: 'Taurus',
        artist: 'Spirit (Randy California)',
        album: 'Spirit',
        year: 1968,
        genre: 'Psychedelic Rock',
        key: 'Am',
        isPrimary: false,
        usageNote: 'The famous instrumental featuring a similar Baroque descending bassline pattern.'
      },
      {
        title: 'Babe I\'m Gonna Leave You',
        artist: 'Led Zeppelin',
        album: 'Led Zeppelin I',
        year: 1969,
        genre: 'Folk Rock',
        key: 'Am',
        isPrimary: false,
        usageNote: 'Jimmy Page\'s earlier exploration of descending A-minor fingerpicked chromatic bass arpeggios.'
      }
    ],
    columns: [
      // Measure 1: Am (A bass) -> G# bass
      { id: 'sw1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 4, fret: 7 }], annotation: 'A Bass (7)' },
      { id: 'sw2', time: 0.5, duration: 0.5, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 5 }], annotation: 'Triad (5)' },
      { id: 'sw3', time: 1.0, duration: 0.5, notes: [{ string: 1, fret: 5 }], annotation: 'High E (5)' },
      { id: 'sw4', time: 1.5, duration: 0.5, notes: [{ string: 2, fret: 5 }], annotation: 'B string' },
      { id: 'sw5', time: 2.0, duration: 0.5, notes: [{ string: 4, fret: 6 }], annotation: 'G# Bass (6)' },
      { id: 'sw6', time: 2.5, duration: 0.5, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 5 }], annotation: '5' },
      { id: 'sw7', time: 3.0, duration: 0.5, notes: [{ string: 1, fret: 7 }], annotation: 'High (7)' },
      { id: 'sw8', time: 3.5, duration: 0.5, notes: [{ string: 2, fret: 5 }], annotation: '5' },
      // Measure 2: G bass -> F# bass -> F turnaround
      { id: 'sw9', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 4, fret: 5 }], annotation: 'G Bass (5)' },
      { id: 'sw10', time: 4.5, duration: 0.5, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 5 }], annotation: '5' },
      { id: 'sw11', time: 5.0, duration: 0.5, notes: [{ string: 1, fret: 8 }], annotation: 'High (8)' },
      { id: 'sw12', time: 5.5, duration: 0.5, notes: [{ string: 2, fret: 5 }], annotation: '5' },
      { id: 'sw13', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 4 }], annotation: 'F# Bass (4)' },
      { id: 'sw14', time: 6.5, duration: 0.5, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }], annotation: 'D/F#' },
      { id: 'sw15', time: 7.0, duration: 0.5, notes: [{ string: 1, fret: 2 }], annotation: '2' },
      { id: 'sw16', time: 7.5, duration: 0.5, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 2 }, { string: 2, fret: 1 }, { string: 1, fret: 0 }], annotation: 'Fmaj7 (0)' }
    ]
  },
  {
    id: 'riff-police-every-breath',
    name: 'Every Breath You Take (Palm-Muted Add9 Arpeggios)',
    subtitle: 'Classic 5-fret stretch add9 arpeggiation with pristine chorus and analog compression',
    primaryArtist: 'The Police (Andy Summers)',
    year: 1983,
    genre: 'Classic Rock',
    difficulty: 'Advanced',
    tempo: 117,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'G Major / E Minor',
    scaleOrMode: 'G Major Pentatonic / Add9 Voicings',
    isMovable: true,
    movableConfig: {
      baseFret: 3,
      baseKey: 'G',
      rootString: 6,
      fretMinOffset: -2, // Down to F
      fretMaxOffset: 5,  // Up to C
      explanation: 'Uses completely closed add9 chord shapes across strings 6, 5, 4, and 3 with zero open strings. Root is on string 6 (or string 5). Transpose this lush arpeggiated sound to any key across the fretboard.'
    },
    techniques: ['palm-mute'],
    totalBeats: 8,
    recommendedPresetId: '80s-chorus-clean',
    recommendedPresetName: '80s Crystalline Clean (Roland JC-120 + Chorus)',
    pickupStyle: 'clean-quack',
    description: 'Andy Summers\' breathtaking rhythmic arpeggiation featuring wide 5-fret finger stretches and steady palm muting. Instead of standard barres, Summers played Gadd9 (root, 5th, 9th, 3rd) and Em9 voicings through an Electro-Harmonix Electric Mistress flanger.',
    practiceTips: [
      'This shape requires a wide 5-fret stretch between index finger (fret 3 on string 6) and pinky finger (fret 7 on string 4).',
      'Keep your left-hand thumb low and centered on the back of the neck to maximize finger reach and avoid cramping.',
      'Maintain continuous light right-hand palm muting directly at the bridge saddles for a percussive marimba-like chop.',
      'Use strict alternate picking (down-up-down-up) on every 8th note for rhythmic consistency.'
    ],
    songs: [
      {
        title: 'Every Breath You Take',
        artist: 'The Police',
        album: 'Synchronicity',
        year: 1983,
        genre: 'New Wave / Pop Rock',
        key: 'G / A',
        isPrimary: true,
        usageNote: 'The Grammy Song of the Year track that drove Synchronicity to the top of the global charts.'
      },
      {
        title: 'I\'ll Be Missing You',
        artist: 'Puff Daddy ft. Faith Evans',
        album: 'No Way Out',
        year: 1997,
        genre: 'Hip Hop / R&B',
        key: 'G',
        isPrimary: false,
        usageNote: 'Directly sampled Summers\' guitar arpeggio as the emotional foundation of the tribute anthem.'
      },
      {
        title: 'Shadow Days',
        artist: 'John Mayer',
        album: 'Born and Raised',
        year: 2012,
        genre: 'Americana / Pop',
        key: 'G',
        isPrimary: false,
        usageNote: 'Mayer borrows Summers\' palm-muted add9 cross-string picking pattern in the clean rhythm track.'
      }
    ],
    columns: [
      // Measure 1: Gadd9 (3 - 5 - 7 - 4)
      { id: 'eb1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 6, fret: 3, palmMute: true }], annotation: 'G (3) PM' },
      { id: 'eb2', time: 0.5, duration: 0.5, notes: [{ string: 5, fret: 5, palmMute: true }], annotation: 'D (5) PM' },
      { id: 'eb3', time: 1.0, duration: 0.5, notes: [{ string: 4, fret: 7, palmMute: true }], annotation: 'A add9 (7)' },
      { id: 'eb4', time: 1.5, duration: 0.5, notes: [{ string: 3, fret: 4, palmMute: true }], annotation: 'B (4)' },
      { id: 'eb5', time: 2.0, duration: 0.5, notes: [{ string: 4, fret: 7, palmMute: true }], annotation: '7' },
      { id: 'eb6', time: 2.5, duration: 0.5, notes: [{ string: 3, fret: 4, palmMute: true }], annotation: '4' },
      { id: 'eb7', time: 3.0, duration: 0.5, notes: [{ string: 5, fret: 5, palmMute: true }], annotation: '5' },
      { id: 'eb8', time: 3.5, duration: 0.5, notes: [{ string: 4, fret: 7, palmMute: true }], annotation: '7' },
      // Measure 2: Em9 (String 5: 7 - 9 - 11 - 8)
      { id: 'eb9', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 5, fret: 7, palmMute: true }], annotation: 'E (7) PM' },
      { id: 'eb10', time: 4.5, duration: 0.5, notes: [{ string: 4, fret: 9, palmMute: true }], annotation: 'B (9) PM' },
      { id: 'eb11', time: 5.0, duration: 0.5, notes: [{ string: 3, fret: 11, palmMute: true }], annotation: 'F# (11)' },
      { id: 'eb12', time: 5.5, duration: 0.5, notes: [{ string: 2, fret: 8, palmMute: true }], annotation: 'G (8)' },
      { id: 'eb13', time: 6.0, duration: 0.5, notes: [{ string: 3, fret: 11, palmMute: true }], annotation: '11' },
      { id: 'eb14', time: 6.5, duration: 0.5, notes: [{ string: 2, fret: 8, palmMute: true }], annotation: '8' },
      { id: 'eb15', time: 7.0, duration: 0.5, notes: [{ string: 4, fret: 9, palmMute: true }], annotation: '9' },
      { id: 'eb16', time: 7.5, duration: 0.5, notes: [{ string: 3, fret: 11, palmMute: true }], annotation: '11' }
    ]
  },
  {
    id: 'riff-gnr-sweet-child',
    name: 'Sweet Child O\' Mine (String-Skipping Circular Hook)',
    subtitle: 'High-register cross-string arpeggiated loop originally devised as a finger exercise',
    primaryArtist: 'Guns N\' Roses (Slash)',
    year: 1987,
    genre: 'Classic Rock',
    difficulty: 'Intermediate',
    tempo: 126,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'D Major / D Mixolydian',
    scaleOrMode: 'D Major Pentatonic with Flat 7th',
    isMovable: true,
    movableConfig: {
      baseFret: 12,
      baseKey: 'D',
      rootString: 4,
      fretMinOffset: -5, // Down to A
      fretMaxOffset: 3,  // Up to F
      explanation: 'Played exclusively on closed frets (12, 14, 15) across strings 4, 3, 2, and 1. Because no open strings are used, the entire string-skipping pattern can transpose up and down the neck.'
    },
    techniques: ['normal'],
    totalBeats: 8,
    recommendedPresetId: 'marshall-jcm800-lead',
    recommendedPresetName: 'Appetite JCM800 (Neck Humbucker + Boost)',
    pickupStyle: 'rock',
    description: 'One of the greatest rock intro melodies ever recorded. Slash initially stumbled on the pattern during a band warmup as a playful circus-music finger exercise, which Axl Rose overheard and turned into the foundation of their #1 Billboard hit.',
    practiceTips: [
      'Switch to the neck humbucker pickup with tone rolled back slightly for Slash\'s thick, fluty "woman tone".',
      'The string skip from string 3 (G) to string 1 (high E) requires precise right-hand pick accuracy.',
      'Maintain steady alternate picking (down-up-down-up) throughout all eight 16th notes per bar.',
      'Keep fingers curved cleanly to avoid brushing adjacent strings when skipping across the B string.'
    ],
    songs: [
      {
        title: 'Sweet Child O\' Mine',
        artist: 'Guns N\' Roses',
        album: 'Appetite for Destruction',
        year: 1987,
        genre: 'Hard Rock',
        key: 'Db / D',
        isPrimary: true,
        usageNote: 'The unforgettable circular guitar hook that opens the track and anchors every verse transition.'
      },
      {
        title: 'Sweet Child O\' Mine (Acoustic)',
        artist: 'Sheryl Crow',
        album: 'The Globe Sessions',
        year: 1999,
        genre: 'Rock / Americana',
        key: 'D',
        isPrimary: false,
        usageNote: 'Grammy-winning roots-rock adaptation preserving the cross-string circular motif on acoustic guitar.'
      }
    ],
    columns: [
      // Measure 1: Root on D (string 4 fret 12)
      { id: 'sc1', time: 0.0, duration: 0.25, measure: 1, notes: [{ string: 4, fret: 12 }], annotation: 'D Root (12)' },
      { id: 'sc2', time: 0.25, duration: 0.25, notes: [{ string: 2, fret: 15 }], annotation: 'D Octave (15)' },
      { id: 'sc3', time: 0.5, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: 'A (14)' },
      { id: 'sc4', time: 0.75, duration: 0.25, notes: [{ string: 3, fret: 12 }], annotation: 'G (12)' },
      { id: 'sc5', time: 1.0, duration: 0.25, notes: [{ string: 1, fret: 15 }], annotation: 'G High (15)' },
      { id: 'sc6', time: 1.25, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: 'A (14)' },
      { id: 'sc7', time: 1.5, duration: 0.25, notes: [{ string: 1, fret: 14 }], annotation: 'F# (14)' },
      { id: 'sc8', time: 1.75, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: 'A (14)' },
      // Repeat Measure 1 beat 3 & 4
      { id: 'sc9', time: 2.0, duration: 0.25, notes: [{ string: 4, fret: 12 }], annotation: '12' },
      { id: 'sc10', time: 2.25, duration: 0.25, notes: [{ string: 2, fret: 15 }], annotation: '15' },
      { id: 'sc11', time: 2.5, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc12', time: 2.75, duration: 0.25, notes: [{ string: 3, fret: 12 }], annotation: '12' },
      { id: 'sc13', time: 3.0, duration: 0.25, notes: [{ string: 1, fret: 15 }], annotation: '15' },
      { id: 'sc14', time: 3.25, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc15', time: 3.5, duration: 0.25, notes: [{ string: 1, fret: 14 }], annotation: '14' },
      { id: 'sc16', time: 3.75, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      // Measure 2: Root shifts to E (string 4 fret 14)
      { id: 'sc17', time: 4.0, duration: 0.25, measure: 2, notes: [{ string: 4, fret: 14 }], annotation: 'E Root (14)' },
      { id: 'sc18', time: 4.25, duration: 0.25, notes: [{ string: 2, fret: 15 }], annotation: '15' },
      { id: 'sc19', time: 4.5, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc20', time: 4.75, duration: 0.25, notes: [{ string: 3, fret: 12 }], annotation: '12' },
      { id: 'sc21', time: 5.0, duration: 0.25, notes: [{ string: 1, fret: 15 }], annotation: '15' },
      { id: 'sc22', time: 5.25, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc23', time: 5.5, duration: 0.25, notes: [{ string: 1, fret: 14 }], annotation: '14' },
      { id: 'sc24', time: 5.75, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      // Measure 2 beat 3 & 4: Root shifts to C (string 3 fret 12)
      { id: 'sc25', time: 6.0, duration: 0.25, notes: [{ string: 3, fret: 12 }], annotation: 'C Root (12)' },
      { id: 'sc26', time: 6.25, duration: 0.25, notes: [{ string: 2, fret: 15 }], annotation: '15' },
      { id: 'sc27', time: 6.5, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc28', time: 6.75, duration: 0.25, notes: [{ string: 3, fret: 12 }], annotation: '12' },
      { id: 'sc29', time: 7.0, duration: 0.25, notes: [{ string: 1, fret: 15 }], annotation: '15' },
      { id: 'sc30', time: 7.25, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' },
      { id: 'sc31', time: 7.5, duration: 0.25, notes: [{ string: 1, fret: 14 }], annotation: '14' },
      { id: 'sc32', time: 7.75, duration: 0.25, notes: [{ string: 3, fret: 14 }], annotation: '14' }
    ]
  },
  {
    id: 'riff-metallica-enter-sandman',
    name: 'Enter Sandman (Heavy Metal Tritone Chug)',
    subtitle: 'Menacing low-E pedal drone with chromatic tritone slide and syncopated punch',
    primaryArtist: 'Metallica (Kirk Hammett & James Hetfield)',
    year: 1991,
    genre: 'Metal',
    difficulty: 'Beginner',
    tempo: 123,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor',
    scaleOrMode: 'E Blues / Aeolian (Tritone Bb to A)',
    isMovable: false,
    techniques: ['palm-mute', 'slide-down'],
    totalBeats: 8,
    recommendedPresetId: 'djent-high-gain-gate',
    recommendedPresetName: 'Modern Metal Tight Gate & Boost',
    pickupStyle: 'heavy',
    description: 'The titanic signature riff that launched Metallica into mainstream stadiums. Kirk Hammett wrote the core 2-bar riff at 3:00 AM, blending the open Low E bass pedal with the eerie tension of the flatted 5th (Bb tritone) sliding into the perfect 4th (A).',
    practiceTips: [
      'This riff relies on the booming resonance of the open Low E string, making it a fixed open-string pattern in standard tuning.',
      'The open E note must be palm-muted tight and heavy, while the melody notes on strings 5 and 4 ring out cleanly.',
      'The slide from fret 6 (Bb) to fret 5 (A) on the 5th string should be quick and articulate.',
      'Engage high gain with a noise gate pedal to eliminate unwanted hiss during the silent syncopated pauses.'
    ],
    songs: [
      {
        title: 'Enter Sandman',
        artist: 'Metallica',
        album: 'Metallica (The Black Album)',
        year: 1991,
        genre: 'Heavy Metal',
        key: 'Em',
        isPrimary: true,
        usageNote: 'The opening single and definitive live concert opener that sold over 16 million copies.'
      },
      {
        title: 'Overkill',
        artist: 'Motörhead (Fast Eddie Clarke)',
        album: 'Overkill',
        year: 1979,
        genre: 'Speed Metal',
        key: 'E',
        isPrimary: false,
        usageNote: 'Early NWOBHM exploration of driving open Low-E bass drone with sliding minor intervals.'
      }
    ],
    columns: [
      // Measure 1: Open E pedal into fret 7 on string 5 and fret 5 on string 4
      { id: 'es1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: 'Low E (0)' },
      { id: 'es2', time: 0.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: 'Low E (0)' },
      { id: 'es3', time: 1.0, duration: 0.5, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'es4', time: 1.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: '0' },
      { id: 'es5', time: 2.0, duration: 0.5, notes: [{ string: 4, fret: 5 }], annotation: 'G (5)' },
      { id: 'es6', time: 2.5, duration: 0.5, notes: [{ string: 5, fret: 6, technique: 'slide-down', targetFret: 5 }], annotation: '6/5 Slide' },
      { id: 'es7', time: 3.0, duration: 0.5, notes: [{ string: 5, fret: 5 }], annotation: 'A (5)' },
      { id: 'es8', time: 3.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: '0' },
      // Measure 2: Heavy repeating chug and punch
      { id: 'es9', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: 'Low E (0)' },
      { id: 'es10', time: 4.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: '0' },
      { id: 'es11', time: 5.0, duration: 0.5, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'es12', time: 5.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: '0' },
      { id: 'es13', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 5 }], annotation: 'G (5)' },
      { id: 'es14', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 6, technique: 'slide-down', targetFret: 5 }], annotation: '6/5' },
      { id: 'es15', time: 7.0, duration: 0.5, notes: [{ string: 5, fret: 5 }], annotation: 'A (5)' },
      { id: 'es16', time: 7.5, duration: 0.5, notes: [{ string: 6, fret: 0, palmMute: true }], annotation: '0' }
    ]
  },
  {
    id: 'riff-ozzy-crazy-train',
    name: 'Crazy Train (Pedal-Point Minor Scale Run)',
    subtitle: 'Lightning alternate-picked F# minor pedal riff anchored on the 6th string',
    primaryArtist: 'Ozzy Osbourne (Randy Rhoads)',
    year: 1980,
    genre: 'Classic Rock',
    difficulty: 'Intermediate',
    tempo: 138,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'F# Minor',
    scaleOrMode: 'F# Natural Minor (Aeolian)',
    isMovable: true,
    movableConfig: {
      baseFret: 2,
      baseKey: 'F#',
      rootString: 6,
      fretMinOffset: -2, // Down to E
      fretMaxOffset: 5,  // Up to B
      explanation: 'Uses completely closed fingerings on the 6th and 5th strings with no open strings. Root is on string 6 fret 2 (F#). Transpose this pedal-point lick to any key on the neck!'
    },
    techniques: ['normal'],
    totalBeats: 8,
    recommendedPresetId: '80s-hair-metal-lead',
    recommendedPresetName: '80s Sunset Strip Shred Lead',
    pickupStyle: 'rock',
    description: 'The defining metal intro of the 1980s. Classical guitar prodigy Randy Rhoads composed this driving pedal-point riff by alternating every melodic note on the A string against a bouncing low F# root note on the Low E string.',
    practiceTips: [
      'Maintain strict alternate picking (down-up-down-up) without letting the pick drift out of time.',
      'Keep your index finger anchored on fret 2 of the 6th string as your immovable home base.',
      'Use your ring finger for fret 4 and pinky finger for fret 5 on the 5th string.',
      'Lightly rest your right palm on the bridge for a subtle, articulate crunch.'
    ],
    songs: [
      {
        title: 'Crazy Train',
        artist: 'Ozzy Osbourne (Randy Rhoads)',
        album: 'Blizzard of Ozz',
        year: 1980,
        genre: 'Heavy Metal',
        key: 'F#m',
        isPrimary: true,
        usageNote: 'The immortal opening riff that launched Ozzy Osbourne\'s solo career.'
      },
      {
        title: 'Metalingus',
        artist: 'Alter Bridge (Mark Tremonti)',
        album: 'One Day Remains',
        year: 2004,
        genre: 'Hard Rock',
        key: 'Dm',
        isPrimary: false,
        usageNote: 'Mark Tremonti adopted this pedal-point construction for Edge\'s iconic WWE entrance theme.'
      }
    ],
    columns: [
      // Measure 1: F#2 - F#2 - C#4 - F#2 - D5 - F#2 - C#4 - F#2
      { id: 'ct1', time: 0.0, duration: 0.25, measure: 1, notes: [{ string: 6, fret: 2 }], annotation: 'F# (2)' },
      { id: 'ct2', time: 0.25, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: 'F# (2)' },
      { id: 'ct3', time: 0.5, duration: 0.25, notes: [{ string: 5, fret: 4 }], annotation: 'C# (4)' },
      { id: 'ct4', time: 0.75, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'ct5', time: 1.0, duration: 0.25, notes: [{ string: 5, fret: 5 }], annotation: 'D (5)' },
      { id: 'ct6', time: 1.25, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'ct7', time: 1.5, duration: 0.25, notes: [{ string: 5, fret: 4 }], annotation: 'C# (4)' },
      { id: 'ct8', time: 1.75, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      // Measure 1 beat 3 & 4: B -> A -> G# -> A
      { id: 'ct9', time: 2.0, duration: 0.25, notes: [{ string: 5, fret: 2 }], annotation: 'B (2)' },
      { id: 'ct10', time: 2.25, duration: 0.25, notes: [{ string: 6, fret: 5 }], annotation: 'A (5)' },
      { id: 'ct11', time: 2.5, duration: 0.25, notes: [{ string: 6, fret: 4 }], annotation: 'G# (4)' },
      { id: 'ct12', time: 2.75, duration: 0.25, notes: [{ string: 6, fret: 5 }], annotation: 'A (5)' },
      { id: 'ct13', time: 3.0, duration: 0.25, notes: [{ string: 5, fret: 2 }], annotation: 'B (2)' },
      { id: 'ct14', time: 3.25, duration: 0.25, notes: [{ string: 6, fret: 5 }], annotation: 'A (5)' },
      { id: 'ct15', time: 3.5, duration: 0.25, notes: [{ string: 6, fret: 4 }], annotation: 'G# (4)' },
      { id: 'ct16', time: 3.75, duration: 0.25, notes: [{ string: 6, fret: 5 }], annotation: 'A (5)' },
      // Measure 2 repeat
      { id: 'ct17', time: 4.0, duration: 0.25, measure: 2, notes: [{ string: 6, fret: 2 }], annotation: 'F# (2)' },
      { id: 'ct18', time: 4.25, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'ct19', time: 4.5, duration: 0.25, notes: [{ string: 5, fret: 4 }], annotation: '4' },
      { id: 'ct20', time: 4.75, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'ct21', time: 5.0, duration: 0.25, notes: [{ string: 5, fret: 5 }], annotation: '5' },
      { id: 'ct22', time: 5.25, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      { id: 'ct23', time: 5.5, duration: 0.25, notes: [{ string: 5, fret: 4 }], annotation: '4' },
      { id: 'ct24', time: 5.75, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: '2' },
      // Measure 2 resolution: B -> A -> G# -> E
      { id: 'ct25', time: 6.0, duration: 0.25, notes: [{ string: 5, fret: 2 }], annotation: 'B (2)' },
      { id: 'ct26', time: 6.25, duration: 0.25, notes: [{ string: 6, fret: 5 }], annotation: 'A (5)' },
      { id: 'ct27', time: 6.5, duration: 0.25, notes: [{ string: 6, fret: 4 }], annotation: 'G# (4)' },
      { id: 'ct28', time: 6.75, duration: 0.25, notes: [{ string: 6, fret: 2 }], annotation: 'F# (2)' },
      { id: 'ct29', time: 7.0, duration: 1.0, notes: [{ string: 6, fret: 2 }], annotation: 'F# Tonic ~' }
    ]
  },
  {
    id: 'riff-nirvana-teen-spirit',
    name: 'Smells Like Teen Spirit (4-Chord Grunge Anthem)',
    subtitle: 'Explosive dynamic swing between closed power chords and 16th-note scratch mutes',
    primaryArtist: 'Nirvana (Kurt Cobain)',
    year: 1991,
    genre: 'Grunge & Alt',
    difficulty: 'Beginner',
    tempo: 117,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'F Minor / F Dorian',
    scaleOrMode: 'F Minor Power Chords (F5 - Bb5 - Ab5 - Db5)',
    isMovable: true,
    movableConfig: {
      baseFret: 1,
      baseKey: 'F',
      rootString: 6,
      fretMinOffset: 0,
      fretMaxOffset: 7,
      explanation: 'Uses exclusively closed 5th power chord shapes (root and 5th) with left-hand fretboard dead-note scratches. Transpose this iconic 4-chord progression to any root key on the neck!'
    },
    techniques: ['dead-note', 'rake'],
    totalBeats: 8,
    recommendedPresetId: 'grunge-rat-distortion',
    recommendedPresetName: 'Seattle Grunge Dist (ProCo Rat + Twin Reverb)',
    pickupStyle: 'rock',
    description: 'The sonic explosion that shifted popular music overnight in 1991. Kurt Cobain built the riff around four simple power chords (F5 -> Bb5 -> Ab5 -> Db5) separated by four rapid percussive 16th-note scratch rakes, alternating between clean whispers and screaming distortion.',
    practiceTips: [
      'The magic is in the dead-note chucking: relax your left-hand finger pressure just enough to mute the strings without releasing your hand.',
      'Hit all six strings with your right hand during the muted strums ("chicka-chicka") for maximum percussive aggression.',
      'The chord transition from F5 on string 6 to Bb5 on string 5 requires simply moving your fingers down one string set.',
      'Pair a clean chorus pedal in the verses with a roaring distortion pedal stomped ON for the choruses.'
    ],
    songs: [
      {
        title: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        album: 'Nevermind',
        year: 1991,
        genre: 'Grunge / Alt Rock',
        key: 'Fm',
        isPrimary: true,
        usageNote: 'The definitive anthem of Generation X that knocked Michael Jackson from the top of the charts.'
      },
      {
        title: 'More Than a Feeling',
        artist: 'Boston',
        album: 'Boston',
        year: 1976,
        genre: 'Classic Rock',
        key: 'G',
        isPrimary: false,
        usageNote: 'Kurt Cobain openly acknowledged borrowing the I-IV-bVII-bIII power chord movement from Boston.'
      },
      {
        title: 'Song 2',
        artist: 'Blur',
        album: 'Blur',
        year: 1997,
        genre: 'Alt Rock',
        key: 'F#m',
        isPrimary: false,
        usageNote: 'British response adopting Nirvana\'s clean-to-explosive power chord dynamics.'
      }
    ],
    columns: [
      // Measure 1: F5 power chord (1 - 3 - 3) into scratch mutes into Bb5 (1 - 3 - 3)
      { id: 'ts1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 6, fret: 1 }, { string: 5, fret: 3 }, { string: 4, fret: 3 }], annotation: 'F5' },
      { id: 'ts2', time: 0.5, duration: 0.5, notes: [{ string: 6, fret: 1 }, { string: 5, fret: 3 }, { string: 4, fret: 3 }], annotation: 'F5' },
      { id: 'ts3', time: 1.0, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts4', time: 1.25, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts5', time: 1.5, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts6', time: 1.75, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts7', time: 2.0, duration: 0.5, notes: [{ string: 5, fret: 1 }, { string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb5' },
      { id: 'ts8', time: 2.5, duration: 0.5, notes: [{ string: 5, fret: 1 }, { string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb5' },
      { id: 'ts9', time: 3.0, duration: 0.5, notes: [{ string: 5, fret: 1 }, { string: 4, fret: 3 }, { string: 3, fret: 3 }], annotation: 'Bb5' },
      { id: 'ts10', time: 3.5, duration: 0.5, notes: [{ string: 6, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      // Measure 2: Ab5 power chord (4 - 6 - 6) into scratch mutes into Db5 (4 - 6 - 6)
      { id: 'ts11', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 6, fret: 4 }, { string: 5, fret: 6 }, { string: 4, fret: 6 }], annotation: 'Ab5' },
      { id: 'ts12', time: 4.5, duration: 0.5, notes: [{ string: 6, fret: 4 }, { string: 5, fret: 6 }, { string: 4, fret: 6 }], annotation: 'Ab5' },
      { id: 'ts13', time: 5.0, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts14', time: 5.25, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts15', time: 5.5, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts16', time: 5.75, duration: 0.25, notes: [{ string: 6, fret: -1, technique: 'dead-note' }, { string: 5, fret: -1, technique: 'dead-note' }], annotation: 'x' },
      { id: 'ts17', time: 6.0, duration: 0.5, notes: [{ string: 5, fret: 4 }, { string: 4, fret: 6 }, { string: 3, fret: 6 }], annotation: 'Db5' },
      { id: 'ts18', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 4 }, { string: 4, fret: 6 }, { string: 3, fret: 6 }], annotation: 'Db5' },
      { id: 'ts19', time: 7.0, duration: 0.5, notes: [{ string: 5, fret: 4 }, { string: 4, fret: 6 }, { string: 3, fret: 6 }], annotation: 'Db5' },
      { id: 'ts20', time: 7.5, duration: 0.5, notes: [{ string: 6, fret: -1, technique: 'dead-note' }], annotation: 'x' }
    ]
  },
  {
    id: 'riff-cream-sunshine-of-your-love',
    name: 'Sunshine of Your Love (Descending Blues Octave Riff)',
    subtitle: 'Classic heavy psychedelic blues-rock riff with chromatic walkdown and vocal woman tone',
    primaryArtist: 'Cream (Eric Clapton & Jack Bruce)',
    year: 1967,
    genre: 'Blues',
    difficulty: 'Beginner',
    tempo: 114,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'D Blues / D Minor Pentatonic',
    scaleOrMode: 'D Blues Scale (D - C - B - Bb - A - Ab - G - F)',
    isMovable: true,
    movableConfig: {
      baseFret: 12,
      baseKey: 'D',
      rootString: 4,
      fretMinOffset: -5,
      fretMaxOffset: 3,
      explanation: 'Root is on string 4 fret 12 (D) with descending chromatic notes across strings 5 and 6 with no open strings. Move this lick to Key of A (fret 7), E (fret 14), or C (fret 10).'
    },
    techniques: ['bend-quarter', 'vibrato'],
    totalBeats: 8,
    recommendedPresetId: 'hendrix-fuzz-vibe',
    recommendedPresetName: 'Classic Fuzz & Tube Drive',
    pickupStyle: 'rock',
    description: 'The archetype of psychedelic hard rock guitar. Bassist Jack Bruce wrote the riff after attending a Jimi Hendrix concert in London, and Eric Clapton added the iconic 10th-12th fret D octave punch and chromatic blue-note descent through his famous Gibson SG "Fool" guitar.',
    practiceTips: [
      'Roll your guitar\'s neck pickup tone control down to 0 while keeping volume at 10 for Clapton\'s signature "woman tone".',
      'The chromatic walk on the 5th string (frets 12 -> 11 -> 10) must be played in steady swing time.',
      'Give the final F note on the 5th string (fret 8) a slight blues curl (1/4 bend) before resolving to the D root on fret 10.',
      'Allow the low D note to ring out with wide finger vibrato.'
    ],
    songs: [
      {
        title: 'Sunshine of Your Love',
        artist: 'Cream',
        album: 'Disraeli Gears',
        year: 1967,
        genre: 'Psychedelic Rock / Blues',
        key: 'D',
        isPrimary: true,
        usageNote: 'Cream\'s signature hit that made power trios the gold standard of 1960s rock.'
      },
      {
        title: 'Sunshine of Your Love (Live)',
        artist: 'The Jimi Hendrix Experience',
        album: 'BBC Sessions',
        year: 1969,
        genre: 'Psychedelic Rock',
        key: 'D',
        isPrimary: false,
        usageNote: 'Hendrix famously stopped his live BBC broadcast of "Hey Joe" to break into this tribute to Cream.'
      }
    ],
    columns: [
      // Measure 1: D octave strikes into C and D
      { id: 'syl1', time: 0.0, duration: 0.5, measure: 1, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      { id: 'syl2', time: 0.5, duration: 0.5, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      { id: 'syl3', time: 1.0, duration: 0.5, notes: [{ string: 4, fret: 10 }], annotation: 'C (10)' },
      { id: 'syl4', time: 1.5, duration: 0.5, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      // Chromatic descent: 12 -> 11 -> 10 on string 5
      { id: 'syl5', time: 2.0, duration: 0.5, notes: [{ string: 5, fret: 12 }], annotation: 'A (12)' },
      { id: 'syl6', time: 2.5, duration: 0.5, notes: [{ string: 5, fret: 11 }], annotation: 'Ab (11)' },
      { id: 'syl7', time: 3.0, duration: 0.5, notes: [{ string: 5, fret: 10 }], annotation: 'G (10)' },
      { id: 'syl8', time: 3.5, duration: 0.5, notes: [{ string: 6, fret: 10 }], annotation: 'D (10)' },
      // Measure 2: Blue note F curl into D resolution
      { id: 'syl9', time: 4.0, duration: 0.5, measure: 2, notes: [{ string: 5, fret: 8, technique: 'bend-quarter', bendAmount: 0.5 }], annotation: 'F b¼' },
      { id: 'syl10', time: 4.5, duration: 0.5, notes: [{ string: 6, fret: 10, technique: 'vibrato', vibrato: true }], annotation: 'D ~' },
      { id: 'syl11', time: 5.0, duration: 0.5, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      { id: 'syl12', time: 5.5, duration: 0.5, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      { id: 'syl13', time: 6.0, duration: 0.5, notes: [{ string: 4, fret: 10 }], annotation: 'C (10)' },
      { id: 'syl14', time: 6.5, duration: 0.5, notes: [{ string: 4, fret: 12 }], annotation: 'D (12)' },
      { id: 'syl15', time: 7.0, duration: 1.0, notes: [{ string: 5, fret: 12 }], annotation: 'A (12) ~' }
    ]
  },
  {
    id: 'riff-white-stripes-seven-nation',
    name: 'Seven Nation Army (Octave Fuzz Anthem)',
    subtitle: 'The universal modern stadium chant played with sliding octave intervals',
    primaryArtist: 'The White Stripes (Jack White)',
    year: 2003,
    genre: 'Grunge & Alt',
    difficulty: 'Beginner',
    tempo: 124,
    timeSignature: [4, 4],
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor',
    scaleOrMode: 'E Natural Minor (Aeolian)',
    isMovable: true,
    movableConfig: {
      baseFret: 7,
      baseKey: 'E',
      rootString: 5,
      fretMinOffset: -5,
      fretMaxOffset: 5,
      explanation: 'Played entirely on the 5th string (A string) without open strings. Jack White played it on a semi-acoustic guitar through an octave-down pedal. Transpose to any key by shifting the 7th fret root up or down.'
    },
    techniques: ['slide-down'],
    totalBeats: 8,
    recommendedPresetId: 'classic-rock-crunch',
    recommendedPresetName: 'Plexi Crunch + Heavy Fuzz',
    pickupStyle: 'heavy',
    description: 'The biggest global sports and rock chant of the 21st century. Despite sounding like an electric bass, Jack White recorded the riff using a vintage 1950s semi-acoustic guitar routed through a DigiTech Whammy pedal set one octave down into a 1963 Sears Silvertone tube amp.',
    practiceTips: [
      'Play entirely on the 5th string with your ring finger or index finger sliding between fret positions.',
      'Keep the rhythm dotted: a long first note followed by a short pickup note into fret 10 (E ... E-G-E-D-C-B).',
      'The slide from fret 5 down to 3 and 2 should be completely connected without lifting your fret finger.',
      'Engage an octave-down effect or thick fuzz pedal for the authentic crushing low-end punch.'
    ],
    songs: [
      {
        title: 'Seven Nation Army',
        artist: 'The White Stripes',
        album: 'Elephant',
        year: 2003,
        genre: 'Garage Rock / Blues',
        key: 'Em',
        isPrimary: true,
        usageNote: 'Grammy Best Rock Song winner and universally chanted anthem at World Cup and Olympic stadiums.'
      },
      {
        title: 'Seven Nation Army (Soul Cover)',
        artist: 'Marcus Collins',
        album: 'Marcus Collins',
        year: 2012,
        genre: 'Soul / Pop',
        key: 'Em',
        isPrimary: false,
        usageNote: 'British UK Top 10 soul adaptation driven by the exact same sliding riff.'
      }
    ],
    columns: [
      // Measure 1: E (7) -> E (7) -> G (10) -> E (7) -> D (5)
      { id: 'sna1', time: 0.0, duration: 0.75, measure: 1, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'sna2', time: 0.75, duration: 0.25, notes: [{ string: 5, fret: 7 }], annotation: '7' },
      { id: 'sna3', time: 1.0, duration: 0.5, notes: [{ string: 5, fret: 10 }], annotation: 'G (10)' },
      { id: 'sna4', time: 1.5, duration: 0.75, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'sna5', time: 2.25, duration: 0.75, notes: [{ string: 5, fret: 5 }], annotation: 'D (5)' },
      { id: 'sna6', time: 3.0, duration: 1.0, notes: [{ string: 5, fret: 3 }], annotation: 'C (3)' },
      // Measure 2: B (2) -> E (7) -> E (7) -> G (10) -> E (7) -> D (5) -> C (3) -> D (5) -> C (3) -> B (2)
      { id: 'sna7', time: 4.0, duration: 1.0, measure: 2, notes: [{ string: 5, fret: 2 }], annotation: 'B (2)' },
      { id: 'sna8', time: 5.0, duration: 0.75, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'sna9', time: 5.75, duration: 0.25, notes: [{ string: 5, fret: 7 }], annotation: '7' },
      { id: 'sna10', time: 6.0, duration: 0.5, notes: [{ string: 5, fret: 10 }], annotation: 'G (10)' },
      { id: 'sna11', time: 6.5, duration: 0.5, notes: [{ string: 5, fret: 7 }], annotation: 'E (7)' },
      { id: 'sna12', time: 7.0, duration: 0.5, notes: [{ string: 5, fret: 5 }], annotation: 'D (5)' },
      { id: 'sna13', time: 7.5, duration: 0.5, notes: [{ string: 5, fret: 3 }], annotation: 'C (3)' }
    ]
  }
];
