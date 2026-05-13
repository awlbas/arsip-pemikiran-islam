import { QuartzEmitterPlugin } from "../types"
import { getDate } from "../../components/Date"
import { simplifySlug } from "../../util/path"

const APP_ID = "C3TCNMT1PZ"
const INDEX_NAME = "arsip_pemikiran_islam"
const MAX_CHUNK_BYTES = 8000

function splitToSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
}

function chunkContent(text: string, maxBytes = 5000): string[] {
  const sentences = text
    .split(/\n+/)
    .flatMap((para) => (Buffer.byteLength(para, "utf8") > maxBytes ? splitToSentences(para) : [para]))
    .filter((s) => s.trim().length > 10)

  const chunks: string[] = []
  let current = ""

  for (const sentence of sentences) {
    const candidate = current ? current + " " + sentence : sentence
    if (Buffer.byteLength(candidate, "utf8") > maxBytes && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = candidate
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [""]
}

export const AlgoliaIndex: QuartzEmitterPlugin = () => {
  return {
    name: "AlgoliaIndex",
    async *emit(ctx, content) {
      const adminKey = process.env.ALGOLIA_ADMIN_KEY
      if (!adminKey) {
        console.warn("[AlgoliaIndex] ALGOLIA_ADMIN_KEY not set, skipping")
        return
      }

      const { algoliasearch } = await import("algoliasearch")
      const client = algoliasearch(APP_ID, adminKey)

      const records: object[] = []

      for (const [_tree, file] of content) {
        const slug = file.data.slug!
        if (file.data.frontmatter?.draft) continue
        if (slug === "index") continue

        const simplSlug = simplifySlug(slug)
        const base = {
          slug: simplSlug,
          title: file.data.frontmatter?.title ?? "",
          description: file.data.description ?? "",
          tags: file.data.frontmatter?.tags ?? [],
          date: getDate(ctx.cfg.configuration, file.data)?.toISOString() ?? "",
        }

        const chunks = chunkContent(file.data.text ?? "")
        chunks.forEach((chunk, i) => {
          records.push({
            objectID: i === 0 ? simplSlug : `${simplSlug}__${i}`,
            ...base,
            content: chunk,
            chunkIndex: i,
          })
        })
      }

      // Configure index settings
      await client.setSettings({
        indexName: INDEX_NAME,
        indexSettings: {
          searchableAttributes: ["title", "description", "tags", "content"],
          attributeForDistinct: "slug",
          distinct: 1,
          attributesToSnippet: ["content:40"],
          snippetEllipsisText: "…",
        },
      })

      // Push in batches of 100
      for (let i = 0; i < records.length; i += 100) {
        await client.saveObjects({ indexName: INDEX_NAME, objects: records.slice(i, i + 100) })
      }

      console.log(`[AlgoliaIndex] Indexed ${records.length} chunks from content`)
    },
    externalResources() {
      return {}
    },
  }
}
