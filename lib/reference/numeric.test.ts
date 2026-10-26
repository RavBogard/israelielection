import {describe,it,expect} from "vitest";
import {numericTokens} from "./numeric.mjs";
describe("source numeric invariants",()=>{
 it("includes English ordinals rather than losing their quantities",()=>{expect(numericTokens("a 32nd seat; 1st, 2nd, 3rd and 120th" )).toEqual(numericTokens("a 32 seat; 1, 2, 3 and 120"));});
 it("normalizes Arabic/Persian/fullwidth digits and unambiguous separators",()=>{expect(numericTokens("۳٫۲۵٪ and ١٬٢٠٠ and １２０")).toEqual(numericTokens("3.25% and 1,200 and 120"));expect(numericTokens("1\u202f200")).toEqual(numericTokens("1,200"));});
 it("does not conceal a changed amount, omit duplicate numbers, or guess ambiguous punctuation",()=>{expect(numericTokens("61 61")).not.toEqual(numericTokens("61"));expect(numericTokens("99")).not.toEqual(numericTokens("61"));expect(numericTokens("3,25")).not.toEqual(numericTokens("3.25"));});
});
