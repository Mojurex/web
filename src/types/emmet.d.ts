// emmet багцын төрлүүд package.json-ийн "exports"-оос болж олдохгүй тул ашигладаг хэсгийг энд зарлана
// (node_modules/emmet/dist/index.d.ts-ийн дагуу).
declare module "emmet" {
  type FieldOutput = (index: number, placeholder: string, offset: number, line: number, column: number) => string;
  export type UserConfig = {
    type?: "markup" | "stylesheet";
    syntax?: string;
    options?: Partial<{ "output.baseIndent": string; "output.indent": string; "output.field": FieldOutput }>;
  };
  export default function expand(abbr: string, config?: UserConfig): string;
  export function extract(
    line: string,
    pos?: number,
    options?: Partial<{ lookAhead: boolean; type: "markup" | "stylesheet"; prefix: string }>,
  ): { abbreviation: string; location: number; start: number; end: number } | undefined;
}
