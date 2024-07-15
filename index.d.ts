declare module "*.scss" {
  const content: string
  export = content
}

interface CustomEventMap {
  nav: CustomEvent<{ url: FullSlug }>
  themechange: CustomEvent<{ theme: "light" | "dark" }>
}

declare const fetchData: Promise<ContentIndex>
