let logs = [];
let socket;

function connectWebsocket(server) {
  return new Promise(function(resolve, reject) {
    socket = new WebSocket(server);
    socket.onerror = error => {
      console.log(error);
      reject(error);
    };

    socket.onopen = event => {
      for (index in logs) {
        sendLog(logs[index].msg, logs[index].type);
      }
      logs = [];
      resolve(socket);
    };

    socket.onmessage = event => {
      let obj = JSON.parse(event.data);
      if (obj.type === "imageRequest") {
        let canvas = document.getElementById("p5canvas").firstChild;
        let data = canvas.toDataURL("image/png");
        socket.send(
          JSON.stringify({
            type: "imageData",
            mimeType: "png",
            data: data
          })
        );
      }
    };
    server.onopen = function() {
      resolve(server);
    };
    server.onerror = function(err) {
      console.err(error);
      reject(err);
    };
  });
}

//socket = setupWebsocket(server);
async function setupWebsocket(server) {
  socket = await connectWebsocket(server);
}

// function setupWebsocket(server) {
//   socket = new WebSocket(server);

//   socket.onerror = error => {
//     console.log(error);
//   };

//   socket.onopen = event => {
//     for (index in logs) {
//       sendLog(logs[index].msg, logs[index].type);
//     }
//     logs = [];
//   };

//   socket.onmessage = event => {
//     let obj = JSON.parse(event.data);
//     if (obj.type === "imageRequest") {
//       let canvas = document.getElementById("p5canvas").firstChild;
//       let data = canvas.toDataURL("image/png");
//       socket.send(
//         JSON.stringify({
//           type: "imageData",
//           mimeType: "png",
//           data: data
//         })
//       );
//     }
//   };
// }

function addLog(msg, type) {
  msg = msg.join(" ");
  if (typeof msg === "object") {
    msg = JSON.stringify(JSON.parse(JSON.stringify(msg)));
    //msg = JSON.stringify(msg, null, 4);
  }

  if (socket != undefined && socket.readyState === 1) {
    sendLog(msg, type);
  } else {
    logs.push({ msg: msg, type: type });
  }
}

window.console.log = function() {
  msg = [];
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === "object") {
      msg.push(JSON.stringify(arguments[i]));
    } else msg.push(arguments[i]);
  }
  addLog(msg, "log");
};
window.console.debug = msg => {
  addLog(msg, "debug");
};
window.console.error = msg => {
  msg = [];
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === "object") {
      msg.push(JSON.stringify(arguments[i]));
    } else msg.push(arguments[i]);
  }
  addLog(msg, "error");
};
window.console.info = msg => {
  addLog(msg, "info");
};
window.console.trace = msg => {
  addLog(msg, "trace");
};
window.console.warn = msg => {
  addLog(msg, "warn");
};

function sendLog(msg, type) {
  socket.send(
    JSON.stringify({
      type: "log",
      msg: msg,
      logType: type
    })
  );
}
