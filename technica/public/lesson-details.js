(function (root) {
  const details = {
    etf: {
      time: "7–9 min",
      sections: [
        {
          title: "Start with the holdings",
          text: "A portfolio is the collection of investments a fund holds. An exchange-traded fund, or ETF, divides an interest in that portfolio into shares that trade on an exchange. The holdings—not the three-letter label—determine the exposures you are taking.",
        },
        {
          title: "Understand the strategy",
          text: "An index is a defined group used as a reference. A passive fund aims to track an index, usually before fees. An active manager selects investments to pursue an objective. Either approach can lose money.",
        },
      ],
      example: {
        title: "Fictional example: Alex reads the fund description",
        text: "Harbor Total Market holds shares in many companies. Alex buys a share of the fund, not one whole company. If the companies lose value, the fund share can fall too.",
      },
      worked: {
        title: "Try looking through the label",
        text: "Compare the broad-market and technology examples in ETF Lab. The broad fund includes technology companies too. Different fund names do not necessarily mean different underlying investments.",
        link: "#etf",
        label: "Inspect the fictional funds",
      },
      misunderstanding:
        "“An ETF is automatically diversified and safe.” Some funds focus narrowly on one industry. Read holdings, risks, and expenses before drawing a conclusion.",
      more: "A fund’s net asset value is its assets minus liabilities, divided by its shares. The exchange trading price can differ from that value. This lesson does not model those price differences.",
      takeaway:
        "An ETF share gives exposure to a portfolio. Read what is inside and how it is managed.",
      nextLabel: "Compare annual expenses",
      next: "#lesson/fees",
      answerFeedback: [
        "Correct: you hold an interest in the fund’s portfolio, with the risks of those holdings.",
        "A fund is not a bank deposit. Its investments can decline; the ETF label supplies no deposit guarantee.",
        "The fund holds the companies’ shares. Buying one fund share does not give you an entire company.",
      ],
      checkFeedback: [
        "Passive and ETF describe different things. The ETF is the trading structure; its strategy can be active or passive.",
        "Correct: both active and passive strategies can use the ETF structure. Read the stated objective.",
      ],
    },
    fees: {
      time: "8–10 min",
      sections: [
        {
          title: "Translate a percentage into a cost",
          text: "The expense ratio expresses annual operating expenses as a percentage of a fund’s average net assets. Expenses reduce the value available to investors. Trading charges, taxes, and other costs can sit outside this ratio.",
        },
        {
          title: "Separate fees from foregone growth",
          text: "Compounding means a later return acts on what remains invested, including earlier gains or losses. A fee removes money from that base. The ending balance difference includes the deductions and the growth those deductions might otherwise have earned.",
        },
      ],
      example: {
        title: "Fictional example: the same return, different expenses",
        text: "Assume $10,000 grows by an invented 5% for one year. It reaches $10,500 before expenses. In our simplified model, a 1% expense then deducts $105, leaving $10,395. A $1,000 contribution added at year end makes the balance $11,395.",
      },
      worked: {
        title: "Change one assumption at a time",
        text: "In the fee comparison, keep the return and contribution timing equal. Change only one expense ratio. The calculator separates cumulative deductions from the total difference against a no-fee example.",
        link: "#etf",
        label: "Try the fee comparison",
      },
      misunderstanding:
        "“A higher fee proves better results.” Price alone does not establish skill or performance. Lower costs help under identical gross returns, but actual future gross returns can differ.",
      more: "Our annual model grows the opening balance, deducts expenses from that grown balance, then adds year-end contributions. Real funds generally accrue expenses through the year. With negative returns, the foregone-growth component can be negative.",
      takeaway:
        "Compare full costs using consistent assumptions. Cumulative fees and the ending balance difference are different quantities.",
      nextLabel: "Explore diversification",
      next: "#lesson/diversification",
      answerFeedback: [
        "Correct: with equal gross returns and timing, a smaller deduction leaves more invested. This does not predict real fund performance.",
        "A higher expense ratio is a cost, not evidence of a higher gross return. Under this question’s equal-return assumption it leaves less.",
        "The deductions differ, so equal gross returns do not produce equal net balances.",
      ],
      checkFeedback: [
        "Fees also change the amount exposed to later returns. The final difference need not equal the sum of deductions.",
        "Correct: the difference includes fees paid and the effect of leaving those amounts out of later growth or losses.",
      ],
    },
    diversification: {
      time: "7–9 min",
      sections: [
        {
          title: "Count exposures, not names",
          text: "An exposure is a part of the market your investments respond to, such as a sector or region. Concentration means a large share depends on similar outcomes. Overlap means different funds own some of the same investments.",
        },
        {
          title: "Test a shared setback",
          text: "Diversification spreads investments across different exposures. It can reduce dependence on one holding, but losses can still happen together. Bonds introduce different risks, including changing interest rates and an issuer failing to pay.",
        },
      ],
      example: {
        title: "Fictional example: Riley owns four funds",
        text: "Three technology funds make up 90% of Riley’s portfolio and share their largest holdings. Four fund names have not removed the technology concentration.",
      },
      worked: {
        title: "Compare two mixes under the same shock",
        text: "Save a technology-heavy mix in ETF Lab, then save a mix spread across stocks and bonds. Apply the same invented downturn to both. The result illustrates these assumptions; it does not identify an ideal allocation.",
        link: "#etf",
        label: "Test and compare fictional mixes",
      },
      misunderstanding:
        "“More funds always means less risk.” Added funds can repeat the same holdings. Look through the wrappers before counting diversification.",
      more: "Asset allocation is the division among asset types. Diversification also matters within an asset type. Neither the number of funds nor a single scenario captures every risk.",
      takeaway:
        "Inspect holdings and weights. Diversification is a way to spread risk, not a promise against loss.",
      nextLabel: "Investigate pressure tactics",
      next: "#lesson/manipulation",
      answerFeedback: [
        "The labels can hide the same underlying companies. Fund count alone is not enough to assess diversification.",
        "Correct: the 90% sector weight and potential overlap deserve attention before relying on the fund count.",
        "Display design changes neither the holdings nor their sensitivity to a sector setback.",
      ],
      checkFeedback: [
        "Correct: several exposures can decline together. Diversification does not guarantee protection.",
        "Different holdings can still lose value at the same time. Diversification is not insurance against every market loss.",
      ],
    },
    manipulation: {
      time: "8–10 min",
      sections: [
        {
          title: "Separate persuasion from evidence",
          text: "Urgency, scarcity, and social proof influence a decision. Social proof means relying on what other people appear to believe or do. Testimonials and a countdown do not establish who operates an offer or how returns would be generated.",
        },
        {
          title: "Use an independent route",
          text: "A warning sign is a reason for caution, not a complete investigation. Verification means checking through a route outside the message or promoter. A copied logo or generic greeting cannot establish identity on its own.",
        },
      ],
      example: {
        title: "Fictional example: an AI trading invitation",
        text: "Maya sees “zero risk” and a ten-minute payment deadline. A newly created account posts a profit screenshot. These details do not substantiate the guarantee; they give Maya reasons to pause and check independently.",
      },
      worked: {
        title: "Make an evidence-based choice",
        text: "In the first investigation, distinguish a guaranteed-return promise from a profile that needs verification and a posting time that tells you little. Choose a next step that gathers independent evidence.",
        link: "#case/A",
        label: "Review the guaranteed-return case",
      },
      misunderstanding:
        "“If I cannot prove it is genuine, it must be fraud.” You can withhold money and judgment while you seek better evidence.",
      more: "For an account alert, open a trusted app or use contact details you already have. For an investment offer, check official background records and full written terms. Do not use a promoter’s link as your only confirmation.",
      takeaway:
        "Pause the transaction, identify the claim, and choose a check independent of its source.",
      nextLabel: "Learn about tokenized rights",
      next: "#lesson/tokenization",
      answerFeedback: [
        "A small or quick payment still exposes money before you establish who is receiving it and on what terms.",
        "Correct: an independent route avoids relying on the same source for both the claim and its confirmation.",
        "AI is a tool, not protection from market losses or deception. The promise still needs evidence.",
      ],
      checkFeedback: [
        "A generic greeting is weak evidence. Assess the request and verify identity instead of treating one clue as a verdict.",
        "Correct: genuine and deceptive messages can use the same greeting. It does not settle authenticity.",
      ],
    },
    tokenization: {
      time: "8–10 min",
      sections: [
        {
          title: "Start with the agreement",
          text: "Tokenization uses digital units to represent an asset or rights connected to it. The agreement describes what a holder can claim and who owes that obligation. A digital record does not by itself tell you those rights.",
        },
        {
          title: "Follow a change in the record",
          text: "An ownership record, sometimes called a ledger, tracks who holds units. A transfer changes the recorded balances under the system’s rules. Settlement means completing that change. Legal recognition depends on the actual arrangement, not just the screen.",
        },
      ],
      example: {
        title: "Fictional example: 100 Coast House units",
        text: "Our lab assigns Maya 100 units in a made-up agreement. Each represents 1% of the example’s recorded units. Moving 10 to Jordan leaves Maya with 90 and Jordan with 10. This lab creates no claim on a real house.",
      },
      worked: {
        title: "Try the transfer and inspect both sides",
        text: "Create 100 units in the lab, transfer a few, and compare before and after balances. Then request more than the sender has. A rejected transfer should change neither balance nor total supply.",
        link: "#tokens",
        label: "Try the guided ownership example",
      },
      misunderstanding:
        "“A token always means legal title and an immediate buyer.” Rights vary across structures; transferability does not create demand.",
      more: "Custody concerns who controls access or holds assets. Smart contracts are software rules that can contain bugs or administrator powers. Legal rights, transfer restrictions, and regulatory obligations require examination in any real arrangement.",
      takeaway:
        "Ask what the units represent, who controls access, and how the agreement links the record to an asset.",
      nextLabel: "Combine your decision skills",
      next: "#lesson/final",
      answerFeedback: [
        "An icon describes neither legal rights nor the party responsible for delivering them.",
        "Correct: rights, custody, and transfer conditions explain what the digital entry might actually provide.",
        "A recent price increase does not establish enforceable rights or an ability to sell later.",
      ],
      checkFeedback: [
        "Dividing a record creates units, not buyers. A market can have little demand or restrictions on resale.",
        "Correct: liquidity requires willing counterparties and workable transfer conditions.",
      ],
    },
    final: {
      time: "9–12 min",
      sections: [
        {
          title: "Separate the product from the pitch",
          text: "A product’s structure explains what it holds and how it works. Marketing describes why a seller wants you to choose it. “AI,” “ETF,” and “tokenized” are labels to investigate, not substitutes for evidence.",
        },
        {
          title: "Build a short decision record",
          text: "Write three lines: what is claimed, what evidence is available, and what you still need to check. Keep arithmetic in a calculator and separate a hypothetical result from a forecast. It is reasonable to delay a decision when material facts remain unknown.",
        },
      ],
      example: {
        title: "Fictional example: three promises in one advertisement",
        text: "AutoPilot Coast offers an “AI ETF” with no downside, tokenized units with guaranteed resale, and “almost no fees.” Alex needs fund holdings and full costs, the unit agreement, exit conditions, and an independent check of the promoter.",
      },
      worked: {
        title: "Rehearse the evidence trail",
        text: "Use ETF Lab for the costs and exposure claims, the ownership example for transfer rules, and the Vault for verification questions. Then choose a response that addresses the missing evidence rather than trusting or rejecting a label.",
        link: "#investigations",
        label: "Choose an investigation",
      },
      misunderstanding:
        "“A well-researched decision must end in a purchase.” Sometimes the useful outcome is a clearer question or a decision not to proceed.",
      more: "A background record does not endorse a product. An illustrative low-fee balance does not forecast an actual return. A recorded transfer does not establish property rights. Each check answers only part of the overall question.",
      takeaway:
        "Explain what you know, what remains uncertain, and the independent checks your next step requires.",
      nextLabel: "Review your progress",
      next: "#progress",
      answerFeedback: [
        "Combining technologies does not eliminate the individual product, market, custody, and counterparty risks.",
        "Correct: this response examines costs, rights, exit conditions, and the provider without assuming that any label settles the decision.",
        "One misleading advertisement does not establish that every product using the same structure is deceptive.",
      ],
      checkFeedback: [
        "Trading frequency measures activity, not understanding. It can reward action without evidence.",
        "Correct: verification and reasoning transfer to future decisions, even when you choose not to invest.",
      ],
    },
  };
  if (typeof module !== "undefined") module.exports = details;
  else root.LessonDetails = details;
})(typeof window !== "undefined" ? window : globalThis);
