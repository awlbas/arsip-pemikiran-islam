import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { byDateAndAlphabetical } from "./PageList"
import { Date, getDate } from "./Date"
import { resolveRelative } from "../util/path"
import { GlobalConfiguration } from "../cfg"

interface Options {
  title?: string
  limit: number
  filter: (f: QuartzPluginData) => boolean
}

const defaultOptions = (_cfg: GlobalConfiguration): Options => ({
  title: "Artikel Terbaru",
  limit: 20,
  filter: () => true,
})

export default ((userOpts?: Partial<Options>) => {
  const RecentFeed: QuartzComponent = ({ allFiles, fileData, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions(cfg), ...userOpts }
    const pages = allFiles.filter(opts.filter).sort(byDateAndAlphabetical(cfg))

    return (
      <div class="recent-feed">
        <h2>{opts.title}</h2>
        <ul class="recent-feed-list">
          {pages.slice(0, opts.limit).map((page) => {
            const title = page.frontmatter?.title ?? page.slug ?? ""
            const description = page.description?.trim()
            const tags = (page.frontmatter?.tags ?? []) as string[]
            const date = getDate(cfg, page)

            return (
              <li class="recent-feed-item">
                <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal feed-title">
                  {title}
                </a>
                {date && (
                  <span class="feed-date">
                    <Date date={date} locale={cfg.locale} />
                  </span>
                )}
                {description && <p class="feed-excerpt">{description}</p>}
                {tags.length > 0 && (
                  <div class="feed-tags">
                    {tags.map((tag) => (
                      <a
                        href={resolveRelative(fileData.slug!, `tags/${tag}` as any)}
                        class="internal tag-link"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  RecentFeed.css = `
    .recent-feed {
      margin-top: 2rem;
    }

    .recent-feed h2 {
      border-bottom: 1px solid var(--lightgray);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .recent-feed-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .recent-feed-item {
      border-bottom: 1px solid var(--lightgray);
      padding-bottom: 1.5rem;
    }

    .recent-feed-item:last-child {
      border-bottom: none;
    }

    .feed-title {
      font-size: 1.1rem;
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
      color: var(--dark);
      text-decoration: none;
      background: none !important;
      padding: 0 !important;
      border-radius: 0 !important;
    }

    .feed-title:hover {
      color: var(--secondary);
      background: none !important;
    }

    .feed-date {
      font-size: 0.8rem;
      color: var(--gray);
      display: block;
      margin-bottom: 0.4rem;
    }

    .feed-excerpt {
      font-size: 0.9rem;
      color: var(--darkgray);
      line-height: 1.6;
      margin: 0.4rem 0 0.6rem 0;
    }

    .feed-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }
  `

  return RecentFeed
}) satisfies QuartzComponentConstructor
