declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { ArticleMeta } from "@/lib/articles";
  export const meta: ArticleMeta;
  const Body: ComponentType;
  export default Body;
}
