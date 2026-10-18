(function (root) {
  const sources = [
    {
      id: "fraud",
      title: "Investor.gov · Independent checks and investment fraud",
      url: "https://www.investor.gov/protect-your-investments/fraud/how-avoid-fraud/what-you-can-do-avoid-investment-fraud",
    },
    {
      id: "etf",
      title: "Investor.gov · Understanding ETFs",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24",
    },
    {
      id: "fees",
      title: "Investor.gov · Fund fees and expenses",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/mutual-fund-and-etf-fees-and-expenses-investor-bulletin",
    },
    {
      id: "diversification",
      title: "Investor.gov · Asset allocation and diversification",
      url: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    },
    {
      id: "tokens",
      title: "SEC · Statement on tokenized securities (2026)",
      url: "https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities",
    },
  ];
  const lessons = [
    {
      id: "etf",
      title: "A basket, not a promise",
      topic: "ETF essentials",
      time: "4 min",
      objective: "Explain what an ETF share represents.",
      text: "An exchange-traded fund holds a collection of investments. Its shares trade on an exchange. Some track an index; others use an active manager. The wrapper does not remove the risks of what is inside.",
      task: "A fictional ETF owns shares in 500 companies. What do you hold when you buy a share of the fund?",
      options: [
        "A proportionate interest in the fund’s portfolio",
        "A guaranteed bank deposit",
        "Direct ownership of one entire company",
      ],
      answer: 0,
      why: "A fund share gives exposure to the portfolio. Its value can fall, and its holdings and costs still matter.",
      check: "Does every ETF follow a passive strategy?",
      checks: [
        "Yes, the ETF label means passive",
        "No, ETFs can be actively or passively managed",
      ],
      correct: 1,
      source: "etf",
      lab: "etf",
    },
    {
      id: "fees",
      title: "The quiet cost of small fees",
      topic: "Fees & compounding",
      time: "5 min",
      objective:
        "Separate annual expenses from the longer-term effect of fees.",
      text: "An expense ratio is an annual operating cost expressed as a percentage of fund assets. Costs reduce what remains invested. The total balance difference includes both fees paid and growth those fees might otherwise have earned. There can also be trading costs and taxes.",
      task: "Two fictional funds have identical gross returns. One charges 0.04% and the other 0.85%. Which ends with more under identical assumptions?",
      options: [
        "The lower-fee fund",
        "The higher-fee fund because cost proves quality",
        "They must end equal",
      ],
      answer: 0,
      why: "With the same gross return and timing, less is deducted from the lower-fee fund. This does not tell you which real fund will outperform.",
      check: "Is the ending balance difference equal to cumulative fees paid?",
      checks: ["Always", "No, the difference also includes foregone growth"],
      correct: 1,
      source: "fees",
      lab: "etf",
    },
    {
      id: "diversification",
      title: "Look inside the basket",
      topic: "Diversification",
      time: "5 min",
      objective: "Recognize concentration and overlapping holdings.",
      text: "Owning many funds can still leave you exposed to one industry. A broad US fund and a technology fund may hold the same large companies. International stocks and bonds add different exposures, but losses can still happen together.",
      task: "Your fictional portfolio has 90% in one technology fund and 10% in a broad stock fund. What deserves attention?",
      options: [
        "The number of fund names guarantees diversification",
        "Concentration and overlapping technology holdings",
        "The account’s display color",
      ],
      answer: 1,
      why: "Count the underlying exposures, not just the fund labels. Diversification can spread some risks; it cannot guarantee a profit or prevent all losses.",
      check: "Can a diversified portfolio lose money?",
      checks: ["Yes", "No"],
      correct: 0,
      source: "diversification",
      lab: "etf",
    },
    {
      id: "manipulation",
      title: "Pause before the pressure",
      topic: "Scam awareness",
      time: "6 min",
      objective: "Separate pressure tactics from verifiable facts.",
      text: "A deadline, a polished logo, and an enthusiastic testimonial can influence a decision without establishing legitimacy. Pause. Find an independent contact route. A warning sign calls for caution; uncertainty alone is not proof of wrongdoing.",
      task: "An AI trading ad promises zero-risk returns if you pay in the next ten minutes. What is the strongest next step?",
      options: [
        "Pay before the timer ends",
        "Verify the provider independently without using the ad’s links",
        "Trust it because AI removes uncertainty",
      ],
      answer: 1,
      why: "Urgency and guaranteed high returns are warning signs. Independent verification gives you better evidence than the promoter’s own claims.",
      check: "Does a generic greeting prove a message is fraudulent?",
      checks: ["Yes", "No, it is weak evidence on its own"],
      correct: 1,
      source: "fraud",
      lab: "investigations",
    },
    {
      id: "tokenization",
      title: "A record is only the beginning",
      topic: "Tokenized ownership",
      time: "5 min",
      objective: "Distinguish digital units from enforceable rights.",
      text: "A token can represent a claim described in an agreement. The digital record and the underlying asset need a trustworthy legal and operational connection. Custody, transfer restrictions, access recovery, and a way to resolve disputes all matter.",
      task: "A token’s webpage says you own part of a building. What would you verify?",
      options: [
        "Only the token’s icon",
        "Legal rights, custody, transfer rules, and the link to the asset",
        "Whether its price has increased today",
      ],
      answer: 1,
      why: "A ledger entry alone does not establish an enforceable claim to a building. Rights depend on the actual arrangement and applicable law.",
      check:
        "Does dividing an asset into tokens automatically create willing buyers?",
      checks: [
        "Yes",
        "No, liquidity depends on buyers and transfer conditions",
      ],
      correct: 1,
      source: "tokens",
      lab: "tokens",
    },
    {
      id: "final",
      title: "Make the informed decision",
      topic: "Final challenge",
      time: "6 min",
      objective: "Combine product understanding, costs, and verification.",
      text: "A fictional promoter combines three claims: an “AI ETF” has no downside, its tokenized units are instantly liquid, and there are “almost no fees.” Labels do not replace evidence. Examine holdings and expenses, establish legal rights, and verify the promoter independently.",
      task: "Which response uses all three skills?",
      options: [
        "Buy because three new technologies must be safer",
        "Ask for holdings and full costs, examine rights and transfer limits, and independently verify the promoter",
        "Reject every ETF because one ad is misleading",
      ],
      answer: 1,
      why: "An informed decision uses evidence about the product, the costs, and the provider. You can withhold judgment and money until you have enough information.",
      check: "Which achievement should this app reward?",
      checks: [
        "More simulated trades",
        "Careful verification and sound reasoning",
      ],
      correct: 1,
      source: "tokens",
      lab: "investigations",
    },
  ];
  const details =
    typeof module !== "undefined"
      ? require("./lesson-details")
      : root.LessonDetails;
  lessons.forEach((l) => Object.assign(l, details[l.id]));
  const data = { lessons, sources };
  if (typeof module !== "undefined") module.exports = data;
  else root.Content = data;
})(typeof window !== "undefined" ? window : globalThis);
