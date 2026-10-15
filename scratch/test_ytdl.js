const youtubeSr = require('youtube-sr').default;
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

async function run() {
  const query = "The Matrix 1999 Neo dodging bullets scene 1080p";
  console.log(`Searching for: ${query}`);
  
  const video = await youtubeSr.searchOne(query, "video");
  if (!video) {
    console.error("No video found!");
    return;
  }
  
  console.log(`Found video: ${video.title} (${video.url})`);
  
  const outputDir = path.join(__dirname, '..', 'public', 'video', 'clips');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'test_clip.mp4');
  console.log(`Downloading to ${outputPath}`);
  
  try {
    // Download a 5 second clip (from 00:00:05 to 00:00:10)
    await youtubedl(video.url, {
      f: 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      o: outputPath,
      'download-sections': '*00:00:05-00:00:10',
      'force-keyframes-at-cuts': true,
      'no-check-certificates': true,
    });
    console.log("Download complete!");
    console.log("File size:", fs.statSync(outputPath).size);
  } catch (err) {
    console.error("Error downloading:", err);
  }
}

run();
