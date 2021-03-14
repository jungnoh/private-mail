/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export interface PMHeaders {
  userId: string;
  accessToken: string;
  appVer?: string;
  device?: string;
  osType?: string;
  osVersion?: string;
  userAgent?: string;
}

export interface PMItem {
  id: string;
  member: string;
  memberID: number;
  image: boolean;
  time: string;
  subject: string;
  bodyPreview: string;
}

export interface ImageQuote {
  url: string;
  renameTo: string;
}

export interface PMFullItem extends PMItem {
  body: string;
  images: ImageQuote[];
}

function log(...data: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...data);
  }
}

async function apiGet(url: string, headers: PMHeaders) {
  const head: Required<PMHeaders> = {
    ...headers,
    appVer: "1.2.3",
    device: "iPhone13,3",
    osType: "iOS",
    osVersion: "14.4",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148akb48mail"
  }
  return axios.get(url, {
    headers: {
      "Accept": "*/*",
      "Application-Version": head.appVer,
      "User-Id": head.userId,
      "Accept-Language": "ko-kr",
      "Accept-Encoding": "gzip, deflate, br",
      "Device-Version": head.device,
      "Os-Type": head.osType,
      "Os-Version": head.osVersion,
      "Application-Language": "ko-JP;q=1.0, en-JP;q=0.9, ja-JP;q=0.8",
      "Access-Token": head.accessToken,
      "User-Agent": head.userAgent,
      "Connection": "keep-alive",
      "Terms-Version": "5",
    },
    validateStatus: (status) => (status === 200)
  });
}

async function listPage(page: number, headers: PMHeaders): Promise<{hasNext: boolean; result: PMItem[];}> {
  const url = `https://app-api.izone-mail.com/v1/inbox?is_star=0&is_unread=0&page=${page}`;
  let response;
  try {
    response = (await apiGet(url, headers)).data;
  } catch (err) {
    console.dir(err);
  }
  const items: PMItem[] = response.mails.map((item: any) => ({
    id: item.id,
    member: item.member.name,
    memberID: item.member.id,
    image: item.is_image,
    time: item.receive_time,
    subject: item.subject,
    bodyPreview: item.content.substring(0, 45)
  }));
  return {
    hasNext: response.has_next_page,
    result: items
  };
}

export async function list(headers: PMHeaders): Promise<PMItem[]> {
  const ret = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    log(`Fetching page ${page}..`);
    const {result, hasNext} = await listPage(page, headers);
    ret.push(...result);
    log(`Fetching page ${page} done.`);
    if (!hasNext) {
      break;
    }
    page++;
  }
  return ret;
}

export async function readMail(item: PMItem, headers: PMHeaders): Promise<PMFullItem> {
  log(`Reading mail ${item.id}`);
  let response = (await apiGet(`https://app-web.izone-mail.com/mail/${item.id}`, headers)).data;
  // Replace CSS
  response = response.replace("/css/starship.css", "../css/starship.css");
  // Extract and rename images
  let images: ImageQuote[] = [];
  const matches = response.match(/src="https:\/\/img.izone-mail.com\/(.*?)"/g);
  if (matches !== null) {
    images = [...matches].map((match: string, index) => {
      const url = match.substring(5, match.length - 1);
      return {
        url,
        renameTo: `${index+1}.${url.substring(url.lastIndexOf(".")+1)}`
      };
    });
    for (const image of images) {
      response = response.replace(image.url, image.renameTo);
    }
  }
  return {
    ...item,
    images,
    body: response
  }
}
