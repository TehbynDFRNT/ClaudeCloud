# Director's notes queued for the version after the current finals ship

Received during the statue build. To be applied after the three 9:16 finals with statue inserts are delivered.

## a) An audible build into the black, so the explosion lands on time
- The director: "there needs to be some auditory build as it goes to black to set up the explosion for proper timing".
- The plan:
  - A rising pressure build starts as S21 implodes into its point (about the last 1.3 s of S21).
  - It tightens through the whole dark hold (S22-dark, frames 2725-2778).
  - The explosion hits exactly on frame 2779, when the eruption first appears (S22-ignition).
  - The roar then continues as now into the shock front.
- This means moving the current main impact (now on 2725) to 2779 and keeping the climax the loudest moment.

## b) No statue after the explosion until after the Milky Way, then end on it with the title
- The director: "don't show the statue after the explosion until after the Milky Way and finish on that and end it with Nova: Sol Invictus or Nova: David or Nova: Prometheus in excellent font".
- Changes:
  - Remove inserts M13, M14, M15 and M16, the ones after ignition.
  - S23-S29b play whole again. S29b gets back its full length and has no end title.
  - The Milky Way coda (S31-newstar) stays, with "The birth of a new star; the Nova."
  - Add a final statue shot after the coda: the direct gaze into the lens. The film ends on it.
  - The title is set large in Cinzel Roman capitals (consider a molten-gold tint): **NOVA: DAVID** / **NOVA: SOL INVICTUS** / **NOVA: PROMETHEUS**.
- The 90-degree turn still ends on the direct stare in this last shot. Keeping `turn` at [508, 3590] reuses the M01-M12 renders, since the yaw clamps to 0 after 3590.
- The film grows by about 5 s, to about 2:51. The score needs a new ending under the final stare.

## c) The music restarts on the explosion, louder, with faster cannons
- The director: "restart the music at the moment the explosion hits but amp the decibels and increase tempo of cannons".
- Finding: the music just before bar 56 is wrong for an explosion. Source bars 53-54 (157.6-163.7 s) are a quiet solo at -41 to -38 dBFS. Bar 55 crescendos, and the closing tutti from bar 56 is the loudest music in the movement (-28 to -25 dBFS).
- So the restart is the bar-56 tutti landing exactly on the explosion frame (S22-ignition, 2779). That brings winter-b in 211 frames earlier than now:
  - Mix it about 4-6 dB hotter than the current return, so it is the loudest music in the film, riding with the explosion hit and the roar.
  - Cannons fire in fast rhythmic salvos with the returning tutti (1812-finale style), on beats rather than one per bar.
  - The approaching cannons also tighten their tempo into the strikes.
- Consequence for the picture: bars 56-63 plus the fermata last about 26.8 s (642 frames) from the explosion, against 871 frames of picture now.
  - The post-explosion sequence is re-timed to the bars:
    - S22-S25: eruption, shock front, shell.
    - S26-S28: expansion, devastation, survival, each about 3 s instead of 6 s.
    - S29a: ring, on bar 62.
    - S29b: drawing, on bar 63 and the fermata.
  - The coda then starts about 9 s earlier. With the final statue shot, the film runs about 2:45.
