declare module 'stringify-object' {
  export default function objectToString(
    input: unknown,
    options?: Record<string, unknown>
  ): string;
}
