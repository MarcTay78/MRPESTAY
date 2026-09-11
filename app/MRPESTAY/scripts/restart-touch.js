const path = require("path");
const os = require("os");
const fs = require("fs");
const ftp = require("basic-ftp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.deploy") });

const { PLESK_FTP_HOST, PLESK_FTP_USER, PLESK_FTP_PASS, PLESK_FTP_REMOTE_DIR } = process.env;

async function main() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  const emptyFile = path.join(os.tmpdir(), "restart.txt");
  fs.writeFileSync(emptyFile, "");
  try {
    await client.access({ host: PLESK_FTP_HOST, user: PLESK_FTP_USER, password: PLESK_FTP_PASS, secure: false });
    await client.ensureDir(`${PLESK_FTP_REMOTE_DIR}/tmp`);
    await client.uploadFrom(emptyFile, "restart.txt");
    console.log("Touched tmp/restart.txt — Passenger will restart the app.");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
