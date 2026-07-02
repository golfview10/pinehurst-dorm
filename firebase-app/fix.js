const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

const headContent = `<!DOCTYPE html>
<html lang="th">

<head>
    <!-- Firebase Migration: removed <base target="_top"> (not needed outside Apps Script) -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

    <!-- iOS / iPadOS Home Screen Icon Settings -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="ผังห้องว่าง">
    <link rel="apple-touch-icon" sizes="180x180"
        href="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Building_icon.svg/512px-Building_icon.svg.png">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669'><path d='M3 21V7l9-4 9 4v14H3zm2-2h5v-4h4v4h5V8.1l-7-3.12L5 8.1V19z'/></svg>">
    <link rel="icon" type="image/png" sizes="192x192"
        href="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Building_icon.svg/512px-Building_icon.svg.png">
    <link rel="icon" type="image/png" sizes="512x512"
        href="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Building_icon.svg/512px-Building_icon.svg.png">

    <title>ผังห้องว่าง</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">
    <script src="https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    `;

// If it starts with the script tag, prepend the head content
if (content.trim().startsWith('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable')) {
    fs.writeFileSync(filePath, headContent + content, 'utf8');
    console.log('Fixed index.html successfully.');
} else {
    console.log('File does not seem to match the expected corrupted state.');
}
