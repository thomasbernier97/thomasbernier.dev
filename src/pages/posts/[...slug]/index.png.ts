import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { fontData, experimental_getFontFileURL } from "astro:assets";
import satori from "satori";
import sharp from "sharp";
import { getFontPathByWeight } from "@/utils/getFontPathByWeight";
import { getPostSlug } from "@/utils/getPostPaths";
import { postFilter } from "@/utils/postFilter";
import config from "@/config";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("posts").then(p =>
    p.filter(post => postFilter(post) && !post.data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const fonts = fontData["--font-google-sans-code"];
  const weights = [400, 500, 700] as const;
  const fontPaths = weights.map(weight => getFontPathByWeight(fonts, weight));

  if (fontPaths.some(fontPath => fontPath === undefined)) {
    throw new Error("Cannot find the font path.");
  }

  const fontBuffers = await Promise.all(
    fontPaths.map(fontPath =>
      fetch(experimental_getFontFileURL(fontPath as string, url)).then(res =>
        res.arrayBuffer()
      )
    )
  );

  // Same look as public/default-og.jpg (source: scripts/og/og.svg).
  const svg = await satori(
    {
      key: null,
      type: "div",
      props: {
        style: {
          boxSizing: "border-box",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "96px 96px 86px",
          background: "#212737",
          color: "#eaedf3",
        },
        children: [
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column" },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: 96,
                      height: 8,
                      borderRadius: 4,
                      background: "#60a5fa",
                      marginBottom: 48,
                    },
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      display: "block",
                      margin: 0,
                      fontSize: 64,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      lineClamp: 3,
                    },
                    children: props.data.title,
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      margin: "28px 0 0",
                      fontSize: 34,
                      color: "#afb9ca",
                    },
                    children: `by ${props.data.author}`,
                  },
                },
              ],
            },
          },
          {
            type: "p",
            props: {
              style: {
                margin: 0,
                fontSize: 36,
                fontWeight: 500,
                color: "#60a5fa",
              },
              children: new URL(config.site.url).hostname,
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: weights.map((weight, i) => ({
        name: "Google Sans Code",
        data: fontBuffers[i],
        weight,
        style: "normal" as const,
      })),
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
};
