async function _get<T>(url: string): Promise<T | null> {
  return fetch(`${import.meta.env.VITE_API_BASE_URL}` + url, {
    credentials: "include",
  })
    .then((response: Response) => {
      if (response.ok) {
        return response
          .clone()
          .json()
          .catch(() => response.text());
      } else {
        throw new Error(response.statusText);
      }
    })
    .catch((e: Error) => {
      console.error(e);
    });
}

async function _post<T>(url: string, data: object): Promise<T | null> {
  return fetch(`${import.meta.env.VITE_API_BASE_URL}` + url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response: Response) => {
      if (response.ok) {
        return response
          .clone()
          .json()
          .catch(() => response.text());
      } else {
        throw new Error(response.statusText);
      }
    })
    .catch((e: Error) => {
      console.error(e);
    });
}

export { _get, _post };
