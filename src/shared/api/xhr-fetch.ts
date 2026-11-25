function parseHeaders(raw: string): Headers {
  const headers = new Headers();
  for (const line of raw.trim().split(/[\r\n]+/)) {
    const index = line.indexOf(":");
    if (index > 0) headers.append(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }
  return headers;
}

export function xhrFetch(url: string, init: RequestInit, onUploadProgress: (fraction: number) => void): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const signal = init.signal;
    const abort = () => {
      xhr.abort();
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal?.aborted) return abort();
    xhr.open(init.method ?? "GET", url);
    new Headers(init.headers).forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.withCredentials = init.credentials === "include";
    xhr.responseType = "arraybuffer";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onUploadProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      signal?.removeEventListener("abort", abort);
      const empty = xhr.status === 204 || xhr.status === 205 || xhr.status === 304;
      resolve(new Response(empty ? null : xhr.response, { status: xhr.status, statusText: xhr.statusText, headers: parseHeaders(xhr.getAllResponseHeaders()) }));
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", abort);
      reject(new TypeError("Failed to fetch"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    xhr.send((init.body as XMLHttpRequestBodyInit | null | undefined) ?? null);
  });
}
