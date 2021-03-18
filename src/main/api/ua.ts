
export interface UserAgent {
  "user-agent": string;
  "os-version": string;
  "os-type": string;
  "application-version": string;
  "device-version": string;
}

export const IOS_UA = {
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148akb48mail",
  "os-version": "14.4",
  "os-type": "iOS",
  "application-version": "1.2.3",
  "device-version": "iPhone13,3"
};

export const ANDROID_UA = {
  "user-agent": "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36",
  "os-version": "10.0",
  "os-type": "android",
  "application-version": "1.4.5",
  "device-version": "SM-G981B"
};
