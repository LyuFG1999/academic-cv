// Citation.js also ships URL/remote-input utilities. This dashboard only parses
// local text, so do not bundle Node networking modules into the browser.
const offlineFetch = () => { throw new Error('引文导入仅接受本地文件或粘贴文本。'); };
offlineFetch.Headers = globalThis.Headers;
export const Headers = globalThis.Headers;
export default offlineFetch;
