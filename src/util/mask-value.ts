
export function maskValue(value: string): string {
  if (!value) {
    return value;
  }

  return value.replace(/(.{2}).*(.{2})/, '$1xxxxxxxxx$2');
}
