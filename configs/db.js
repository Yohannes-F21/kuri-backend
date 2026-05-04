const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

mongoose.set("strictQuery", false);

const DEFAULT_PUBLIC_DNS = ["1.1.1.1", "8.8.8.8"];

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const buildDirectMongoUri = async (dbUrl) => {
  if (!dbUrl.startsWith("mongodb+srv://")) {
    return dbUrl;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(dbUrl);
  } catch (error) {
    return dbUrl;
  }

  const srvName = `_mongodb._tcp.${parsedUrl.hostname}`;

  let srvRecords;
  try {
    srvRecords = await dns.promises.resolveSrv(srvName);
  } catch (error) {
    if (error && error.code === "ETIMEOUT") {
      const servers = parseCsv(process.env.MONGO_DNS_SERVERS);
      dns.setServers(servers.length ? servers : DEFAULT_PUBLIC_DNS);
      srvRecords = await dns.promises.resolveSrv(srvName);
    } else {
      throw error;
    }
  }

  if (!Array.isArray(srvRecords) || srvRecords.length === 0) {
    return dbUrl;
  }

  const hosts = srvRecords
    .map(
      ({ name, port }) =>
        `${String(name || "").replace(/\.$/, "")}:${port || 27017}`,
    )
    .join(",");

  const txtOptions = new URLSearchParams(parsedUrl.search);
  try {
    const txtRecords = await dns.promises.resolveTxt(srvName);
    const txtPairs = txtRecords
      .flat()
      .map((record) => String(record || ""))
      .join("&")
      .split("&")
      .map((pair) => pair.trim())
      .filter(Boolean);

    for (const pair of txtPairs) {
      const [key, ...valueParts] = pair.split("=");
      if (!key || valueParts.length === 0) {
        continue;
      }

      if (!txtOptions.has(key)) {
        txtOptions.set(key, valueParts.join("="));
      }
    }
  } catch (_) {
    // Atlas TXT lookups are optional; fall back to the explicit query string if they fail.
  }

  if (!txtOptions.has("tls") && !txtOptions.has("ssl")) {
    txtOptions.set("tls", "true");
  }

  const username = parsedUrl.username
    ? encodeURIComponent(parsedUrl.username)
    : "";
  const password = parsedUrl.password
    ? `:${encodeURIComponent(parsedUrl.password)}`
    : "";
  const auth = username ? `${username}${password}@` : "";
  const pathname =
    parsedUrl.pathname && parsedUrl.pathname !== "/" ? parsedUrl.pathname : "/";
  const search = txtOptions.toString() ? `?${txtOptions.toString()}` : "";

  return `mongodb://${auth}${hosts}${pathname}${search}`;
};

const connection = (async () => {
  const dbUrl = String(process.env.dbURL || "").trim();
  if (!dbUrl) {
    throw new Error("Missing env var dbURL");
  }

  const directDbUrl = String(process.env.dbURL_DIRECT || "").trim();
  let resolvedDbUrl = dbUrl;

  try {
    resolvedDbUrl = await buildDirectMongoUri(dbUrl);
  } catch (error) {
    if (!directDbUrl) {
      throw error;
    }
    resolvedDbUrl = directDbUrl;
  }

  return mongoose.connect(resolvedDbUrl, {
    serverSelectionTimeoutMS: 15000,
  });
})();

module.exports = { connection };
