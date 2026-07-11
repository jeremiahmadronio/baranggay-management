import * as mammoth from "mammoth";

export async function viewOrDownloadFile(base64String: string, mime: string, ext: string, fileName: string) {
  const dataUrl = `data:${mime};base64,${base64String}`;

  // 1. Handle DOCX via Mammoth
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
      const html = result.value;

      const win = window.open("");
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${fileName}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 2rem 1rem;
                background: #e8e8e8;
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
              }
              .page {
                background: white;
                max-width: 850px;
                margin: 0 auto;
                padding: 2.5cm 3cm;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                min-height: 100%;
              }
              p { margin: 0 0 0.5em; }
              h1, h2, h3 { margin: 0.5em 0; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
              td, th { border: 1px solid #666; padding: 6px 8px; }
              img { max-width: 100%; height: auto; display: block; margin: 0.5rem auto; }
              u { text-decoration: underline; }
              strong { font-weight: bold; }
              em { font-style: italic; }
            </style>
          </head>
          <body>
            <div class="page">
              ${html}
            </div>
          </body>
          </html>
        `);
        return;
      }
    } catch (e) {
      console.error("Failed to parse DOCX", e);
      // Fallback to download if mammoth fails
    }
  }

  // 2. Handle Videos
  if (mime.startsWith("video/")) {
    const win = window.open("");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html style="height:100%;margin:0;padding:0;">
        <head>
          <title>${fileName}</title>
          <style>
            html, body { height: 100%; margin: 0; padding: 0; background: #000; }
            video { position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <video src="${dataUrl}" controls autoplay></video>
        </body>
        </html>
      `);
      return;
    }
  }

  // 3. Handle Images
  if (mime.startsWith("image/")) {
    const win = window.open("");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { margin: 0; background: #202124; display: flex; justify-content: center; padding: 2rem 0; min-height: 100vh; box-sizing: border-box; }
            .img-container { max-width: 90%; text-align: center; }
            img { max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5); background: white; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="img-container">
            <img src="${dataUrl}" alt="Evidence" />
          </div>
        </body>
        </html>
      `);
      return;
    }
  }

  // 4. Handle PDFs and TXT
  if (mime === "application/pdf" || mime === "text/plain") {
    const win = window.open("");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html style="height:100%;margin:0;padding:0;">
        <head>
          <title>${fileName}</title>
          <style>
            html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
            iframe { position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${dataUrl}" allowfullscreen></iframe>
        </body>
        </html>
      `);
      return;
    }
  }

  // 5. Fallback: Force Download
  if (mime === "application/msword") {
    alert("Legacy Word documents (.doc) cannot be viewed in the browser. Downloading instead.");
  } else if (!mime.startsWith("image/") && !mime.startsWith("video/") && mime !== "application/pdf") {
    alert("This file type cannot be viewed in the browser. Downloading instead.");
  }
  
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
