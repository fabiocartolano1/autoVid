const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');

const imagesPath = path.join(__dirname, 'images', 'frame%03d.jpg');
// %03d => frame001.png, frame002.png, etc.
const audioPath = path.join(__dirname, 'audio.mp3');
const outputPath = path.join(__dirname, 'output.mp4');

// Paramètres vidéo
const fps = 25;

ffmpeg()
    .input(imagesPath)
    .inputFPS(fps)
    .input(audioPath)
    .audioCodec('aac')
    .videoCodec('libx264')
    .outputOptions([
        '-shortest',             // coupe la vidéo à la longueur de l'audio
        '-pix_fmt yuv420p'       // compatibilité large des lecteurs vidéo
    ])
    .save(outputPath)
    .on('end', () => {
        console.log('✅ Vidéo générée :', outputPath);
    })
    .on('error', err => {
        console.error('❌ Erreur FFmpeg :', err.message);
    });
