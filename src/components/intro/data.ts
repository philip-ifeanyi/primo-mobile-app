export const INTRO_DETAILS: {
  illustration: number;
  fallBack: number;
  header: string;
  description: string;
}[] = [
    {
      illustration: require("@/assets/intro/phoneShield.mov"),
      fallBack: require("@/assets/intro/phoneShieldFallback.jpeg"),
      header: "Cover that fits in your pocket",
      description: "Motor, health, travel and home insurance from licensed Nigerian underwriters — priced in the app, no agent calls.",
    },
    {
      illustration: require("@/assets/intro/id.mov"),
      fallBack: require("@/assets/intro/idFallback.jpeg"),
      header: "One KYC, every policy",
      description: "Verify your BVN and bank account once. Every quote after that takes under two minutes.",
    },
    {
      illustration: require("@/assets/intro/money.mov"),
      fallBack: require("@/assets/intro/moneyFallback.jpeg"),
      header: "Pay monthly, stay covered",
      description: "Set up a direct debit mandate from your bank account and never lapse on a renewal again.",
    },
  ]
