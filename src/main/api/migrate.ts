import { PMHeaders } from ".";
import http2 from "http2";
import { ANDROID_UA, UserAgent } from "./ua";
import { log } from "../util";

interface HTTP2Response {
  status: number;
  headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

interface TokenPair {
  userId: string;
  accessToken: string;
}

/**
 * @description HTTP/2 client for single requests. HTTP/2 is required during IZPM token issuing.
 */
export function apiHTTP2(
  method: "GET" | "POST",
  url: string,
  headers: PMHeaders & {language: string; termsVersion: number; contentType?: string;},
  body?: any
): Promise<HTTP2Response> {
  const { origin, pathname } = new URL(url);

  const client = http2.connect(origin);
  return new Promise<HTTP2Response>((res, rej) => {
    client.on('error', rej);

    const reqHeaders: http2.OutgoingHttpHeaders = {
      ':method': method,
      ':path': pathname,
      'content-type': headers.contentType ?? 'application/json',
      'user-id': headers.userId,
      'access-token': headers.accessToken,
      'os-type': headers.osType ?? ANDROID_UA["os-type"],
      'os-version': headers.osVersion ?? ANDROID_UA["os-version"],
      'user-agent': headers.userAgent ?? ANDROID_UA["user-agent"],
      'device-version': headers.device ?? ANDROID_UA["device-version"],
      'application-version': headers.appVer ?? ANDROID_UA["application-version"],
      'application-language': headers.language,
      'terms-version': headers.termsVersion,
      'accept-encoding': 'gzip'
    };
    const req = client.request(reqHeaders);
    req.setEncoding('utf8');

    let bodyString;
    if (method === "POST") {
      if (body === undefined) {
        bodyString = "";
      } else {
        bodyString = reqHeaders["content-type"] === "application/json" ? JSON.stringify(body) : body;
      }
      const buffer = Buffer.from(bodyString, "utf-8");
      reqHeaders['content-length'] = buffer.length;
      req.write(buffer);
    }

    let resultHeaders: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader = {};
    req.on('response', (headers) => {
      resultHeaders = headers;
    });
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      client.close();
      let parsedBody;
      try {
        parsedBody = JSON.parse(data);
      } catch {
        parsedBody = data;
      }
      res({
        status: resultHeaders[":status"],
        headers: resultHeaders,
        body: parsedBody
      });
    });
    req.end();
  });
}

export async function issueTokenPair(ua: UserAgent): Promise<TokenPair | undefined> {
  const response = await apiHTTP2("POST", "https://app-api.izone-mail.com/v1/users", {
    language: "ja",
    termsVersion: 0,
    userId: "",
    accessToken: "",
    osType: ua["os-type"],
    osVersion: ua["os-version"],
    userAgent: ua["user-agent"],
    device: ua["device-version"],
    appVer: ua["application-version"],
  });
  if (response.status !== 200) {
    log("issueTokenPair error: ", response);
    return undefined;
  }
  try {
    return {
      userId: response.body.user.id,
      accessToken: response.body.user.access_token
    };
  } catch (err) {
    log("issueTokenPair fail: ", response);
    return undefined;
  }
}

export async function migrateFrom(userId: string, password: string, token: TokenPair, ua: UserAgent): Promise<TokenPair | undefined> {
  const response = await apiHTTP2("POST", "https://app-api.izone-mail.com/v1/data_inherit_execute", {
    language: "ja",
    termsVersion: 5,
    userId: token.userId,
    accessToken: token.accessToken,
    osType: ua["os-type"],
    osVersion: ua["os-version"],
    userAgent: ua["user-agent"],
    device: ua["device-version"],
    appVer: ua["application-version"],
    contentType: "application/x-www-form-urlencoded"
  }, `user_id=${userId}&password=${password}`);
  if (response.status === 400) {
    return undefined;
  }
  if (response.status !== 200) {
    log("migrateFrom error: ", response);
    return undefined;
  }
  try {
    return {
      userId: response.body.user.id,
      accessToken: response.body.user.access_token
    };
  } catch (err) {
    log("migrateFrom fail: ", response);
    return undefined;
  }
}

export async function migrateAway(token: TokenPair, ua: UserAgent): Promise<{
  password: string;
  expiry: string;
} | undefined> {
  const response = await apiHTTP2("POST", "https://app-api.izone-mail.com/v1/data_inherit_publish", {
    language: "ja",
    termsVersion: 5,
    userId: token.userId,
    accessToken: token.accessToken,
    osType: ua["os-type"],
    osVersion: ua["os-version"],
    userAgent: ua["user-agent"],
    device: ua["device-version"],
    appVer: ua["application-version"],
  });
  console.log(response.body);
  if (response.status !== 200) {
    log("migrateTo error: ", response);
    return undefined;
  }
  try {
    return {
      password: response.body.data_inherit.password,
      expiry: response.body.data_inherit.expiration_time
    };
  } catch (err) {
    log("migrateTo fail: ", response);
    return undefined;
  }
}
