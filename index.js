const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// Dossiers
const imagesDir = path.join(__dirname, "images");
const audioDir = path.join(__dirname, "pisteAudio");
const outputDir = path.join(__dirname, "output");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Config
const audioFile = path.join(audioDir, "audio.mp3");
const finalOutput = path.join(outputDir, "output.mp4");
const audioDuration = 70; // secondes
const fps = 25;

// Récupérer et trier les images
const images = fs.readdirSync(imagesDir)
  .filter(f => /\.(jpe?g|png)$/i.test(f))
  .sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));

if(images.length === 0){
  console.error("❌ Aucune image trouvée !");
  process.exit(1);
}

const durationPerImage = audioDuration / images.length;

async function createVideoForImage(image, index){
  return new Promise((resolve, reject) => {
    const inputPath = path.join(imagesDir, image);
    const outputPath = path.join(tempDir, `clip_${index}.mp4`);

    ffmpeg(inputPath)
      .loop(durationPerImage)
      .videoCodec("libx264")
      .size("1080x1920")
      .outputOptions([
        `-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0005,1.05)':d=${Math.floor(durationPerImage*fps)}:s=1080x1920:fps=${fps},format=yuv420p`,
        "-pix_fmt yuv420p"
      ])
      .on("end", () => resolve(outputPath))
      .on("error", err => reject(err))
      .save(outputPath);
  });
}

async function generateFinalVideo(){
  try {
    // 1️⃣ Créer toutes les mini-vidéos
    const clipPaths = [];
    for(let i=0; i<images.length; i++){
      console.log(`🎬 Création de la vidéo pour ${images[i]} ...`);
      const clipPath = await createVideoForImage(images[i], i);
      clipPaths.push(clipPath);
    }

    // 2️⃣ Créer un fichier texte pour la concat
    const concatFile = path.join(tempDir, "concat.txt");
    const concatContent = clipPaths.map(p => `file '${p}'`).join("\n");
    fs.writeFileSync(concatFile, concatContent);

    // 3️⃣ Concaténer toutes les mini-vidéos
    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .on("end", () => {
        console.log("✅ Diaporama vidéo créé avec succès !");
        // 4️⃣ Ajouter l'audio
        ffmpeg()
          .input(path.join(outputDir, "temp_concat.mp4"))
          .input(audioFile)
          .outputOptions(["-shortest", "-c:v copy", "-c:a aac"])
          .save(finalOutput)
          .on("end", () => console.log("🎉 Vidéo finale générée :", finalOutput))
          .on("error", err => console.error("❌ Erreur audio :", err));
      })
      .on("error", err => console.error("❌ Erreur concat :", err))
      .save(path.join(outputDir, "temp_concat.mp4"));

  } catch(err) {
    console.error("❌ Erreur :", err);
  }
}

generateFinalVideo();
