(function (root) {
  const data = {
    A: {
      order: ["x1", "x3", "x2"],
      unknown:
        "The post does not establish who operates Tide Capital, its registration status, or how any return would be generated.",
      actions: [
        {
          id: "x1",
          text: "Send a small deposit through SecureChatX, then check whether a withdrawal works.",
          pts: 0,
          cons: "A test deposit still exposes money to an unverified seller. Even an early withdrawal would not substantiate the 18% monthly guarantee.",
        },
        {
          id: "x2",
          text: "Check the seller’s registration and written risk disclosures through independent sources.",
          pts: 40,
          cons: "The guarantee and deadline need evidence beyond the promoter. Official records and full terms give Maya a way to check the provider and the stated risks without making a deposit.",
        },
        {
          id: "x3",
          text: "Ask for customers’ profit screenshots and compare them before deciding.",
          pts: 0,
          cons: "Screenshots can be incomplete or fabricated. The newly created testimonial account makes more promoter-supplied social proof a weak substitute for independent checks.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "A small payment would let Maya test the service while limiting the amount exposed.",
          cal: 0,
        },
        {
          id: "r2",
          text: "The return promise and deadline do not establish the seller’s identity or investment terms.",
          cal: 20,
        },
        {
          id: "r3",
          text: "Several matching profit screenshots would establish how the returns were generated.",
          cal: 0,
        },
      ],
    },
    B: {
      order: ["x2", "x1", "x3"],
      unknown:
        "These messages do not show the bank’s actual account records or establish the sender’s identity.",
      actions: [
        {
          id: "x1",
          text: "Reply with the verification code, then change the account password afterward.",
          pts: 0,
          cons: "The requested code may authorize access before a later password change. The lookalike domain and mismatched link give Jordan further reasons not to follow the sender’s instructions.",
        },
        {
          id: "x2",
          text: "Open the bank’s app independently and check the alert using the contact details on the card.",
          pts: 40,
          cons: "This checks the claimed lock through a route Jordan already trusts. It avoids the mismatched link and does not disclose the one-time code.",
        },
        {
          id: "x3",
          text: "Reply asking for an employee name and account details before taking another step.",
          pts: 10,
          cons: "A reply asks the unverified source to confirm itself. A name or account detail can be copied; it does not resolve the mismatched domain or the request for a code.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "Completing the requested verification first would keep the account accessible during the check.",
          cal: 0,
        },
        {
          id: "r2",
          text: "An independent bank contact can check the alert without trusting the sender or sharing a code.",
          cal: 20,
        },
        {
          id: "r3",
          text: "A specific employee name would be enough to resolve the uncertainty about the sender.",
          cal: 5,
        },
      ],
    },
    C: {
      order: ["x1", "x2", "x3"],
      unknown:
        "The email alone does not confirm whether an invoice exists, its amount, or the sender’s authenticity.",
      actions: [
        {
          id: "x1",
          text: "Mark the notice as fraudulent and wait for the provider’s next paper bill.",
          pts: 15,
          cons: "Waiting avoids using the email, but calling it fraudulent goes beyond the evidence. Sam could also miss a genuine invoice rather than checking through an independent route.",
        },
        {
          id: "x2",
          text: "Use a saved bookmark or the paper bill’s website to check the account for an invoice.",
          pts: 40,
          cons: "The routine wording provides little evidence either way. Checking the account independently can resolve the missing invoice details without relying on the email.",
        },
        {
          id: "x3",
          text: "Use the email’s account link to look for a matching amount and due date.",
          pts: 0,
          cons: "A matching-looking invoice on a linked page would still rely on an unverified destination. An existing bookmark or paper bill provides a stronger starting point.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "Routine wording makes the email’s account link a reasonable source for payment details.",
          cal: 5,
        },
        {
          id: "r2",
          text: "Missing details call for a separate account check, rather than an immediate fraud verdict.",
          cal: 20,
        },
        {
          id: "r3",
          text: "The missing amount is enough evidence to classify the notice as fraudulent.",
          cal: 0,
        },
      ],
    },
    D: {
      order: ["x3", "x1", "x2"],
      unknown:
        "The advertisement does not establish actual performance, full costs, verified holdings, or the promoter’s authorization.",
      actions: [
        {
          id: "x1",
          text: "Start with a small fund purchase and track whether its first week matches the advertisement.",
          pts: 0,
          cons: "One week’s result cannot establish a repeatable return or protection against losses. Alex would commit money before resolving the guarantee and the fee claim.",
        },
        {
          id: "x2",
          text: "Read the holdings and full fee table, and verify the provider outside the advertisement.",
          pts: 40,
          cons: "The 0.85% footnote and vague “almost no fees” headline need a full cost comparison. Independent provider checks also address the unsupported AI guarantee.",
        },
        {
          id: "x3",
          text: "Request the manager’s performance screenshots and customer reviews before subscribing.",
          pts: 0,
          cons: "Promotional performance material does not replace verified disclosures. Reviews also leave the ongoing expense ratio and the no-loss guarantee unresolved.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "A short trial would establish whether the advertised weekly return is reliable.",
          cal: 0,
        },
        {
          id: "r2",
          text: "The AI label leaves underlying market risk and ongoing costs in place.",
          cal: 20,
        },
        {
          id: "r3",
          text: "Positive reviews would explain the difference between the fee headline and its footnote.",
          cal: 0,
        },
      ],
    },
    E: {
      order: ["x2", "x3", "x1"],
      unknown:
        "The holdings reveal overlap, but do not predict future performance or establish which allocation would suit Riley.",
      actions: [
        {
          id: "x1",
          text: "Spread the technology allocation across more fund providers to reduce dependence on one.",
          pts: 0,
          cons: "Different providers can hold the same companies. This does not address the 90% technology exposure or the overlap in the five largest holdings.",
        },
        {
          id: "x2",
          text: "Compare underlying holdings and weights, then test both mixes under the same downturn.",
          pts: 40,
          cons: "This examines the repeated companies and concentration directly. A common hypothetical shock makes the comparison useful without turning it into a forecast.",
        },
        {
          id: "x3",
          text: "Compare recent fund returns and replace the weakest performer with the strongest one.",
          pts: 0,
          cons: "Recent performance does not reveal whether the replacement repeats the same companies. The concentration can remain even if past returns look stronger.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "Different providers would make the technology funds independent exposures.",
          cal: 0,
        },
        {
          id: "r2",
          text: "Fund names can hide the same underlying holdings and sensitivity to a sector setback.",
          cal: 20,
        },
        {
          id: "r3",
          text: "The strongest recent return would identify the fund least exposed to a future downturn.",
          cal: 0,
        },
      ],
    },
    F: {
      order: ["x3", "x2", "x1"],
      unknown:
        "The displayed units do not establish property title, asset custody, enforceable exit rights, or available buyers.",
      actions: [
        {
          id: "x1",
          text: "Send the recovery phrase for the support team’s requested ownership check.",
          pts: 0,
          cons: "A recovery phrase can grant control over wallet assets. It is not evidence of property rights, and sending it can surrender access before any offer is verified.",
        },
        {
          id: "x2",
          text: "Keep access secrets private and independently inspect the agreement, custody, and resale rules.",
          pts: 40,
          cons: "The claimed title and guaranteed resale require legal and operational evidence. Keeping credentials private also avoids the immediate access risk in the support request.",
        },
        {
          id: "x3",
          text: "Purchase a few units and attempt a resale before considering a larger amount.",
          pts: 0,
          cons: "An initial resale would not establish legal title or future liquidity. It also exposes money before Morgan understands the agreement or custody arrangement.",
        },
      ],
      reasons: [
        {
          id: "r1",
          text: "The support team’s access check would confirm the ownership rights behind the units.",
          cal: 0,
        },
        {
          id: "r2",
          text: "The digital entry and an enforceable claim on the property are separate questions.",
          cal: 20,
        },
        {
          id: "r3",
          text: "One completed resale would establish that buyers will remain available.",
          cal: 0,
        },
      ],
    },
  };
  if (typeof module !== "undefined") module.exports = data;
  else root.CaseActions = data;
})(typeof window !== "undefined" ? window : globalThis);
