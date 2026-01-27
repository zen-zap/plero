// Global module declarations for non-TS imports (styles, images, etc.)
// This lets TypeScript accept side-effect imports like `import "../index.css"`.

declare module "*.css";
declare module "*.module.css";
declare module "*.scss";
declare module "*.module.scss";

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";

declare module "*.svg" {
  const content: string;
  export default content;
}
