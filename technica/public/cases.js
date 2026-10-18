// Fictional evidence. Decisions are authored separately and keep stable IDs.
const CASES = [
  {
    id: "A",
    title: "The Guaranteed Investment",
    skill: "Evaluating Return & Legitimacy Claims",
    brief:
      "Maya, 17, saw a post from @TideCapitalVIP promising a spot in an exclusive fund. A friend of a friend 'already doubled their money.'",
    evidence: [
      {
        id: "a1",
        src: "Post",
        text: "“Guaranteed 18% monthly returns. Zero risk. Only 20 spots.”",
        truth: "w",
        strength: "strong",
        why: "No real investment can guarantee high returns with zero risk.",
      },
      {
        id: "a2",
        src: "Comment",
        text: "“I turned $500 into $1,100 in a week!!” (account created 3 days ago)",
        truth: "w",
        strength: "minor",
        why: "A brand-new account praising the offer is weak social proof and could be staged.",
      },
      {
        id: "a3",
        src: "DM",
        text: "“Spots close tonight. Message me on SecureChatX to claim yours.”",
        truth: "w",
        strength: "strong",
        why: "Urgency plus moving to a private app removes records and oversight.",
      },
      {
        id: "a4",
        src: "Profile",
        text: "Polished logo, website: tidecapital.example.com",
        truth: "v",
        strength: "minor",
        why: "Good design is cheap to copy. Check a regulator registry instead.",
      },
      {
        id: "a5",
        src: "Post",
        text: "Posted at 9:14 AM with 3 hashtags.",
        truth: "u",
        strength: "neutral",
        why: "Timing and hashtags say nothing about legitimacy.",
      },
    ],
    habit:
      "Before sending money, check the firm in an official registry you find yourself.",
  },
  {
    id: "B",
    title: "The Urgent Bank Alert",
    skill: "Protecting Sensitive Credentials",
    brief:
      "Jordan, 19, gets a text and an email about their account at the fictional Northwind Savings.",
    evidence: [
      {
        id: "b1",
        src: "SMS",
        text: "“ALERT: Account locked in 10 minutes. Act now.”",
        truth: "w",
        strength: "strong",
        why: "Artificial urgency is designed to stop you from thinking.",
      },
      {
        id: "b2",
        src: "Email header",
        text: "From: security@northwind-support.example.org",
        truth: "w",
        strength: "strong",
        why: "The sender domain does not match the bank's real domain.",
      },
      {
        id: "b3",
        src: "Email link",
        text: "Button says northwind.example.com but points to login.example.org",
        truth: "w",
        strength: "strong",
        why: "Displayed and actual link destinations differ.",
      },
      {
        id: "b4",
        src: "Follow-up SMS",
        text: "“Reply with the 6-digit code we just sent to verify you.”",
        truth: "w",
        strength: "strong",
        why: "Anyone asking for your one-time code is attempting to take over your account.",
      },
      {
        id: "b5",
        src: "Email",
        text: "Greeting: “Dear customer”",
        truth: "u",
        strength: "minor",
        why: "Generic greetings are weak evidence alone; many real messages use them.",
      },
    ],
    habit:
      "Never share a one-time code. Contact the institution through a channel you found yourself.",
  },
  {
    id: "C",
    title: "The Ordinary Reminder",
    skill: "Calibrating Uncertainty vs. Evidence",
    brief:
      "Sam, 18, receives a short notice from what looks like their electric provider, Harbor Light & Power (fictional).",
    evidence: [
      {
        id: "c1",
        src: "Email",
        text: "“Your invoice for October is ready. View it in your account.”",
        truth: "u",
        strength: "neutral",
        why: "Routine wording, no pressure, no request for secrets.",
      },
      {
        id: "c2",
        src: "Header",
        text: "From: billing@harborlight.example.com",
        truth: "v",
        strength: "minor",
        why: "Cannot be confirmed from the message alone. Compare with your paper bill.",
      },
      {
        id: "c3",
        src: "Body",
        text: "No amount, account number, or due date listed.",
        truth: "v",
        strength: "minor",
        why: "Missing details are a reason to check, not proof of fraud.",
      },
      {
        id: "c4",
        src: "Footer",
        text: "Standard unsubscribe and address lines.",
        truth: "u",
        strength: "neutral",
        why: "Present in both real and fake messages.",
      },
    ],
    habit:
      "When evidence is thin, verify through a channel you chose instead of guessing either way.",
  },
  {
    id: "D",
    title: "The AI ETF Pitch",
    skill: "Understanding ETFs & Fees",
    brief:
      "Alex sees an advertisement for the fictional AutoPilot AI Fund. Use the ETF Lab to examine costs before deciding.",
    evidence: [
      {
        id: "d1",
        src: "Advertisement",
        text: "Our AI guarantees 3% every week. No losing years.",
        truth: "w",
        strength: "strong",
        why: "AI does not remove market risk. Guaranteed high-return claims warrant caution.",
      },
      {
        id: "d2",
        src: "Fee footnote",
        text: "Annual expense ratio: 0.85%. Other trading costs may apply.",
        truth: "v",
        strength: "strong",
        why: "Check the full prospectus and compare the total costs; the fee alone does not prove fraud.",
      },
      {
        id: "d3",
        src: "Headline",
        text: "Almost no fees. Invest before midnight.",
        truth: "w",
        strength: "strong",
        why: "The vague low-cost claim conflicts with the material annual expense and uses pressure.",
      },
      {
        id: "d4",
        src: "Fund label",
        text: "An actively managed exchange-traded fund.",
        truth: "u",
        strength: "neutral",
        why: "Active management and the ETF wrapper alone establish neither legitimacy nor performance.",
      },
    ],
    habit: "Check what is inside the fund and read its full fee table.",
  },
  {
    id: "E",
    title: "Four Funds, One Big Bet",
    skill: "Diversification & Overlap",
    brief:
      "Riley has a fictional $10,000 portfolio. Four fund names look diversified, but the holdings tell another story.",
    evidence: [
      {
        id: "e1",
        src: "Allocation",
        text: "90% of the portfolio is in three technology-sector funds.",
        truth: "v",
        strength: "strong",
        why: "Inspect concentration and overlapping holdings. Concentration is a risk, not proof of fraud.",
      },
      {
        id: "e2",
        src: "Promoter",
        text: "Four fund names means you cannot lose money.",
        truth: "w",
        strength: "strong",
        why: "Neither multiple funds nor diversification prevents all losses.",
      },
      {
        id: "e3",
        src: "Holdings",
        text: "All three sector funds list the same five largest companies.",
        truth: "v",
        strength: "strong",
        why: "Overlapping companies can amplify the same risk across different fund labels.",
      },
      {
        id: "e4",
        src: "Account",
        text: "The dashboard has a blue theme.",
        truth: "u",
        strength: "neutral",
        why: "Visual design does not determine the underlying investment exposure.",
      },
    ],
    habit:
      "Look through fund names to the underlying companies, sectors, and asset classes.",
  },
  {
    id: "F",
    title: "A Piece of the Coast",
    skill: "Tokenized Rights & Verification",
    brief:
      "A fictional platform offers units in a seaside property. Morgan investigates what those units actually represent.",
    evidence: [
      {
        id: "f1",
        src: "Offer",
        text: "Buy a token and instantly own legal title to a beachfront home.",
        truth: "v",
        strength: "strong",
        why: "Verify the legal agreement and ownership structure. A token record alone is insufficient.",
      },
      {
        id: "f2",
        src: "Chat",
        text: "Send your wallet seed phrase so our support team can issue the units.",
        truth: "w",
        strength: "strong",
        why: "A seed phrase controls access. Never share it with a promoter or support agent.",
      },
      {
        id: "f3",
        src: "Advertisement",
        text: "Guaranteed resale at any time. No buyers needed.",
        truth: "w",
        strength: "strong",
        why: "A ledger does not create buyers or guarantee liquidity.",
      },
      {
        id: "f4",
        src: "Ledger",
        text: "1,000 units appear in a digital ownership table.",
        truth: "u",
        strength: "neutral",
        why: "A displayed ledger alone says little about custody, rights, or the underlying property.",
      },
    ],
    habit:
      "Separate the digital record from the legal rights and real-world asset.",
  },
];
const actionData =
  typeof module !== "undefined"
    ? require("./case-actions")
    : globalThis.CaseActions;
CASES.forEach((c) => {
  const d = actionData[c.id];
  c.actions = d.order.map((id) => d.actions.find((a) => a.id === id));
  c.reasons = d.reasons;
  c.unknown = d.unknown;
});
if (typeof module !== "undefined") module.exports = CASES;
