import { apikey, sequence_id, showBrowser } from "./config";

import { browser } from "@crawlora/browser";

export default async function ({
  keywords, // data coming from textarea which means it is multiline
}: {
  keywords: string;
}) {
  const formedData = keywords
    .trim()
    .split("\n")
    .map((v) => v.trim());

  await browser(
    async ({ page, wait, output, debug }) => {
      for await (const searchs of formedData) {
        await page.goto("https://www.yellowpages.com/");
        const queryAndLocations = searchs.split(";");
        await page.type('input[id="query"]', queryAndLocations[0]);

        //clear the default value
        await page.focus('input[id="location"]');
        await page.keyboard.down("Control"); // Hold down Control
        await page.keyboard.press("A"); // Press A to select all text
        await page.keyboard.up("Control"); // Release Control
        await page.keyboard.press("Backspace"); // Clear it
        await page.type('input[id="location"]', queryAndLocations[1]);

        //click Find Button
        await page.click('button[type="submit"][value="Find"]');

        await page.waitForNavigation({ waitUntil: ["networkidle2"] });

        const data = await page.evaluate(() => {
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
              (listing.querySelector(".phones.phone.primary") as HTMLElement)
                ?.innerText || "N/A";

            const categories = Array.from(
              listing.querySelectorAll(".categories a")
            )
              .map((cat) => (cat as HTMLElement).innerText)
              .join(", ");
            results.push({ title, address, phone, categories });
          });

          return results;
        });

        console.log(data);
        await wait(50);
      }
    },
    { showBrowser, apikey }
  );
}
