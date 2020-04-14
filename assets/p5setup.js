// function setup2() {
//   // Override the loadImage method from p5js to enable the usage of relative paths
//   // This method must be overriden inside of setup
//   let loadImageSuper = loadImage;
//   loadImage = (path, successCallback, failureCallback) => {
//     if (!path.startsWith("file:") && !path.startsWith("http")) {
//       path = decodeURI(localPath) + path;
//     }
//     return loadImageSuper.apply(this, [path, successCallback, failureCallback]);
//   };

//   let loadJSONSuper = loadJSON;
//   loadJSON = (path, successCallback, failureCallback) => {
//     if (!path.startsWith("file:") && !path.startsWith("http")) {
//       path = decodeURI(localPath) + path;
//     }
//     return loadJSONSuper.apply(this, [path, successCallback, failureCallback]);
//   };

//   /*var p5canvas = createCanvas(windowWidth, windowHeight);
//   console.log(p5canvas);
//   p5canvas.parent("#p5canvas");
//   frameRate(30);
//   clear();*/
//   //console.log("SETUP");
//   //frameRate(30);
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   clear();
// }

// function p5reset() {
//   clear();
//   fill(255, 255, 255);
//   stroke(0, 0, 0);
//   strokeWeight(1);
//   textSize(12);
// }

// Override the loadImage method from p5js to enable the usage of relative paths
// This method must be overriden inside of setup
// let loadImageSuper = p5.loadImage;
// loadImage = (path, successCallback, failureCallback) => {
//   if (!path.startsWith("file:") && !path.startsWith("http")) {
//     path = decodeURI(localPath) + path;
//   }
//   return loadImageSuper.apply(this, [path, successCallback, failureCallback]);
// };

// console.log("PATCHED:", loadJSONvscode);
// p5.loadJSON = loadJSONvscode;
// console.log("PATCHED2:", p5.loadJSONSONvscode);
// console.log("PATCHED21:", window.loadJSON);
new p5();
width = windowWidth;
var height = windowHeight;

var loadImageSuper = window.p5.prototype.loadImage;

const loadImagevscode = (originalPath, successCallback, failureCallback) => {
  let loadPath = originalPath;
  if (!originalPath.startsWith("file:") && !originalPath.startsWith("http")) {
    loadPath = decodeURI(localPath) + originalPath;
  }

  return loadImageSuper.apply(this, [
    loadPath,
    successCallback,
    failureCallback,
  ]);
};

window.p5.prototype.loadImage = loadImagevscode;

var loadJSONSuper = window.p5.prototype.loadJSON;

const loadJSONvscode = (originalPath, successCallback, failureCallback) => {
  let loadPath = originalPath;
  if (!originalPath.startsWith("file:") && !originalPath.startsWith("http")) {
    loadPath = decodeURI(localPath) + originalPath;
  }

  return loadJSONSuper.apply(this, [
    loadPath,
    successCallback,
    failureCallback,
  ]);
};
window.p5.prototype.loadJSON = loadJSONvscode;
