export function cn(...args: ClassNameConfig[]): string {
  return args
    .filter(isApplicable)
    .flatMap((arg) => (typeof arg === "object" ? objectToClasses(arg) : [arg]))
    .join(" ");
}

function isApplicable(arg: ClassNameConfig): arg is object | string {
  return !!arg && arg !== true;
}

function objectToClasses(obj: object): string[] {
  return Object.entries(obj)
    .filter(([, enabled]) => enabled)
    .map(([className]) => className);
}

type ClassNameConfig = boolean | null | object | string | undefined;
