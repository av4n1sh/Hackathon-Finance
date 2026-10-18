(function (root) {
  "use strict";
  const sources = {
    checks: {
      title: "FINRA · Spot broker imposter scams (PDF)",
      url: "https://www.finra.org/sites/default/files/2025-05/how-to-spot-broker-imposter-scams.pdf",
    },
    registration: {
      title: "Investor.gov · False claims of SEC registration",
      url: "https://www.investor.gov/protect-your-investments/fraud/types-fraud/false-claims-sec-registration",
    },
    phishing: {
      title: "FTC · Recognize and avoid phishing",
      url: "https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams",
    },
    impersonation: {
      title: "FTC · Government impersonation scams",
      url: "https://consumer.ftc.gov/articles/how-avoid-government-impersonation-scam",
    },
    domains: {
      title: "FTC · Business email imposters",
      url: "https://www.ftc.gov/business-guidance/blog/2018/12/cybersecurity-small-business-business-email-imposters",
    },
    fraud: {
      title: "Investor.gov · Avoiding investment fraud",
      url: "https://www.investor.gov/protect-your-investments/fraud/how-avoid-fraud/what-you-can-do-avoid-investment-fraud",
    },
    etf: {
      title: "Investor.gov · Exchange-traded funds",
      url: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2",
    },
    fees: {
      title: "Investor.gov · Mutual fund and ETF fees",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/mutual-fund-and-etf-fees-and-expenses-investor-bulletin",
    },
    diversification: {
      title: "Investor.gov · Allocation and diversification",
      url: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    },
    strategies: {
      title: "Investor.gov · Fund characteristics and strategies",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/characteristics-mutual-funds-exchange-traded-funds",
    },
    digital: {
      title: "Investor.gov · Risks in crypto asset securities",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/crypto-asset-securities",
    },
    custody: {
      title: "Investor.gov · Crypto asset custody basics",
      url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/crypto-asset-custody-basics-retail-investors-investor-bulletin-0",
    },
    tokens: {
      title: "SEC · Tokenized securities: structures and rights",
      url: "https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities",
    },
  };
  const categories = [
    { id: "all", title: "All topics" },
    { id: "messages", title: "Messages & identity" },
    { id: "claims", title: "Claims & verification" },
    { id: "funds", title: "Funds & costs" },
    { id: "digital", title: "Digital assets & ownership" },
  ];
  const topics = [
    {
      id: "phishing",
      category: "messages",
      title: "Phishing",
      keywords: "sms smishing email password code credentials",
      meaning:
        "A deceptive message that tries to obtain information, money, or access through a link, attachment, or reply.",
      why: "An unexpected account alert can steer you toward a fake sign-in page.",
      example:
        "A fictional Northwind Savings text asks Jordan to enter a password through a link to “unlock” an account.",
      checks: [
        "Open the app or website through a route you already trust.",
        "Confirm the alert there before replying or opening an attachment.",
      ],
      misconception:
        "A familiar logo or a message containing your name does not authenticate the sender. A generic greeting alone does not establish fraud either.",
      sources: ["phishing"],
      related: ["impersonation", "domains"],
      cases: ["B"],
    },
    {
      id: "impersonation",
      category: "messages",
      title: "Impersonation",
      keywords: "caller id regulator government authority identity",
      meaning:
        "Someone claims another person’s or organization’s identity to gain your trust.",
      why: "Apparent authority can make an unusual payment request feel compulsory.",
      example:
        "A fictional caller claims to be a regulator and tells Sam to move savings to a “protected” account.",
      checks: [
        "End the conversation and find the organization’s contact details independently.",
        "Ask the actual organization whether the instruction is genuine.",
      ],
      misconception:
        "Caller ID and an employee number can be copied or invented. They are not independent evidence of identity.",
      sources: ["impersonation"],
      related: ["phishing", "verification"],
      cases: ["B", "C"],
    },
    {
      id: "domains",
      category: "messages",
      title: "Lookalike domains",
      keywords: "url address website sender hyperlink spoofing",
      meaning:
        "A web or email address made to resemble one you recognize, using small spelling changes or extra words.",
      why: "A plausible sender address can conceal that a request comes from somewhere else.",
      example:
        "In this fictional case, security@northwind-support.example.org claims to represent the bank at northwind.example.com.",
      checks: [
        "Compare the complete address against a trusted statement or bookmark.",
        "Treat the displayed link text and its actual destination as separate information.",
        "Contact the organization independently instead of testing a suspicious link.",
      ],
      misconception:
        "A convincing address is one clue, not proof that the sender or the offer is legitimate.",
      sources: ["domains"],
      related: ["phishing", "verification"],
      cases: ["B"],
    },
    {
      id: "returns",
      category: "claims",
      title: "Guaranteed-return claims",
      keywords: "guarantee yield zero risk ai trading profit",
      meaning:
        "A claim that you will receive a specified investment return regardless of what happens.",
      why: "High returns described as risk-free can discourage questions about possible losses.",
      example:
        "The fictional Tide Capital advertises 18% every month with “zero risk.”",
      checks: [
        "Ask who backs the promise and what the written terms actually cover.",
        "Verify the provider independently; do not rely on testimonials.",
      ],
      misconception:
        "An AI system or a polished presentation cannot turn a risky investment into a risk-free one.",
      sources: ["fraud"],
      related: ["pressure", "verification"],
      cases: ["A", "D"],
    },
    {
      id: "pressure",
      category: "claims",
      title: "Pressure tactics",
      keywords: "urgency scarcity deadline limited spots fear fomo",
      meaning:
        "A sales approach that pushes you to decide before you can examine the evidence.",
      why: "The fear of missing out can replace a careful assessment of costs and risk.",
      example:
        "A fictional promoter says only two places remain and refuses time to read the terms.",
      checks: [
        "Pause the payment and ask for documents to review.",
        "Check the claims outside the promoter’s own channels.",
      ],
      misconception:
        "A deadline is a reason to slow down, not conclusive proof of fraud by itself.",
      sources: ["fraud"],
      related: ["returns", "verification"],
      cases: ["A", "D"],
    },
    {
      id: "etfs",
      category: "funds",
      title: "Exchange-traded funds (ETFs)",
      keywords: "basket portfolio share exchange stocks bonds",
      meaning:
        "Funds with shares that trade on an exchange. A share represents an interest in the fund’s portfolio.",
      why: "The fund’s holdings and structure matter more than the familiar ETF label.",
      example:
        "A fictional broad-market fund holds shares in many companies. Its value falls when those holdings decline.",
      checks: [
        "Read the investment objective, holdings, and risk discussion.",
        "Compare the trading price, costs, and any premium or discount to the fund’s asset value.",
      ],
      misconception:
        "An ETF is not a bank deposit and does not guarantee a return.",
      sources: ["etf"],
      related: ["expenses", "diversification", "strategies"],
      cases: ["D"],
      lab: "etf",
    },
    {
      id: "expenses",
      category: "funds",
      title: "Expense ratios",
      keywords: "fees annual cost compounding management charges",
      meaning:
        "Annual fund operating expenses expressed as a percentage of the fund’s average net assets.",
      why: "Expenses reduce what stays invested. Small differences can accumulate over time.",
      example:
        "With a constant fictional $10,000 balance, a 0.10% annual expense is about $10. A changing balance changes the dollar cost.",
      checks: [
        "Read the prospectus fee table, including any temporary waiver.",
        "Check trading costs and other charges outside the expense ratio.",
        "Compare fees under the same return and timing assumptions.",
      ],
      misconception:
        "“Zero expense ratio” does not necessarily mean there are no other costs.",
      sources: ["fees"],
      related: ["etfs", "strategies"],
      cases: ["D"],
      lab: "etf",
    },
    {
      id: "diversification",
      category: "funds",
      title: "Diversification",
      keywords: "overlap concentration asset allocation sector holdings risk",
      meaning:
        "Spreading investments across different exposures rather than relying on one company, sector, or asset type.",
      why: "Several fund names can still conceal the same underlying concentration.",
      example:
        "Riley’s fictional technology funds all own the same five large companies.",
      checks: [
        "Compare underlying holdings and sector weights.",
        "Look for overlap across funds, not just the number of funds.",
        "Consider how different exposures might respond to the same event.",
      ],
      misconception:
        "Diversification can reduce concentration risk, but cannot guarantee profit or prevent losses.",
      sources: ["diversification"],
      related: ["etfs", "strategies"],
      cases: ["E"],
      lab: "etf",
    },
    {
      id: "strategies",
      category: "funds",
      title: "Active and passive investing",
      keywords: "index manager benchmark strategy management",
      meaning:
        "Passive funds aim to track an index. Active managers select investments to meet a stated objective.",
      why: "The strategy affects what a fund holds and how to assess its costs and results.",
      example:
        "One fictional fund follows a broad index; another manager selects a smaller group of companies.",
      checks: [
        "Identify the objective and a relevant benchmark.",
        "Compare holdings, expenses, and risks rather than labels alone.",
      ],
      misconception:
        "Neither active nor passive management guarantees outperformance. Both approaches can lose money.",
      sources: ["strategies"],
      related: ["etfs", "expenses", "diversification"],
      cases: ["D"],
      lab: "etf",
    },
    {
      id: "digital-assets",
      category: "digital",
      title: "Digital assets",
      keywords:
        "crypto cryptocurrency blockchain coin token security volatility",
      meaning:
        "A broad label for digitally recorded items or claims. Crypto assets can differ substantially in purpose, rights, and risk.",
      why: "Calling something a token does not explain what you can claim or how you might lose money.",
      example:
        "A fictional platform offers a token but supplies no explanation of its issuer or the holder’s rights.",
      checks: [
        "Identify the issuer, the actual rights, and the relevant disclosures.",
        "Ask how withdrawals, custody, and resale work.",
      ],
      misconception:
        "A platform’s use of familiar investing language does not establish that ordinary investor protections apply.",
      sources: ["digital"],
      related: ["tokenization", "custody", "private-keys"],
      cases: ["F"],
    },
    {
      id: "tokenization",
      category: "digital",
      title: "Tokenization and legal rights",
      keywords: "ledger ownership underlying asset property units liquidity",
      meaning:
        "Representing an asset or claim with digital units. The rights attached to those units depend on the arrangement.",
      why: "A record can exist without giving you the ownership rights you expected.",
      example:
        "A fictional Coast House token advertises property ownership, but the agreement only describes a claim against the platform.",
      checks: [
        "Read what the agreement gives the holder and who owes that obligation.",
        "Check how the underlying asset is held and how transfers are recognized.",
        "Ask about transfer restrictions and who could buy the units.",
      ],
      misconception:
        "A digital transfer alone does not establish property title, asset value, or a ready buyer.",
      sources: ["tokens"],
      related: ["digital-assets", "custody"],
      cases: ["F"],
      lab: "tokens",
    },
    {
      id: "custody",
      category: "digital",
      title: "Custody",
      keywords:
        "custodian wallet self third party storage withdrawal insolvency",
      meaning:
        "The arrangements for controlling and safeguarding access to assets. You may manage the keys yourself or rely on a third party.",
      why: "An account balance is different from an ability to access or withdraw assets.",
      example:
        "A fictional platform displays Morgan’s units but pauses withdrawals.",
      checks: [
        "Identify who controls the keys and who holds the assets.",
        "Read withdrawal rules and what happens if the provider fails.",
        "Ask about access recovery and the limits of any protection claimed.",
      ],
      misconception:
        "Using a third party does not remove risk; self-custody introduces responsibilities of its own.",
      sources: ["custody"],
      related: ["private-keys", "tokenization"],
      cases: ["F"],
    },
    {
      id: "private-keys",
      category: "digital",
      title: "Private keys and recovery phrases",
      keywords: "seed phrase password wallet access backup secret",
      meaning:
        "A private key authorizes crypto transactions. A recovery phrase can restore access to some wallets.",
      why: "Someone who obtains these secrets may gain control over the assets they protect.",
      example:
        "A fictional support agent asks Morgan for a seed phrase to release units.",
      checks: [
        "Do not send keys or recovery phrases to someone offering help.",
        "Understand the wallet’s backup and recovery process before relying on it.",
      ],
      misconception:
        "A public receiving address is different from a private key. Lost access may be unrecoverable without a valid recovery method.",
      sources: ["custody"],
      related: ["phishing", "custody"],
      cases: ["F"],
    },
    {
      id: "verification",
      category: "claims",
      title: "Independent verification",
      keywords:
        "registration brokercheck professional prospectus evidence official source check",
      meaning:
        "Testing a claim using information outside the channel of the person making it.",
      why: "A promoter’s own documents and references may repeat the same unsupported story.",
      example:
        "Alex checks a fictional adviser’s registration record rather than trusting the badge in an advertisement.",
      checks: [
        "Start with Investor.gov’s background-check resources.",
        "Compare the official record’s contact details with the person contacting you.",
        "Read the product documents and identify costs, risks, and who is responsible.",
      ],
      misconception:
        "A certificate or an SEC filing alone is not proof that a person is registered or an investment is approved.",
      sources: ["checks", "registration"],
      related: ["domains", "returns", "expenses"],
      cases: ["A", "B", "C"],
    },
  ];
  function search(query = "", category = "all") {
    const words = query
      .normalize("NFKC")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return topics.filter(
      (t) =>
        (category === "all" || t.category === category) &&
        words.every((word) =>
          [
            t.title,
            t.keywords,
            t.meaning,
            t.why,
            t.example,
            ...t.checks,
            t.misconception,
          ]
            .join(" ")
            .normalize("NFKC")
            .toLowerCase()
            .includes(word),
        ),
    );
  }
  const data = { sources, categories, topics, search };
  if (typeof module !== "undefined") module.exports = data;
  else root.Vault = data;
})(typeof window !== "undefined" ? window : globalThis);
