const box = document.getElementById("chat");
const dialog = document.getElementById("dialog");
const dlgTitle = document.getElementById("dlg-title");
const dlgInput = document.getElementById("dlg-input");
const dlgApply = document.getElementById("dlg-apply");
const dlgCancel = document.getElementById("dlg-cancel");

let currentVideoId = '';
let currentMaxMessages = 200;
let dialogMode = 'video';

window.api.getConfig().then(config => {
  currentVideoId = config.video_id || '';
  currentMaxMessages = config.max_messages || 200;
});

function showDialog(mode) {
  dialogMode = mode;
  if (mode === 'video') {
    dlgTitle.textContent = 'Change Video ID';
    dlgInput.value = currentVideoId;
    dlgInput.placeholder = 'Enter YouTube Video ID';
  } else {
    dlgTitle.textContent = 'Change Max Messages';
    dlgInput.value = currentMaxMessages;
    dlgInput.placeholder = 'Enter max messages count';
  }
  dialog.style.display = 'block';
  dlgInput.focus();
  dlgInput.select();
}

function hideDialog() {
  dialog.style.display = 'none';
}

window.api.onShowVideoPrompt(() => showDialog('video'));
window.api.onShowMaxMessagesPrompt(() => showDialog('maxMessages'));

dlgApply.addEventListener('click', async () => {
  const val = dlgInput.value.trim();
  if (!val) return;

  dlgApply.disabled = true;

  if (dialogMode === 'video') {
    const result = await window.api.switchVideo(val);
    if (result.success) {
      currentVideoId = val;
      hideDialog();
    }
  } else {
    const count = parseInt(val, 10);
    if (!isNaN(count) && count > 0) {
      await window.api.setMaxMessages(count);
      currentMaxMessages = count;
      hideDialog();
    }
  }

  dlgApply.disabled = false;
});

dlgCancel.addEventListener('click', hideDialog);

dlgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dlgApply.click();
  if (e.key === 'Escape') hideDialog();
});

window.api.onClearChat(() => {
  box.innerHTML = '';
});

function renderMessageParts(parts) {
	const frag = document.createDocumentFragment();

	for (const part of parts) {
		if (part.type === "text") {
			frag.appendChild(document.createTextNode(part.value));
		}

		if (part.type === "emoji") {
			const img = document.createElement("img");
			img.src = part.url;
			img.alt = part.id;
			img.style.height = "1em";
			img.style.verticalAlign = "middle";
			img.style.display = "inline-block";

			frag.appendChild(img);
		}
	}

	return frag;
}

function addMessage(timestamp, ranks, authorID, authorhandler, message, pfp) {
	const div = document.createElement("div");

	const img = document.createElement("img");
	img.src = pfp;
	img.style.height = "1em";
	img.style.verticalAlign = "middle";

	const timestamp_text = document.createElement("span");
	timestamp_text.style.color = 'cyan';
	timestamp_text.textContent = timestamp;

	const author_text = document.createElement("a");
	author_text.style.color = "gray";
	author_text.style.cursor = "pointer";
	author_text.textContent = authorhandler;
	author_text.title = authorID;
	author_text.href = `https://www.youtube.com/channel/${authorID}`;

	author_text.addEventListener("click", (e) => {
		e.preventDefault();
		window.api.openExternal(author_text.href);
	});

	const message_span = document.createElement("span");
	message_span.appendChild(renderMessageParts(message));

	if (ranks)
		div.append(img, ' ', timestamp_text, ' ', ranks, ' ', author_text, ': ', message_span);
	else
		div.append(img, ' ', timestamp_text, ' ', author_text, ': ', message_span);

	box.appendChild(div);

	while (box.children.length > currentMaxMessages) {
		box.removeChild(box.firstChild);
	}

	box.scrollTop = box.scrollHeight;
}

window.api.onMessage(({ timestamp, ranks, authorID, authorhandler, message, pfp }) => {
    addMessage(timestamp, ranks, authorID, authorhandler, message, pfp);
});