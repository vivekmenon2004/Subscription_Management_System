import { z } from 'zod';

export const PASSWORD_RULES = [
  { id: 'length', label: '9 or more characters', test: value => value.length >= 9 },
  { id: 'uppercase', label: 'One uppercase letter', test: value => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'One lowercase letter', test: value => /[a-z]/.test(value) },
  { id: 'special', label: 'One special character', test: value => /[^A-Za-z0-9]/.test(value) }
];

export const passwordSchema = z.string().superRefine((value, context) => {
  PASSWORD_RULES.forEach(rule => {
    if (!rule.test(value)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: rule.label, params: { rule: rule.id } });
    }
  });
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid work email address.'),
  password: z.string().min(1, 'Enter your password.')
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.'),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid work email address.'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm your password.'),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to create an account.' }) })
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match.'
    });
  }
});

export function getPasswordRuleResults(password, confirmPassword = '') {
  return [
    ...PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(password) })),
    {
      id: 'match',
      label: 'Passwords match',
      passed: password.length > 0 && password === confirmPassword
    }
  ];
}
