import { APPROVED_KYC_STEP, REVIEW_KYC_STEP, type KycState } from '@/state/app';

const filled = (value: string) => value.trim().length > 0;

/**
 * Whether the footer CTA is enabled on a given step.
 *
 * Collected here rather than inside each step so the whole rule set reads at
 * once and matches the list in the design handoff: NUBAN exactly 10 digits,
 * BVN exactly 11, every medical row answered.
 */
export function canContinue(step: number, kyc: KycState): boolean {
  switch (step) {
    case 1: {
      const { firstName, surname, dateOfBirth, username } = kyc.details;
      return (
        filled(firstName) &&
        filled(surname) &&
        dateOfBirth !== null &&
        filled(username)
      );
    }
    case 2:
      return (
        kyc.bank.bankCode !== null &&
        kyc.bank.nuban.length === 10 &&
        // The bank has to have confirmed the name; a typed number is not enough.
        kyc.bank.status === 'done'
      );
    case 3:
      return kyc.bvn.number.length === 11 && kyc.bvn.status === 'done';
    case 4: {
      const { name, phone, tin, address } = kyc.employer;
      return filled(name) && filled(phone) && filled(tin) && filled(address);
    }
    case 5:
      return kyc.medical.every(
        (answer) =>
          answer.hasCondition === false ||
          (answer.hasCondition === true && filled(answer.details))
      );
    case 6:
      return (
        kyc.document.status === 'uploaded' &&
        kyc.document.issuedOn !== null &&
        kyc.document.expiresOn !== null
      );
    case REVIEW_KYC_STEP:
    case APPROVED_KYC_STEP:
      return true;
    default:
      return false;
  }
}
