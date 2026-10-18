/* Authored RPG world. Symbols, dialogue, quests, and items can be translated together. */
(function (root) {
  const roles = [
    {
      id: "wayfinder",
      name: "Wayfinder",
      color: "#e4ad5f",
      detail: "Follow your curiosity. Find a route through changing plans.",
    },
    {
      id: "keeper",
      name: "Keeper",
      color: "#a8cda0",
      detail: "Look out for everyday needs, your own and other people’s.",
    },
    {
      id: "tinkerer",
      name: "Tinkerer",
      color: "#a7c5e0",
      detail: "Look closer at the small details. Compare how things work.",
    },
  ];
  const npcs = [
    {
      id: "mara",
      name: "Mara",
      title: "The lighthouse keeper",
      x: 3,
      y: 2,
      color: "#dfb167",
      step: 0,
      place: "Lighthouse cottage",
      greeting:
        "Welcome to Tidehaven, traveler. A useful purchase is waiting at the market. Let’s make a little room in your plan before you set off.",
    },
    {
      id: "jo",
      name: "Jo",
      title: "The ferry guide",
      x: 9,
      y: 2,
      color: "#aac9a1",
      step: 1,
      place: "Ferry crossing",
      greeting:
        "The usual route is closed today. The visit still matters. Let’s find a way there that works for everyone.",
    },
    {
      id: "inez",
      name: "Inez",
      title: "The ticket merchant",
      x: 12,
      y: 5,
      color: "#e6b3a0",
      step: 2,
      place: "Ticket stall",
      greeting:
        "Same travel pass, two ways to pay. The small print belongs in the price. Want to inspect the receipt with me?",
    },
    {
      id: "wren",
      name: "Wren",
      title: "The postmaster",
      x: 11,
      y: 8,
      color: "#b6b1dc",
      step: 3,
      place: "Message pier",
      greeting:
        "A message just arrived with a very urgent demand. A convincing story does not tell us who sent it. Let’s pause and investigate.",
    },
    {
      id: "tavi",
      name: "Tavi",
      title: "The repair merchant",
      x: 6,
      y: 7,
      color: "#82bdb5",
      step: 4,
      place: "Market square",
      greeting:
        "You made it to the market. New, repaired, or later: what works with your plan now? There’s more than one useful ending.",
    },
    {
      id: "pip",
      name: "Pip",
      title: "The wandering bookkeeper",
      x: 6,
      y: 4,
      color: "#e5bc77",
      side: "ledger",
      place: "Ledger grove",
      greeting:
        "The wind mixed up my receipts! Can you rebuild this tiny spending record? It uses separate practice money, so your quest wallet stays safe.",
    },
    {
      id: "fern",
      name: "Fern",
      title: "The garden steward",
      x: 2,
      y: 6,
      color: "#aac689",
      side: "garden",
      place: "Shared garden",
      greeting:
        "The garden needs drinking water and a step-free delivery route. We have $18 in separate fictional garden funds. Help me pack a workable kit.",
    },
    {
      id: "sol",
      name: "Sol",
      title: "The harbor cartographer",
      x: 3,
      y: 8,
      color: "#ddb1a3",
      place: "Traveler camp",
      greeting:
        "This harbor has no countdown. Walk, talk, and try another route whenever you like. Your Journal keeps quests, equipment, and discoveries together.",
    },
  ];
  // All rows are 16 tiles. Water, trees, rocks, and buildings block movement.
  const rows = [
    "TTTTT...TT...~~~",
    "T..B.....B...~~~",
    "T.............~~",
    "...====.======~~",
    "T..=..=......:~~",
    "...=..=====B.:~~",
    "...=..=......:~~",
    "..====B=====.:~~",
    "...........B.:~~",
    "TT....,,,,,,,::: ",
    "TTTT,,,,,~~~~~~~",
  ].map((row) => row.trimEnd().padEnd(16, "~"));
  const sideQuests = [
    {
      id: "ledger",
      name: "The scattered ledger",
      npc: "pip",
      description: "Collect three receipts and reconstruct what was spent.",
      reward: "Receipt pouch",
      xp: 40,
    },
    {
      id: "garden",
      name: "Water for the garden",
      npc: "fern",
      description: "Pack water and a step-free delivery route within $18.",
      reward: "Garden crest",
      xp: 40,
    },
  ];
  const receipts = [
    { id: "bread", name: "Shared lunch", cents: 700 },
    { id: "ride", name: "Bus ride", cents: 500 },
    { id: "repair", name: "Small repair", cents: 300 },
  ];
  const supplies = [
    {
      id: "refill",
      name: "Refill drinking water",
      cents: 400,
      note: "Bring a clean container · 20-minute refill stop.",
    },
    {
      id: "sealed",
      name: "Sealed drinking water",
      cents: 900,
      note: "Ready to collect · less waiting, higher price.",
    },
    {
      id: "cart",
      name: "Step-free cart delivery",
      cents: 600,
      note: "A route that avoids the stairs.",
    },
  ];
  const items = [
    {
      id: "festival-pin",
      name: "Lanternwake pin",
      icon: "lantern",
      festival: true,
      lesson: "fees",
      detail:
        "Three lanterns restored through building, cash handling, and route planning.",
    },
    {
      id: "notebook",
      name: "Traveler’s notebook",
      icon: "book",
      lesson: "plan",
      detail: "Your starting tool. Keep needs and choices in view.",
    },
    {
      id: "compass",
      name: "Planner’s compass",
      icon: "compass",
      chapter: 0,
      lesson: "plan",
      detail: "A reminder to make room for what matters.",
    },
    {
      id: "boots",
      name: "Flexible-route boots",
      icon: "boots",
      chapter: 1,
      lesson: "unexpected",
      detail: "A reminder to compare time, access, and cost.",
    },
    {
      id: "lens",
      name: "Full-price lens",
      icon: "lens",
      chapter: 2,
      lesson: "fees",
      detail: "Look for fees beyond the advertised price.",
    },
    {
      id: "lantern",
      name: "Verification lantern",
      icon: "lantern",
      chapter: 3,
      lesson: "safe",
      detail: "Pause and find contact details independently.",
    },
    {
      id: "kit",
      name: "Repairer’s kit",
      icon: "tools",
      chapter: 4,
      lesson: "borrow",
      detail: "Compare the whole cost and useful life.",
    },
    {
      id: "pouch",
      name: "Receipt pouch",
      icon: "receipt",
      side: "ledger",
      lesson: "fees",
      detail: "Earned by rebuilding Pip’s ledger.",
    },
    {
      id: "crest",
      name: "Garden crest",
      icon: "leaf",
      side: "garden",
      lesson: "saving",
      detail: "Earned by comparing a shared supply plan.",
    },
  ];
  const data = {
    roles,
    npcs,
    rows,
    width: 16,
    height: 11,
    start: { x: 4, y: 8 },
    sideQuests,
    receipts,
    supplies,
    items,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.HarborWorld = data;
})(typeof window === "undefined" ? globalThis : window);
