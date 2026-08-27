const CONFIG = parseArgument($argument || "");
const COOKIE = CONFIG.cookie || "";
const BASE_URL = "https://cloudstudio.net";
const SCALE = 100000000;

if (!COOKIE) {
  finish("配置错误", "未填写 Cookie", "在模块参数中填入完整的 cloudstudio.net Cookie。");
} else {
  const session = cookieValue(COOKIE, "cloudstudio-session");
  if (!session) {
    finish("配置错误", "Cookie 缺少 cloudstudio-session", "重新登录 cloudstudio.net 后更新模块参数。");
  } else {
    const headers = {
      Cookie: COOKIE,
      "X-XSRF-TOKEN": djb2(session),
      "X-Requested-With": "XMLHttpRequest",
      "Content-Length": "0",
      Accept: "application/json"
    };

    request("POST", "/api/billing/activityTask/SIGN_IN_2025Q3/_reward", headers, function (signError, signResponse, signBody) {
      const signData = parseJson(signBody);
      const signState = describeSignIn(signError, signResponse, signData, signBody);

      request("GET", "/api/billing/resource/package?pageNumber=0&pageSize=100", headers, function (balanceError, balanceResponse, balanceBody) {
        const balance = describeBalance(balanceError, balanceResponse, parseJson(balanceBody));
        finish(signState.title, signState.subtitle, signState.message + "\n" + balance.message);
      });
    });
  }
}

function request(method, path, headers, callback) {
  $httpClient[method.toLowerCase()]({
    url: BASE_URL + path,
    headers: headers,
    timeout: 15,
    policy: "DIRECT"
  }, callback);
}

function describeSignIn(error, response, data, body) {
  if (error) return {title: "Cloud Studio 签到失败", subtitle: "网络请求失败", message: String(error)};
  if (!response || response.status !== 200) {
    return {title: "Cloud Studio 签到失败", subtitle: "HTTP " + (response ? response.status : "无响应"), message: apiMessage(data, body)};
  }

  const reward = numberAt(data, ["rewardNum", "data.rewardNum"]);
  if (reward !== null) {
    return {title: "Cloud Studio 签到成功", subtitle: "获得 " + formatHours(reward) + " 机时", message: "每日签到领取成功"};
  }

  const message = apiMessage(data, body);
  if (/已领取|已签到|already/i.test(message)) {
    return {title: "Cloud Studio 今日已签到", subtitle: "无需重复领取", message: message};
  }
  return {title: "Cloud Studio 签到结果未知", subtitle: "接口返回未识别", message: message};
}

function describeBalance(error, response, data) {
  if (error) return {message: "总机时：查询失败（" + String(error) + "）"};
  if (!response || response.status !== 200) {
    return {message: "总机时：查询失败（HTTP " + (response ? response.status : "无响应") + "）"};
  }

  const packages = findPackages(data);
  if (!packages) return {message: "总机时：接口返回未识别"};

  const totals = packages.reduce(function (sum, item) {
    return sum + Number(item.total || 0);
  }, 0);
  const used = packages.reduce(function (sum, item) {
    return sum + Number(item.used || 0);
  }, 0);
  return {
    message: "资源总机时：" + formatHours(totals) + " 机时\n当前可用机时：" + formatHours(Math.max(0, totals - used)) + " 机时"
  };
}

function findPackages(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;
  const candidates = [data.data, data.data && data.data.list, data.data && data.data.content, data.list, data.content];
  for (let i = 0; i < candidates.length; i += 1) {
    if (Array.isArray(candidates[i])) return candidates[i];
  }
  return null;
}

function numberAt(data, paths) {
  for (let i = 0; i < paths.length; i += 1) {
    const value = paths[i].split(".").reduce(function (current, key) {
      return current && current[key];
    }, data);
    if (typeof value === "number") return value;
  }
  return null;
}

function apiMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback || "响应为空";
  return data.message || data.msg || (data.data && (data.data.message || data.data.msg)) || fallback || "响应未包含说明";
}

function parseJson(value) {
  try {
    return JSON.parse(value || "");
  } catch (_) {
    return null;
  }
}

function parseArgument(argument) {
  return argument.split("&").reduce(function (result, item) {
    const index = item.indexOf("=");
    if (index > 0) result[item.slice(0, index)] = decodeURIComponent(item.slice(index + 1));
    return result;
  }, {});
}

function cookieValue(cookie, name) {
  const match = cookie.match(new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "=([^;]+)"));
  return match ? match[1] : "";
}

function djb2(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = (hash + ((hash << 5) + value.charCodeAt(i))) & 0x7fffffff;
  return String(hash);
}

function formatHours(value) {
  return (Number(value || 0) / SCALE).toFixed(2).replace(/\.00$/, "");
}

function finish(title, subtitle, body) {
  $notification.post(title, subtitle, body);
  $done({});
}
