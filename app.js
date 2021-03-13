const fs = require('fs');
const readline = require('readline');
const liveServer = require("live-server");
const clients = [];
const homedir = require('os').homedir();
const path = require("path");

function getUId() {
  const uid = Math.random().toString(16).slice(2,8);
  return uid;
}
const params = {
	port: 8080,
	wait: 500,
	cors: true,
  setws: (client) => {
    (function (ws,uid) {
      clients[uid] = {
        ws,
        homedir
      };
      ws.onmessage = (msg) => {wsmessage(uid, msg)};
      console.log("new websocket client added in app.js");
    })(client, getUId());
  },
};

/*
	ignorePattern: '.*.ply',
	middleware: [saveply],
	https: "./https.conf.js"
*/

liveServer.start(params);
console.log("rolling on own live-server");

/**
 * File system
 */
function fileType(filepath) {
  let theType = "unknown";
  const stat = fs.lstatSync(filepath);

  if (stat.isDirectory()) {
    theType = "d";
  } else if(stat.isFile()) {
    theType = "f";
  }

  return theType;
}

function ls(uid, fullpath) {
  const arr = [];
  arr.push({file: fullpath, type: "d"});
  for(const file of fs.readdirSync(fullpath)) {
    arr.push({file, type: fileType(fullpath + "/" + file)});
  }

  return arr;
}

function open(uid, filepath) {
  const fullpath = path.normalize(`${clients[uid].homedir}/${filepath}`);
  if(fileType(fullpath) === "d") {
    try {
      clients[uid].homedir = fullpath;
      return ls(uid, fullpath);
    } catch(err) {
      return err;
    }
  } else {
    console.log(`${filepath} is a file`);
    const stat = fs.lstatSync(fullpath);
    return stat;
  }
}

/**
 * Websocket interaction
 */
function wsmessage(uid, event) {
  const msg = event.data;
  const [key, val] = msg.split(" ");

  console.log("received message:", key);

  switch(key) {
    case "ls":
      const arr = ls(uid, clients[uid].homedir);
      clients[uid].ws.send(JSON.stringify({
        type: "ls",
        content: arr
      }));
      break;
    case "open":
      const result = open(uid, val);

      if(typeof result.length === "undefined") {
        clients[uid].ws.send(JSON.stringify({
          type: "open",
          content: result
        }));
      } else {
        clients[uid].ws.send(JSON.stringify({
          type: "ls",
          content: result
        }));      
      }
      break;
    case "greet":
      clients[uid].ws.send("Greetings for the day");
      break;
    default:
      console.log("Unknown message", msg)
    }
}

/**
 * Terminal interaction
 */
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// async function displayFiles() {
//   const arr = ls();
//   const cwd = arr.splice(0, 1);
//   console.log("Current directory:", cwd);

//   console.log(`0 [d] ..`);
//   for(let i=0;i<arr.length;i++) {
//     console.log(`${i+1} [${arr[i].type}] ${arr[i].file}`);
//   }

//   await new Promise((resolve, reject) => {
//     rl.question('\nEnter a number to select a file\n', (answer) => {
//       if(answer === "0") {
//         process.chdir("../");
//       } else {
//         const req = arr[Number(answer)-1];
//         const res = open(req.file);
//         console.log(res);
//       }
//       resolve();
//     });
//   });

//   await displayFiles();
// }

// displayFiles();
