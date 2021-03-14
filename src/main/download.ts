import { BrowserWindow } from "electron";
import { ImageQuote, PMFullItem, PMHeaders, PMItem } from "./api";
import fs from "fs";
import path from "path";
import os from "os";
import { log } from "./util";
import * as API from "./api";

const ROOT_DIR = path.join(os.homedir(), "wizone");

async function mkdirp(targetDir: string) {
  return await fs.promises.mkdir(targetDir, {recursive: true});
}

export class Downloader {
  window: BrowserWindow;
  headers: PMHeaders;
  constructor(window: BrowserWindow, headers: PMHeaders) {
    this.window = window;
    this.headers = headers;
  }

  private _downloadPromise(url: string, saveTo: string): Promise<void> {
    return new Promise<void>((res) => {
      API.apiGet(url, this.headers, {
        responseType: "stream"
      }).then((response) => {
        response.data.on("end", res);
        response.data.pipe(fs.createWriteStream(saveTo));
      })
    })
  }

  async downloadImages(folder: string, items: {id: string, images: ImageQuote[]}): Promise<void> {
    for (const image of items.images) {
      const imagePath = path.join(folder, image.renameTo);
      await this._downloadPromise(image.url, imagePath);
    }
  }
  
  async saveMail(mail: PMFullItem): Promise<void> {
    log(`${mail.id}: Saving`);
    const folder = path.join(ROOT_DIR, "mail");
    await mkdirp(folder);
    log(`${mail.id}: Writing HTML`);
    await fs.promises.writeFile(path.join(folder, `${mail.id}.html`), mail.body);
    log(`${mail.id}: Downloading ${mail.images.length} images`);
    await this.downloadImages(folder, mail);
  }

  async saveList(mails: PMFullItem[]): Promise<void> {
    // Write metadata
    const metaObj = mails.map(x => ({
      id: x.id,
      title: x.subject,
      time: x.time,
      member: x.member,
      memberID: x.memberID,
      image: x.image,
      bodyPreview: x.bodyPreview
    }));
    const jsonPath = path.join(ROOT_DIR, "meta.json");
    await fs.promises.writeFile(jsonPath, JSON.stringify(metaObj));
    // Copy PM stylesheet
    const cssPath = path.join(ROOT_DIR, "starship.css");
    const jsPath = path.join(ROOT_DIR, "mail.js");
    await this._downloadPromise("https://app-web.izone-mail.com/css/starship.css", cssPath);
    await this._downloadPromise("https://app-web.izone-mail.com/js/mail-detail.js", jsPath);
    // Save mail
    for (const mail of mails) {
      await this.saveMail(mail);
    }
  }

  async getFullList(page?: number): Promise<void> {
    let mail: PMItem[];
    // List
    if (page !== undefined) {
      const {result} = await API.listPage(page, this.headers);
      mail = result;
    } else {
      mail = await API.list(this.headers);
    }
    // Get detail for each mail
    const fullMail = [];
    for (const it of mail) {
      fullMail.push(await API.readMail(it, this.headers));
    }
    // Download
    await this.saveList(fullMail);
  }
}
