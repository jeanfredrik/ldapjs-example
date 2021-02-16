var ldap = require("ldapjs");
var pify = require("pify");
const { fromEventEmitter } = require("../utils/generator");

var client = pify(
  ldap.createClient({
    url: ["ldap://127.0.0.1:1389", "ldap://127.0.0.2:1389"],
  }),
);

async function runProgram() {
  try {
    await client.bind("cn=root", "secret");
    let results = await client.search("o=myhost");
    let entries = await fromEventEmitter(results, "searchEntry");
    for await (const entry of entries) {
      console.log(entry.object);
    }
  } finally {
    client.destroy();
  }
}

runProgram();
