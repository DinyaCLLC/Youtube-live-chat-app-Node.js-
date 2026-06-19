const box = document.getElementById("chat");
const dialog = document.getElementById("dialog");
const dlgInput = document.getElementById("dlg-input");
const dlgApply = document.getElementById("dlg-apply");
const dlgCancel = document.getElementById("dlg-cancel");

const MAX_MESSAGES = 200; /* put the max amount of messages here */

let currentVideoId = '';

window.api.getConfig().then(config => {
  currentVideoId = config.video_id || '';
});

function showDialog() {
  dlgInput.value = currentVideoId;
  dialog.style.display = 'block';
  dlgInput.focus();
  dlgInput.select();
}

function hideDialog() {
  dialog.style.display = 'none';
}

window.api.onShowVideoPrompt(showDialog);

dlgApply.addEventListener('click', async () => {
  const id = dlgInput.value.trim();
  if (!id) return;

  dlgApply.disabled = true;
  const result = await window.api.switchVideo(id);
  if (result.success) {
    currentVideoId = id;
    hideDialog();
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

	while (box.children.length > MAX_MESSAGES) {
		box.removeChild(box.firstChild);
	}

	box.scrollTop = box.scrollHeight;
}

window.api.onMessage(({ timestamp, ranks, authorID, authorhandler, message, pfp }) => {
    addMessage(timestamp, ranks, authorID, authorhandler, message, pfp);
});