export function log(...data: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...data);
  }
}