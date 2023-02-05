const {JSDOM} = require('jsdom');

async function crawlPage(baseURL, currURL, pages){
    console.log(`actively crawling: ${currURL}`);

    const baseURLObj = new URL(baseURL);
    const currURLObj = new URL(currURL);
    if(baseURLObj.hostname !== currURLObj.hostname){
        return pages;
    }

    const normalizedCurrURL = normalizeURL(currURL);
    if(pages[normalizedCurrURL] > 0){
        pages[normalizedCurrURL]++;
        return pages;
    }

    pages[normalizedCurrURL] = 1;

    try{
        const resp = await fetch(currURL);

        if(resp.status > 399){
            console.log(`error in fetch with status code: ${resp.status} on page: ${currURL}`)
            return pages;
        };

        const contentType = resp.headers.get("content-type")
        if(!contentType.includes("text/html")){
            console.log(`NO HTML Response, content type: ${contentType}, on page: ${currURL}`)
            return pages;
        };

        const htmlBody = await resp.text();

        const nextURLs = getURLsFromHTML(htmlBody, baseURL);

        for(const nextURL of nextURLs){
            pages = await crawlPage(baseURL, nextURL, pages);
        }
        //console.log(await resp.text());
    } catch (err){
        console.log(`error in fetch ${err.message}, on page: ${currURL}`);
    }
    return pages;
}

function getURLsFromHTML(htmlBody, baseURL){
    const urls = [];
    const dom = new JSDOM(htmlBody);
    const linkElements = dom.window.document.querySelectorAll('a');
    for(const linkElement of linkElements){
        if(linkElement.href.slice(0,1) === '/'){
            try{
                const urlObj = new URL(`${baseURL}${linkElement.href}`);
                urls.push(urlObj.href) //rel
            } catch(err){
                console.log(`error with relative URL: ${err.message}`)
            }
        } else{
            try{
                const urlObj = new URL(linkElement.href);
                urls.push(urlObj.href)
            } catch(err){
                console.log(`error with relative URL: ${err.message}`) //abs
            }
        }
    };

    return urls;
};

function normalizeURL(urlString){
    const urlObj = new URL(urlString);
    const hostPath = `${urlObj.hostname}${urlObj.pathname}`;

    if(hostPath.length > 0 && hostPath.slice(-1) === '/'){
        return hostPath.slice(0, -1);
    };
    return hostPath;
}

module.exports = {
    normalizeURL,
    getURLsFromHTML,
    crawlPage
}