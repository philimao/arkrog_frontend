import { toast } from "react-toastify";
import type { CharBasicData, CharsBasic } from "~/types/gameData";
import type { TeamMemberData } from "~/types/recordType";

async function URLValidation(url: string) {
  if (url === "#") return url;
  let newURL = url.trim().split(" ")[0];
  newURL = newURL.replace("http:", "https:");

  // if the url is a short bv link, make it a full link
  // if it is a b23 short link, fetch the redirect url
  if (newURL.includes("b23.tv")) {
    const shortLink = newURL.match(/https:\/\/b23.tv\/.*/)?.[0];
    const resRaw = await fetch("/api/parse-redirect?url=" + shortLink);
    newURL = await resRaw.text();
  }

  newURL = newURL.split("#")[0];
  newURL = newURL.split("/&")[0];
  newURL = newURL.split("&spm_id_from=")[0];
  newURL = newURL.replace(/？/g, "");

  // replace redundant ?
  const qArray = newURL.split("?");
  const qF = qArray.shift();
  const qAS = qArray.join("&");
  if (qAS) newURL = qF + "?" + qAS;
  else newURL = qF as string;
  // for youtube
  if (newURL.includes("youtu.be")) {
    const id = newURL.split("youtu.be/")[1].split("?")[0];
    newURL = "https://www.youtube.com/watch?v=" + id;
  }
  // for bilibili
  if (newURL.includes("bilibili.com/video/av")) {
    const query = newURL.split("?")[1];
    const av = newURL.match(/av\d*/)?.[0].slice(2);
    newURL =
      "https://www.bilibili.com/video/" +
      (avToBv(parseInt(av as string)) + (query ? "?" + query : ""));
  }
  newURL = newURL.replace("m.bilibili", "www.bilibili");
  if (newURL.startsWith("www")) {
    newURL = "https://" + newURL;
  }
  if (newURL.startsWith("bv")) {
    newURL = "https://www.bilibili.com/video/" + newURL.replace("bv", "BV");
  } else if (newURL.startsWith("BV")) {
    newURL = "https://www.bilibili.com/video/" + newURL;
  } else if (newURL.match(/\/video\/bv/i)) {
    const index = newURL.search(/bv/i);
    newURL = newURL.slice(0, index) + "BV" + newURL.slice(index + 2);
  }
  // leave out all queries but p
  try {
    if (newURL.match(/video\/BV.*\?.*/)) {
      const BV = newURL.match(/BV[^?/]+/)?.[0];
      let p = parseInt(newURL.match(/(?<!m)p=(\d+)/)?.[1] as string);
      if (p > 200) p = 1;
      const query = p && p !== 1 ? "p=" + p : "";
      newURL =
        "https://www.bilibili.com/video/" + BV + (query ? "?" + query : "");
    } else if (
      newURL.includes("t.bilibili.com") ||
      newURL.includes("www.bilibili.com/opus")
    ) {
      newURL = newURL.split("?")[0];
    } else if (newURL.includes("youtube")) {
      const id = newURL.match(/v=([^&]+)/)?.[1];
      newURL = "https://www.youtube.com/watch?v=" + id;
    }
  } catch (e) {
    console.log(e);
  }
  newURL.trim();
  // remove last /
  if (newURL.endsWith("/")) {
    newURL = newURL.slice(0, newURL.length - 1);
  }
  try {
    const u = new URL(newURL);
    if (!u.protocol.includes("https")) {
      console.log(u);
      toast.warning("请使用HTTPS协议！");
      return false;
    } else return newURL;
  } catch (err) {
    console.log(newURL, err);
    toast.warning("链接格式不合法！");
  }
}

function avToBv(av: number) {
  const table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
  const tr: { [key: string]: number } = {};
  for (let i = 0; i < 58; i++) {
    tr[table[i]] = i;
  }
  const s = [11, 10, 3, 8, 4, 6];
  const xor = 177451812;
  const add = 8728348608;
  av = (av ^ xor) + add;
  const bv = [..."BV1  4 1 7  "];
  for (let i = 0; i < 6; i++) {
    bv[s[i]] = table[Math.floor(av / 58 ** i) % 58];
  }
  return bv.join("");
}

function charStrToData(
  charStr: string,
  character_basic: CharsBasic,
): TeamMemberData {
  let charId = "",
    name = "",
    skillStr = "",
    skillId = "",
    charNameStr = charStr.trim(),
    charData;
  const skillStrMatch = charNameStr.match(/(?<!-)\d$/);
  if (skillStrMatch) {
    // 不是小车
    skillStr = skillStrMatch[0];
    charNameStr = charNameStr.slice(0, charNameStr.length - 1);
  }
  charData = Object.values(character_basic).find(
    (charData: CharBasicData) =>
      charData.name.toUpperCase() === charNameStr.toUpperCase(),
  );
  if (charData) {
    name = charData.name;
    charId = charData.charId;
    skillId =
      Object.values(charData.skills).find(
        (skill) => skillStr === skill.skillOrder.toString(),
      )?.skillId || "error";
  }
  return { charId, name, skillId, skillStr, charData };
}

export { URLValidation, charStrToData };
