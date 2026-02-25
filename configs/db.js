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

const maybeFixSrvDnsTimeout = async (dbUrl) => {
  if (!dbUrl.startsWith("mongodb+srv://")) return;

  let hostname;
  try {
    hostname = new URL(dbUrl).hostname;
  } catch (e) {
    return;
  }

  const srvName = `_mongodb._tcp.${hostname}`;

  try {
    await dns.promises.resolveSrv(srvName);
  } catch (err) {
    if (err && err.code === "ETIMEOUT") {
      const servers =
        parseCsv(process.env.MONGO_DNS_SERVERS) || DEFAULT_PUBLIC_DNS;
      dns.setServers(servers.length ? servers : DEFAULT_PUBLIC_DNS);

      // Retry once after swapping DNS
      await dns.promises.resolveSrv(srvName);
    } else {
      throw err;
    }
  }
};

const connection = (async () => {
  const dbUrl = String(process.env.dbURL || "").trim();
  if (!dbUrl) {
    throw new Error("Missing env var dbURL");
  }

  await maybeFixSrvDnsTimeout(dbUrl);

  return mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 15000,
  });
})();

module.exports = { connection };
