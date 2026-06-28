export type EmploymentType = 'government' | 'listed_private' | 'unlisted_private' | 'self_employed' | 'retired';

export type DTIResult = {
  value: number;
  status: 'within_limits' | 'exceeds_standard' | 'exceeds_ceiling';
  employmentAdjusted: boolean;
};

export const MAX_DTI_STANDARD = 50;
export const MAX_DTI_GOVERNMENT = 55;
export const ELIGIBILITY_CEILING = 60;

export function calculateDTI(
  netSalary: number,
  installment: number,
  liabilities: number,
  employmentType?: EmploymentType
): DTIResult {
  if (!netSalary || netSalary <= 0) {
    return { value: 100, status: 'exceeds_ceiling', employmentAdjusted: false };
  }

  const dti = ((liabilities + installment) / netSalary) * 100;
  const value = Number(Math.max(0, dti).toFixed(2));

  const isGovernment = employmentType === 'government';
  const maxAllowed = isGovernment ? MAX_DTI_GOVERNMENT : MAX_DTI_STANDARD;

  let status: 'within_limits' | 'exceeds_standard' | 'exceeds_ceiling';
  if (value <= maxAllowed) {
    status = 'within_limits';
  } else if (value <= ELIGIBILITY_CEILING) {
    status = 'exceeds_standard';
  } else {
    status = 'exceeds_ceiling';
  }

  return { value, status, employmentAdjusted: isGovernment };
}
