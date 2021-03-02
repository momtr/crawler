require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const url = require('url');
const htmlToText = require('html-to-text').htmlToText;
const log = require('./logger');
const redis = require('redis');

let queue = [ process.env.START_PAGE_1, process.env.START_PAGE_2 ];
const client = redis.createClient();
client.set(queue[0], 0, redis.print);
client.set(queue[1], 0, redis.print);

(async () => {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    while(queue.length != 0) {
        const top = queue.pop();
        console.log(top);
        client.get(top, async (_, reply) => {
            console.log('r', reply);
            if(!reply || reply === '0') {
                const data = await crawlPage(top);
                client.set(top, 1, redis.print);
                if(data && data.content && data.content.includes(process.env.MATCHING_TERM)) {
                    const fileContent = JSON.stringify({
                        url: top,
                        content: data.content
                    });
                    fs.writeFileSync(`./data/${url.parse(top).hostname}__${Date.now()}.json`, fileContent, { encoding: 'utf-8' });
                    queue = [...queue, ...data.links];
                    log('saved ' + top);
                } else {
                    log('unreadable ' + top);
                }
            }
        })
        console.log(queue);
    }

    async function crawlPage(uri) {
        if(!uri) return;
        try {
            await page.goto(uri, {
                waitUntil: 'domcontentloaded',
            });
            const data = await page.evaluate(() => {
                return {
                    doc: document.querySelector('*').outerHTML,
                    links: Array.from(document.getElementsByTagName('a'), a => a.href)
                }
            });
            return {
                content: parseContent(data.doc),
                links: data.links.filter(link => link && link != uri && !link.includes(process.env.BLACKLIST_URI_TERM))
            }
        } catch(e) {
            log('error: skipped: ' + uri + 'err: ' + e);
        }
    }

    function parseContent(html) {
        return htmlToText(html, {
            wordwrap: 80
        })
    }

})();
