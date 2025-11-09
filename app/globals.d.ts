declare module "*.css";

// Shopify Polaris web components type definitions
declare namespace JSX {
  interface IntrinsicElements {
    's-page': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      heading?: string;
    }, HTMLElement>;
    's-section': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      heading?: string;
      slot?: string;
    }, HTMLElement>;
    's-button': React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string;
      submit?: boolean;
      loading?: boolean;
      slot?: string;
    }, HTMLButtonElement>;
    's-paragraph': React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
    's-text': React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement> & {
      variant?: string;
    }, HTMLSpanElement>;
    's-link': React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
    's-stack': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & {
      direction?: string;
      gap?: string;
    }, HTMLDivElement>;
    's-box': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & {
      padding?: string;
      borderWidth?: string;
      borderRadius?: string;
      background?: string;
    }, HTMLDivElement>;
    's-heading': React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    's-ordered-list': React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
    's-unordered-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
    's-list-item': React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
    's-form': React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
  }
}
