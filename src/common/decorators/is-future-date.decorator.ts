import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' && !(value instanceof Date)) {
            return false;
          }
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return false;
          }
          return date.getTime() > Date.now();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid future date and time`;
        },
      },
    });
  };
}
