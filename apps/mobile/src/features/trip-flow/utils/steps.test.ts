import { isoDateSchema } from '@waypoint/contracts/common';
import { completedSteps, currentStep, stepNumber } from './steps';

const draft = {
  styles: ['food' as const],
  destinationId: 'ChIJ-lisbon',
  startDate: isoDateSchema.parse('2027-05-12'),
  endDate: isoDateSchema.parse('2027-05-16'),
  planDays: 5,
  selections: ['flight' as const, 'stay' as const],
};

describe('currentStep', () => {
  it('resumes at the first missing pick', () => {
    expect(currentStep({ ...draft, styles: [] })).toBe('style');
    expect(currentStep({ ...draft, destinationId: null })).toBe('destination');
    expect(currentStep({ ...draft, endDate: null })).toBe('spots');
    expect(currentStep({ ...draft, selections: [] })).toBe('flights');
    expect(currentStep({ ...draft, selections: ['flight'] })).toBe('stay');
    expect(currentStep({ ...draft, planDays: 0 })).toBe('plan');
    expect(currentStep(draft)).toBe('summary');
  });
});

describe('step numbers', () => {
  it('counts the six planning steps', () => {
    expect(stepNumber('style')).toBe(1);
    expect(stepNumber('plan')).toBe(6);
    expect(completedSteps('flights')).toBe(3);
    expect(completedSteps('stay')).toBe(4);
    expect(completedSteps('summary')).toBe(6);
    expect(completedSteps('booked')).toBe(6);
  });
});
