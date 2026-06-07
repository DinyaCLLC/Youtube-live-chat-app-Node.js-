# YouTube Live Chat App

This is a Node.js project that lets you view YouTube live chat from a given video ID.

## Requirements

- Node.js installed

## Setup Instructions

1. Download all project files into a folder.
2. Open **Command Prompt** in that folder.
3. Run the following commands:

```bash
npm init -y
npm install electron@latest --save-dev
````

This installs Electron into the project folder.

4. Open `run.ps1`.

The first time you run it, you will see:

```
Downloading Electron binary...
```

Wait until it reaches 100% before continuing.

---

## If You Get This Error

```
Error launching app

Unable to find Electron app at <your directory>

Cannot find module '<your directory>\index.js'.
Please verify that the package.json has a valid main entry.
```

### Fix

The last line explains the problem:

> `package.json` has an incorrect `main` entry.

Open `package.json` and change:

```json
"main": "index.js"
```

to:

```json
"main": "main.js"
```

Save the file and run the script again.

---

Your Electron app should now work correctly.


## Setting up script

All you really need is the video ID in main.js and max messages count in renderer.js, in main.js edit the `VIDEO_ID` variable to your YouTube video ID with live chat, in renderer.js edit the `MAX_MESSAGES` variable to the maximum amount of messages that can be shown in the live chat app.
NOTE: this is untested for premires with live chat.