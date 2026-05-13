import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {},
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    // Feed terbaru dengan excerpt hanya di halaman depan
    Component.ConditionalRender({
      component: Component.RecentFeed({
        title: "Artikel Terbaru",
        limit: 20,
        filter: (f) =>
          !f.slug?.startsWith("Index/") &&
          f.slug !== "index" &&
          f.frontmatter?.draft !== true,
      }),
      condition: (page) => page.fileData.slug === "index",
    }),
  ],
  left: [
    Component.DesktopOnly(Component.PageTitle()),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.PagefindSearch(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    // Widget terbaru di sidebar kanan semua halaman
    Component.ConditionalRender({
      component: Component.DesktopOnly(
        Component.RecentNotes({
          title: "Terbaru",
          limit: 8,
          showTags: false,
          filter: (f) =>
            !f.slug?.startsWith("Index/") &&
            f.slug !== "index" &&
            f.frontmatter?.draft !== true,
        }),
      ),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.PagefindSearch(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
