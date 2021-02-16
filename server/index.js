var ldap = require("ldapjs");
var fs = require("fs");

var server = ldap.createServer();

function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals("cn=root"))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

function loadPasswdFile(req, res, next) {
  fs.readFile("/etc/passwd", "utf8", function (err, data) {
    if (err) return next(new ldap.OperationsError(err.message));

    req.users = {};

    var lines = data.split("\n");
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i] || /^#/.test(lines[i])) continue;

      var record = lines[i].split(":");
      if (!record || !record.length) continue;

      req.users[record[0]] = {
        dn: "cn=" + record[0] + ", ou=users, o=myhost",
        attributes: {
          cn: record[0],
          uid: record[2],
          gid: record[3],
          description: record[4],
          homedirectory: record[5],
          shell: record[6] || "",
          objectclass: "unixUser",
        },
      };
    }

    return next();
  });
}

var pre = [authorize, loadPasswdFile];

server.bind("cn=root", function (req, res, next) {
  if (req.dn.toString() !== "cn=root" || req.credentials !== "secret")
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.search("o=myhost", pre, function (req, res, next) {
  Object.keys(req.users).forEach(function (k) {
    if (req.filter.matches(req.users[k].attributes)) res.send(req.users[k]);
  });
  res.end();
  return next();
});

server.listen(1389, function () {
  console.log("/etc/passwd LDAP server up at: %s", server.url);
});
