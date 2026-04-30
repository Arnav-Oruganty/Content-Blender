const basex = require("basex");
const { parseCBankXML, buildCBankXML, parseCBlendXML, buildCBlendXML } = require("./xmlTransform");

class BasexClient {
  constructor() {
    this.host = process.env.BASEX_HOST || "127.0.0.1";
    this.port = parseInt(process.env.BASEX_PORT || "1984", 10);
    this.user = process.env.BASEX_USER || "admin";
    this.pass = process.env.BASEX_PASSWORD || "admin";
  }

  getSession() {
    return new basex.Session(this.host, this.port, this.user, this.pass);
  }

  // Ping to check if server is reachable
  ping() {
    return new Promise((resolve) => {
      const session = this.getSession();
      session.execute("INFO", (err) => {
        session.close();
        if (err) resolve(false);
        else resolve(true);
      });
    });
  }

  execute(cmd) {
    return new Promise((resolve, reject) => {
      const session = this.getSession();
      session.execute(cmd, (err, reply) => {
        session.close();
        if (err) reject(err);
        else resolve(reply.result);
      });
    });
  }

  // Ensures the database exists
  ensureDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const session = this.getSession();
      session.execute(`CHECK ${dbName}`, (err, reply) => {
        session.close();
        if (err) reject(err);
        else resolve(reply.result);
      });
    });
  }

  query(xquery) {
    return new Promise((resolve, reject) => {
      const session = this.getSession();
      const q = session.query(xquery);
      q.execute((err, reply) => {
        session.close();
        if (err) reject(err);
        else resolve(reply.result);
      });
    });
  }

  add(path, input) {
    return new Promise((resolve, reject) => {
      const session = this.getSession();
      session.execute("OPEN content_blender", (err) => {
        if (err) {
          session.close();
          return reject(err);
        }
        session.add(path, input, (err, reply) => {
          session.close();
          if (err) reject(err);
          else resolve(reply);
        });
      });
    });
  }

  replace(path, input) {
    return new Promise((resolve, reject) => {
      const session = this.getSession();
      session.execute("OPEN content_blender", (err) => {
        if (err) {
          session.close();
          return reject(err);
        }
        session.replace(path, input, (err, reply) => {
          session.close();
          if (err) reject(err);
          else resolve(reply);
        });
      });
    });
  }
}

const client = new BasexClient();

module.exports = client;
