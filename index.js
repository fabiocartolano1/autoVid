const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// Config
const imagesDir = path.join(__dirname, "images");
const audioFile = "audio.mp3";
const outputFile = "output.mp4";
const audioDuration = 70; // durée en secondes (1 min 10)

// 1. Récupérer les images
let images = fs.readdirSync(imagesDir)
    .filter(file => /\.(jpe?g|png)$/i.test(file))
    .sort(); // tri alphabétique

if (images.length === 0) {
    console.error("❌ Aucune image trouvée dans le dossier 'images'");
    process.exit(1);
}

const durationPerImage = audioDuration / images.length;

// 2. Générer le fichier images.txt pour concat
let txtContent = "";
images.forEach((img, idx) => {
    const imgPath = path.join("images", img).replace(/\\/g, "/");
    txtContent += `file '${imgPath}'\n`;
    if (idx < images.length - 1) {
        txtContent += `duration ${durationPerImage}\n`;
    }
});
txtContent += `file 'images/${images[images.length - 1]}'\n`;

fs.writeFileSync("images.txt", txtContent);
console.log("✅ Fichier images.txt généré");

// 3. Créer la commande ffmpeg avec fluent-ffmpeg
ffmpeg()
    .input("images.txt")
    .inputOptions(["-f concat", "-safe 0"])
    .input(audioFile)
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
        "-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        "-pix_fmt yuv420p",
        "-shortest"
    ])
    .output(outputFile)
    .on("start", cmd => console.log("▶️ ffmpeg lancé :", cmd))
    .on("progress", p => console.log(`⏳ Progression : ${p.percent?.toFixed(2) || 0}%`))
    .on("end", () => console.log("🎬 Vidéo générée avec succès :", outputFile))
    .on("error", err => console.error("❌ Erreur :", err))
    .run();
