import { describe, expect, it } from "vitest";
import { parseContent } from "@/lib/content";

describe("parseContent", () => {
  it("parses paragraphs, lists and FAQ entries", () => {
    const nodes = parseContent("Intro line\ncontinues\n\n- one\n- two\n\n## Question?\nAnswer.\n\nOutro");
    expect(nodes).toEqual([
      { type: "p", text: "Intro line continues" },
      { type: "ul", items: ["one", "two"] },
      { type: "faq", q: "Question?", a: ["Answer."] },
      { type: "p", text: "Outro" },
    ]);
  });
  it("does not interpret HTML", () => {
    expect(parseContent("<script>x</script>")).toEqual([{ type: "p", text: "<script>x</script>" }]);
  });
});
