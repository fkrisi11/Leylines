# Leylines

A browser remake of World of Warcraft's "uncross the lines" minigame. Points are joined by
straight lines. Click two points to swap them. When no two lines cross, the level is solved.

## Play

```bash
npm run serve
```

then visit http://localhost:8080.

- **Campaign** - 80 fixed levels in four sections of twenty: Apprentice (4–10 nodes),
  Journeyman (10–24), Expert (24–64) and Master (60–300). They mix the 22 Blingtron layouts,
  exact shapes (rings, grids, stars, spirals, nested rings) and seeded tangles. Solving a level
  unlocks the next in its section. Best times are kept in the browser.
- **Infinite** - levels of rising difficulty, one after another. Pick a tier in the
  menu: Easy (4-20 nodes), Normal (4-60), Hard (12-90) or Brutal (30-150).

**Line sway** gives every line its own slow, slight bow so overlapping
lines are easier to tell apart.

**Debug mode:** open `index.html?debug` - every level is unlocked, and the HUD shows Prev / Next
buttons, the level's name, and a "Peek solution" toggle that shows the untangled layout. Nothing
is saved while debugging.
