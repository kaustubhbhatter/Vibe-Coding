import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as unknown as T;
  }

  const newObj: any = {};
  Object.keys(obj as object).forEach(key => {
    const value = (obj as any)[key];
    if (value !== undefined) {
      newObj[key] = removeUndefined(value);
    }
  });

  return newObj as T;
}
