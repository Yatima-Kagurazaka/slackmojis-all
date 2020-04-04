const request = require("request-promise-native");
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

var dir = path.resolve("emojis");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

function DownloadFile(name, url, category) {
  return new Promise(resolve => {
    if (!fs.existsSync(`${dir}/${category}`)) fs.mkdirSync(`${dir}/${category}`);
    let file = fs.createWriteStream(`${dir}/${category}/${name}.png`);
    file.on("finish", () => {
      console.log("Downloaded:", name);
      return resolve();
    });
    return request(url).pipe(file);
  });
}

let failures = 0;
let count = 0;
console.log("Requesting Emoji Listing...");
request({
  url: "https://slackmojis.com/emojis.json",
  json: true
})
  .then(list => {
    return Promise.map(
      list,
      ({ name, image_url, category}) => {
        console.log(`${list.length - ++count} / ${list.length} remaining...`);
        return DownloadFile(name, image_url, category.name).catch(e => {
          ++failures;
          console.log("failed to download:", name);
        });
      },
      { concurrency: process.env.CONCURRENCY || 5 }
    );
  })
  .then(() => {
    console.log("all done");
  });
