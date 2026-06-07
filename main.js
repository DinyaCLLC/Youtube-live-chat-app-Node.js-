/*
NOTE: this error might appear in the console:
error: ReferenceError: newContinuation is not defined

if it doesn't repeat consntantly, you can ignore it
*/

// variables for chat loop
const seenMessageIds = new Set();
const VIDEO_ID = "FbFE96dcxGE"; // video ID here, this is just a sample video ID
let numTimes = 0;

const { app, BrowserWindow, ipcMain, shell } = require('electron');

ipcMain.handle('open-external', (_, url) => {
    shell.openExternal(url);
});

app.disableHardwareAcceleration();

let win;

// function in testing
async function getInitialContinuation(videoId) {
 const res = await fetch(`https://www.youtube.com/live_chat?v=${videoId}`, {
  headers: {
   // pretend to have a modern browser so YouTube doesn't complain
   "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
   "Accept-Language": 'en-US,en;q=0.9', // english
  }
 });

 const html = await res.text();

 // use this to debug the HTML: console.log(html);

 const match = html.match(/"continuation":"([^"]+)"/); // extract continuation from returned HTML

 if (!match) {
  console.log(html);
  throw new Error("Failed to extract continuation");
 }

 return match[1];
}



function getContinuation(json) {
 const cont = json.continuationContents?.liveChatContinuation?.continuations?.[0];

 if (!cont) return null;

 return (
  cont.timedContinuationData?.continuation ||
  cont.invalidationContinuationData?.continuation ||
  cont.reloadContinuationData?.continuation ||
  cont.liveChatReplayContinuationData?.continuation ||
  null
 );
}

function formatTimestamp(timestamp) {
 const ms = Math.floor(timestamp / 1000);
 return new Intl.DateTimeFormat("en-US", {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3
 }).format(ms);
}

// Push chat to UI
function pushToUI(timestamp, authorID, authorhandler, message, pfp) {
 if (win) {
  win.webContents.send('chat-message', { timestamp, authorID, authorhandler, message, pfp });
 }
}

// Emoji paresr
function parseMessageRuns(runs = []) {
 return runs.map(item => {
  if (item.text) {
   return { type: "text", value: item.text };
  }

  if (item.emoji?.emojiId) {
   const emoji = item.emoji;

   // pick thumbnail[1] or fallback to [0]
   const thumb =
    emoji.image?.thumbnails?.[1]?.url ||
    emoji.image?.thumbnails?.[0]?.url;

   return {
    type: "emoji",
    id: emoji.emojiId,
    url: thumb
   };
  }

  return null;
 }).filter(Boolean);
}

// Chat loop
async function pollChat() {
 while (true) {
  try {
   // split URL cuz YouTube truncates it when typing in a post
   const response = await fetch("https://www.youtube.com/" + "youtubei/v1/live_chat/get_live_chat?prettyPrint=false", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
     // pretending to have a modern browser so YouTube doesn't complain
     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
    },
    body: JSON.stringify({
     context: {
      client: {
       clientName: "WEB",
       clientVersion: '2.20260603.05.00' // pretending to have a new browser version so YouTube doesn't complain
      }
     },
     continuation: newContinuation
    })
   });

   numTimes++;

   const json = await response.json();

   const nextContinuation = getContinuation(json);

   if (nextContinuation) {
    newContinuation = nextContinuation;
   }

   const actions =
    json.continuationContents?.liveChatContinuation?.actions ?? [];

   for (const action of actions) {
    const renderer =
     action.addChatItemAction?.item?.liveChatTextMessageRenderer;

    if (!renderer) continue;

    const messageId = renderer.id;

    // Skip duplicates
    if (messageId && seenMessageIds.has(messageId)) {
     continue;
    }

    // Mark as seen
    if (messageId) {
     seenMessageIds.add(messageId);

     // Memory limit
     if (seenMessageIds.size > 50000) {
      const oldest = seenMessageIds.values().next().value;
      seenMessageIds.delete(oldest);
     }
    }

    const pfp =
     renderer.authorPhoto?.thumbnails?.at(-1)?.url ||
     renderer.authorPhoto?.thumbnails?.[0]?.url;

    const timestamp = formatTimestamp(renderer.timestampUsec);
    const message = parseMessageRuns(renderer.message?.runs ?? []);
    const authorID = renderer.authorExternalChannelId ?? "Unknown";
    const authorhandler = renderer.authorName?.simpleText ?? "Unknown";

    pushToUI(
     timestamp,
     authorID,
     authorhandler,
     message,
     pfp
    );
   }
  } catch (e) {
   console.log("error:", e);

   // Avoid a tight error loop
   await new Promise(resolve => setTimeout(resolve, 1000));
  }
 }
}

// Window
function createWindow() {
 win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
   preload: __dirname + "/preload.js"
  }
 });

 win.loadFile("index.html");

 pollChat();
}

// app.whenReady().then(createWindow);
app.whenReady().then(async () => {
 createWindow();
 newContinuation = await getInitialContinuation(VIDEO_ID);
 pollChat();
});
