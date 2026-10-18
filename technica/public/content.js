/* English catalogue: replace only with fully translated, reviewed content. */
(function (root) {
  const sources = {
    planning: {
      title: "CFPB · Your Money, Your Goals toolkit",
      url: "https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/",
    },
    saving: {
      title: "CFPB · Building an emergency fund",
      url: "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/",
    },
    safety: {
      title: "FTC · Recognize gift card scams",
      url: "https://consumer.ftc.gov/consumer-alerts/2026/01/no-thats-not-your-boss-asking-you-buy-gift-cards",
    },
  };
  const lessons = [
    {
      id: "plan",
      icon: "01",
      title: "How can I plan my spending?",
      intro:
        "Start with what is available now and what needs to be paid before more money arrives. A plan can change when your needs change.",
      example:
        "You have $140. Set aside $60 for food, shared household costs, and caregiving. That leaves $80 for this story’s other choices. Setting money aside can mean an envelope of cash; no bank account is needed.",
      detail:
        "An essential expense is something you need for health, safety, or daily life. Your essentials can differ from someone else’s. If money cannot cover them, that is a resource gap, not a personal failure.",
      question:
        "A shared bill is higher than expected. What is a useful next step?",
      choices: [
        "Update the plan and compare what can move.",
        "Treat the old plan as fixed.",
      ],
      answer: 0,
      feedback:
        "A plan is a tool you can revise. Check urgent needs and possible changes without blaming yourself.",
      source: "planning",
      step: 0,
    },
    {
      id: "fees",
      icon: "02",
      title: "How do small fees add up?",
      intro:
        "A fee is an extra charge. Compare the whole price, including fees, and the time or access each option requires.",
      example:
        "A pass costs $12 at a counter or $12 plus a $3 service fee online. The totals are $12 and $15. The counter saves $3, but getting there takes time.",
      detail:
        "A lower price is not always the more useful option. Travel, disability access, opening hours, and caregiving can make a paid service worthwhile. Check recurring charges as well as one-time fees.",
      question: "Which comparison includes the full cost?",
      choices: [
        "Compare only the advertised price.",
        "Compare price, fees, and practical access.",
      ],
      answer: 1,
      feedback:
        "The full price and practical access both matter. A fee can be a reasonable trade-off when it solves an access problem.",
      source: "planning",
      step: 2,
    },
    {
      id: "safe",
      icon: "03",
      title: "What should I check before sending money?",
      intro:
        "Pause when a request is unexpected or urgent. Contact the person or organization through a number or address you already trust, outside the message.",
      example:
        "A message claims your parcel is held and asks for a $15 gift card code. You open the delivery company’s official website yourself. There is no such charge in this fictional story.",
      detail:
        "A gift card code works like money: sharing it can let someone spend the balance. Scammers use urgency and impersonation. If you already paid, contact the gift card company quickly and keep the receipt. Being targeted is not your fault.",
      question: "How could you check an urgent request?",
      choices: [
        "Use the link in the request.",
        "Find official contact details independently.",
      ],
      answer: 1,
      feedback:
        "Independent contact avoids relying on a link or number supplied by the sender. A familiar name alone does not verify a request.",
      source: "safety",
      step: 3,
    },
    {
      id: "saving",
      icon: "04",
      title: "How can I save when my income changes?",
      intro:
        "Plan around money that has arrived, then revisit the plan when more comes in. There is no percentage everyone must save.",
      example:
        "You receive $40 from occasional work. After urgent expenses you set aside $4. Next week you may need that $4 for food. Using it for a need is a valid use of your money.",
      detail:
        "Cash flow means when money arrives and when it leaves. A small buffer can help when those dates do not match. Some weeks nothing is left to save; support or changes to payment timing may matter more than a savings target.",
      question: "Income is delayed. What can a flexible plan do?",
      choices: [
        "Recheck urgent costs before setting aside savings.",
        "Require the same savings amount regardless.",
      ],
      answer: 0,
      feedback:
        "Changing your savings plan to meet immediate needs is reasonable. A goal can wait when essentials cannot.",
      source: "saving",
      step: 1,
    },
    {
      id: "borrow",
      icon: "05",
      title: "What happens when I borrow money?",
      intro:
        "Borrowing means using money now and agreeing to repay it. Interest is a charge for borrowing. Fees may add to the total too.",
      example:
        "In a fictional offer, you borrow $20 and repay $23 in two weeks. The borrowing cost is $3. Check whether repayment fits alongside your other needs.",
      detail:
        "Read the total repayment, due dates, and late-payment terms. “Pay later” is still a commitment. Compare delaying a purchase, changing the plan, or available support. This lesson does not recommend a particular loan.",
      question: "What should you check before agreeing?",
      choices: [
        "Only the amount received today.",
        "Total repayment, dates, and late-payment consequences.",
      ],
      answer: 1,
      feedback:
        "The future commitment matters as much as the amount available today. Ask for unclear terms in plain language.",
      source: "planning",
      step: 4,
    },
    {
      id: "unexpected",
      icon: "06",
      title: "What if an unexpected expense comes up?",
      intro:
        "Check what needs attention first. Compare options by safety, access, time, and cost. Needing to change a goal is not failure.",
      example:
        "Your usual $8 bus trip is cancelled. A $14 accessible shuttle can get you to a caregiving visit. A free ride tomorrow costs less, but means rearranging the visit.",
      detail:
        "A buffer is money left for changes or surprises. It can be cash or another suitable form. If there is no buffer, start with urgent needs and available help; do not assume everyone can cover a surprise.",
      question: "What makes an option workable?",
      choices: [
        "Its cost together with access and urgent needs.",
        "Always choosing the lowest price.",
      ],
      answer: 0,
      feedback:
        "The cheapest option may not meet an essential need. Trade-offs depend on the situation.",
      source: "saving",
      step: 1,
    },
  ];
  const goals = [
    {
      id: "bag",
      name: "A dependable everyday bag",
      item: "bag",
      price: 4800,
      description: "For errands, work, or study. Your old one is wearing out.",
    },
    {
      id: "coat",
      name: "A raincoat for everyday trips",
      item: "raincoat",
      price: 4200,
      description: "Stay dry while walking or waiting for transport.",
    },
  ];
  const reflection = (question, options, correct, feedback) => ({
    question,
    options,
    correct,
    feedback,
  });
  const steps = [
    {
      title: "A renewal you nearly missed",
      scene: "Monday · Make room for what matters",
      lesson: "plan",
      skill: "Thoughtful planner",
      text: "Your entertainment subscription renews today for $12. You enjoy it, and could also pause it for a week. Your household essentials are already set aside.",
      choices: [
        {
          title: "Pause this renewal",
          cost: 0,
          note: "Keep $12 for other choices.",
          effect:
            "You pause before renewal. There is more room in your plan, and no subscription access this week.",
        },
        {
          title: "Keep it this week",
          cost: 1200,
          note: "$12 · Keep something you enjoy.",
          effect:
            "You keep something you value. Flexible money decreases by $12; your purchase goal may take longer.",
        },
      ],
      reflection: reflection(
        "What did this choice involve?",
        [
          "Balancing enjoyment now with another goal.",
          "A subscription is always a bad choice.",
        ],
        0,
        "Both paths can be reasonable. Naming the trade-off is the skill.",
      ),
    },
    {
      title: "The trip changes",
      scene: "Tuesday · An unexpected expense",
      lesson: "unexpected",
      skill: "Flexible problem-solver",
      text: "Your usual bus is cancelled. You need to make a caregiving visit. A $14 accessible shuttle works today. A trusted neighbor can give you a free ride tomorrow if you rearrange the visit.",
      choices: [
        {
          title: "Take the shuttle today",
          cost: 1400,
          note: "$14 · Keep the visit as planned.",
          effect:
            "The shuttle meets today’s need. It uses $14 of flexible money. Access and timing can be worth paying for.",
        },
        {
          title: "Arrange tomorrow’s ride",
          cost: 0,
          note: "$0 · Check that a later visit works.",
          effect:
            "In this story you confirm tomorrow works for everyone. You save money, but spend time rearranging care.",
        },
      ],
      reflection: reflection(
        "What makes this comparison useful?",
        [
          "The free option must work for everybody.",
          "Compare cost, accessibility, and the timing of care.",
        ],
        1,
        "An option has to meet the need. The lowest price alone cannot tell you that.",
      ),
    },
    {
      title: "One pass, two prices",
      scene: "Wednesday · Look past the price tag",
      lesson: "fees",
      skill: "Fee finder",
      text: "You need a $12 local travel pass for the rest of the week. Buying online adds a $3 service fee. The accessible cash counter charges no fee, but visiting it takes 25 minutes.",
      choices: [
        {
          title: "Visit the cash counter",
          cost: 1200,
          note: "$12 total · Spend 25 minutes.",
          effect:
            "You pay $12 in cash and spend time at the counter. No account or card is required.",
        },
        {
          title: "Use the online option",
          cost: 1500,
          note: "$15 total · Avoid an extra trip.",
          effect:
            "You pay $15: the $12 pass plus a $3 fee. In this fictional path you have access to the payment method. The convenience has a visible price.",
        },
      ],
      reflection: reflection(
        "What is the online total?",
        ["$12, because fees do not count.", "$15, including the $3 fee."],
        1,
        "The fee is part of the total. You can still decide the saved trip is worth it.",
      ),
    },
    {
      title: "“Pay now or lose your delivery”",
      scene: "Thursday · Take a breath",
      lesson: "safe",
      skill: "Careful verifier",
      text: "An unexpected message says a delivery is held. It demands a $15 gift card code immediately. You are waiting for a parcel, so it feels convincing.",
      choices: [
        {
          title: "Check through the official website",
          cost: 0,
          note: "Find it yourself, outside the message.",
          effect:
            "The official record shows no charge. You do not send money. Checking independently helped you avoid this fictional scam.",
        },
        {
          title: "Send the gift card code",
          cost: 1500,
          note: "$15 · Try to release the parcel.",
          effect:
            "In this story the message is a scam and $15 is lost. Urgency made it convincing; being targeted is not your fault. In real life, contact the gift card company quickly. You can retry here.",
        },
        {
          title: "Pause and check with someone",
          cost: 0,
          note: "Wait to pay; verify together.",
          effect:
            "Together you find the official contact independently. There is no charge. Getting another perspective can help.",
        },
      ],
      reflection: reflection(
        "What helps verify a request?",
        [
          "A familiar logo and an urgent deadline.",
          "Contact details found outside the message.",
        ],
        1,
        "A name or logo can be copied. Independent contact is a stronger check.",
      ),
    },
    {
      title: "Choose what works for you",
      scene: "Friday · Bring the plan together",
      lesson: "borrow",
      skill: "Thoughtful comparer",
      text: "At the shop, a durable item costs the goal price. A secondhand option costs $24 and needs an $8 repair; it may wear out sooner. You can also keep using your current item and wait.",
      choices: [
        {
          title: "Buy the durable option",
          cost: "goal",
          note: "Goal price · Longer expected use, no guarantee.",
          effect:
            "You choose the durable item. There is less money left for surprises, and an item expected to last longer. Check quality and return terms in real life.",
        },
        {
          title: "Buy secondhand and repair it",
          cost: 3200,
          note: "$32 total · $24 item + $8 repair.",
          effect:
            "You include the repair in the $32 total. You meet the practical need with more money left, but replacement may be needed sooner.",
        },
        {
          title: "Wait and keep a buffer",
          cost: 0,
          note: "$0 today · Revisit the purchase later.",
          effect:
            "You keep your flexible money and delay the purchase. Your current item needs to work for now. A goal can change when a buffer matters more.",
        },
      ],
      reflection: reflection(
        "What are you comparing?",
        [
          "Only the lowest price today.",
          "Total cost, useful life, and money left for other needs.",
        ],
        1,
        "Comparing these factors is useful even when you wait. Wealth is not a measure of learning.",
      ),
    },
  ];
  const data = { locale: "en", sources, lessons, goals, steps };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.HarborContent = data;
})(typeof window === "undefined" ? globalThis : window);
