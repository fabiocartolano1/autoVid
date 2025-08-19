const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

const image1 = path.join(__dirname, 'images', 'frame001.jpg');
const image2 = path.join(__dirname, 'images', 'frame002.jpg');
const audioPath = path.join(__dirname, 'audio.mp3');

// Créer 2 vidéos temporaires de 40s chacune
const temp1 = 'temp1.mp4';
const temp2 = 'temp2.mp4';

function createSegment(image, output, duration, cb) {
    ffmpeg()
        .input(image)
        .inputOptions(['-loop 1']) // répéter indéfiniment l'image
        .duration(duration)        // durée du segment
        .videoCodec('libx264')
        .outputOptions(['-pix_fmt yuv420p', '-s 1280x720'])
        .save(output)
        .on('end', cb)
        .on('error', err => console.error('Erreur segment :', err.message));
}


createSegment(image1, temp1, 40, () => {
    console.log('Segment 1 créé');
    createSegment(image2, temp2, 40, () => {
        console.log('Segment 2 créé');

        // Concaténer les 2 segments et ajouter l'audio
        const concatList = 'concat_list.txt';
        fs.writeFileSync(concatList, `file '${temp1}'\nfile '${temp2}'\n`);

        ffmpeg()
            .input(concatList)
            .inputOptions(['-f concat', '-safe 0'])
            .input(audioPath)
            .audioCodec('aac')
            .videoCodec('copy') // pas de ré-encodage vidéo
            .outputOptions(['-shortest'])
            .save('output.mp4')
            .on('end', () => {
                console.log('✅ Vidéo finale créée : output.mp4');
                // Nettoyage des fichiers temporaires
                fs.unlinkSync(temp1);
                fs.unlinkSync(temp2);
                fs.unlinkSync(concatList);
            })
            .on('error', err => console.error('Erreur concat :', err.message));
    });
});
