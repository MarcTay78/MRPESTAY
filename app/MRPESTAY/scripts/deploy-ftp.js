const path = require("path");
const ftp = require("basic-ftp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.deploy") });

const { PLESK_FTP_HOST, PLESK_FTP_USER, PLESK_FTP_PASS, PLESK_FTP_REMOTE_DIR } = process.env;

if (!PLESK_FTP_HOST || !PLESK_FTP_USER || !PLESK_FTP_PASS || !PLESK_FTP_REMOTE_DIR) {
  console.error("Missing PLESK_FTP_* vars in .env.deploy");
  process.exit(1);
}

const UPLOADS = [".next", "public", "server.js", "package.json", "package-lock.json", "next.config.ts"];

async function main() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: PLESK_FTP_HOST,
      user: PLESK_FTP_USER,
      password: PLESK_FTP_PASS,
      secure: false,
    });
    await client.ensureDir(PLESK_FTP_REMOTE_DIR);
    for (const entry of UPLOADS) {
      const local = path.join(__dirname, "..", entry);
      const remote = entry;
      console.log(`Uploading ${entry} ...`);
      const stat = require("fs").statSync(local);
      if (stat.isDirectory()) {
        await client.cd(PLESK_FTP_REMOTE_DIR);
        await client.uploadFromDir(local, remote);
      } else {
        await client.cd(PLESK_FTP_REMOTE_DIR);
        await client.uploadFrom(local, remote);
      }
    }
    console.log("Deploy complete.");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
