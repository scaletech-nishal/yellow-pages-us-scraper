import { apikey, sequence_id, showBrowser } from "./config";
import { browser } from "@crawlora/browser";

export default async function ({
  query,
  maxPages = 1, // Maximum number of pages to scrape
}: {
  query: string;
  maxPages?: number;
}) {
  const formedData = query
    .trim()
    .split("\n")
    .map((v) => v.trim());

  await browser(
    async ({ page, wait, output, debug }) => {
      for await (const search of formedData) {
        const [keyword, location] = search.split(";");

        debug(`Searching for: ${keyword} in ${location}`);

        // Loop through each page up to maxPages
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const url = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(
            keyword
          )}&geo_location_terms=${encodeURIComponent(
            location
          )}&page=${pageNum}`;
          debug(`Navigating to: ${url}`);
          await page.goto(url, { waitUntil: "networkidle2" });

          // Scrape data from the current page
          const data = await page.evaluate(
            (keyword, location) => {
              const results: any[] = [];
              const listings = document.querySelectorAll(".result");

              listings.forEach((listing) => {
                const title =
                  (listing.querySelector(".n a") as HTMLElement)?.innerText ||
                  "N/A";
                const address =
                  (listing.querySelector(".street-address") as HTMLElement)
                    ?.innerText || "N/A";
                const phone =
                  (
                    listing.querySelector(
                      ".phones.phone.primary"
                    ) as HTMLElement
                  )?.innerText || "N/A";
                const website =
                  (
                    listing.querySelector(
                      ".track-visit-website"
                    ) as HTMLAnchorElement
                  )?.getAttribute("href") || "N/A";
                const categories = Array.from(
                  listing.querySelectorAll(".categories a")
                )
                  .map((cat) => (cat as HTMLElement).innerText)
                  .join(", ");

                results.push({
                  title,
                  address,
                  phone,
                  website,
                  categories,
                  keywords: keyword,
                  location: location,
                });
              });

              return results;
            },
            keyword,
            location
          );

          // to store the data via output
          await Promise.all(
            data.map(async (result) => {
              await output.create({
                sequence_id,
                sequence_output: { ...result },
              });
            })
          );
        }
      }

      await wait(3); // Add a delay to avoid rate limiting
    },
    { showBrowser, apikey }
  );
}
