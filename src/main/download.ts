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

export interface LogItem {
  stage: number;
  now: number;
  count: number;
}

export class Downloader {
  window: BrowserWindow;
  headers: PMHeaders;
  logger?: (l: LogItem) => void;
  constructor(window: BrowserWindow, headers: PMHeaders, logger?: (l: LogItem) => void) {
    this.window = window;
    this.headers = headers;
    this.logger = logger;
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
    let index = 0;
    for (const mail of mails) {
      index++;
      this.logger?.({stage: 3, now: index, count: mails.length});
      await this.saveMail(mail);
    }
  }

  async getFullList(page?: number): Promise<void> {
    let mail: PMItem[];
    // List
    let listIndex = 0;
    if (page !== undefined) {
      listIndex++;
      this.logger?.({stage: 1, now: listIndex, count: 0});
      const {result} = await API.listPage(page, this.headers);
      mail = result;
    } else {
      mail = await API.list(this.headers);
    }
    // Get detail for each mail
    const fullMail = [];
    let index = 0;
    for (const it of mail) {
      index++;
      this.logger?.({stage: 2, now: index, count: mail.length});
      fullMail.push(await API.readMail(it, this.headers));
    }
    // Download
    await this.saveList(fullMail);
  }
}
