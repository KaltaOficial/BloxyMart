import JSZip from 'jszip';

function extFromContentType(ct) {
  if (!ct) return 'bin';
  ct = ct.split(';')[0].trim().toLowerCase();
  if (ct === 'image/png') return 'png';
  if (ct === 'image/jpeg' || ct === 'image/jpg') return 'jpg';
  if (ct === 'image/webp') return 'webp';
  if (ct === 'application/zip') return 'zip';
  if (ct === 'application/octet-stream') return 'bin';
  if (ct === 'text/plain') return 'txt';
  if (ct === 'model/gltf+json' || ct === 'application/gltf+json') return 'gltf';
  if (ct === 'model/fbx' || ct === 'application/octet-stream') return 'fbx';
  // fallback
  return 'bin';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, type } = req.body;
  if (!userId || !type) {
    return res.status(400).json({ error: 'User ID and type required' });
  }

  try {
    // Get avatar data
    const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
    if (!avatarRes.ok) throw new Error(`Failed to fetch avatar details (${avatarRes.status})`);
    const avatarData = await avatarRes.json();

    const zip = new JSZip();
    const texturesFolder = zip.folder('textures');
    const assetsFolder = zip.folder('assets');

    // Start building OBJ
    const objLines = [];
    objLines.push(`# BloxyMart - Roblox Avatar OBJ Model`);
    objLines.push(`# User ID: ${userId}`);
    objLines.push(`# Type: ${type}`);
    objLines.push('');

    // Add placeholder body vertices (keeps model usable)
    if (type === 'r15') {
      objLines.push('o body_r15');
      objLines.push('v -0.5 0 0.5');
      objLines.push('v 0.5 0 0.5');
      objLines.push('v 0.5 1.5 0.5');
      objLines.push('v -0.5 1.5 0.5');
      objLines.push('v -0.5 0 -0.5');
      objLines.push('v 0.5 0 -0.5');
      objLines.push('v 0.5 1.5 -0.5');
      objLines.push('v -0.5 1.5 -0.5');
      objLines.push('f 1 2 3 4');
      objLines.push('f 5 8 7 6');
      objLines.push('f 1 5 6 2');
      objLines.push('f 2 6 7 3');
      objLines.push('f 3 7 8 4');
      objLines.push('f 5 1 4 8');
    } else {
      objLines.push('o body_r6');
      objLines.push('v -0.5 0 0.5');
      objLines.push('v 0.5 0 0.5');
      objLines.push('v 0.5 1.7 0.5');
      objLines.push('v -0.5 1.7 0.5');
      objLines.push('v -0.5 0 -0.5');
      objLines.push('v 0.5 0 -0.5');
      objLines.push('v 0.5 1.7 -0.5');
      objLines.push('v -0.5 1.7 -0.5');
      objLines.push('f 1 2 3 4');
      objLines.push('f 5 8 7 6');
      objLines.push('f 1 5 6 2');
      objLines.push('f 2 6 7 3');
      objLines.push('f 3 7 8 4');
      objLines.push('f 5 1 4 8');
    }

    // Fetch thumbnail and add as texture
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const arr = await thumbRes.arrayBuffer();
        const buffer = Buffer.from(arr);
        texturesFolder.file(`avatar_thumbnail.png`, buffer);
        objLines.unshift('mtllib avatar.mtl');
        objLines.push('usemtl mat0');
      }
    } catch (e) {
      console.error('Thumbnail error:', e.message);
    }

    // Process wearable assets - best-effort: attempt to download their assetbinary and textures
    const assets = Array.isArray(avatarData.assets) ? avatarData.assets : [];
    const readmeLines = [];
    readmeLines.push(`BloxyMart Avatar OBJ`);
    readmeLines.push(`User ID: ${userId}`);
    readmeLines.push(`Type: ${type}`);
    readmeLines.push('');
    readmeLines.push('Included:');
    readmeLines.push('- avatar.obj');
    readmeLines.push('- textures/ (thumbnail + any downloaded images)');
    readmeLines.push('- assets/ (raw asset files when available)');
    readmeLines.push('');
    readmeLines.push('Asset list:');

    for (const asset of assets) {
      try {
        // Skip non-relevant asset types
        const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote', 'ParticleEmitter', 'Sound'];
        if (skipTypes.includes(asset.assetType)) {
          readmeLines.push(`# Skipped asset ${asset.id} (${asset.assetType})`);
          continue;
        }

        // Try to download via assetdelivery endpoint
        const adUrl = `https://assetdelivery.roblox.com/v2/assetId/${asset.id}`;
        const aRes = await fetch(adUrl);
        if (!aRes.ok) {
          // sometimes assetdelivery responds with 403 or HTML; log and continue
          const txt = await aRes.text().catch(() => '');
          console.error(`Asset ${asset.id} download failed: ${aRes.status}`, txt.slice(0,200));
          readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - download failed: ${aRes.status}`);
          continue;
        }

        // Determine content-type and extension
        const ct = (aRes.headers.get('content-type') || '').toLowerCase();
        const ext = extFromContentType(ct);

        // If it's JSON or HTML, skip saving as binary
        if (ct.includes('application/json') || ct.includes('text/html')) {
          const txt = await aRes.text().catch(() => '');
          readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - unexpected content-type: ${ct}`);
          continue;
        }

        // Get final fetched data as arrayBuffer
        const arr = await aRes.arrayBuffer();
        const buffer = Buffer.from(arr);

        // Save asset binary
        const filename = `asset_${asset.id}.${ext}`;
        assetsFolder.file(filename, buffer);
        readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) -> assets/${filename}`);

        // If it's an image, also add to textures folder
        if (ct.startsWith('image/')) {
          texturesFolder.file(`${asset.id}.${ext}`, buffer);
        }

      } catch (e) {
        console.error(`Error processing asset ${asset.id}:`, e.message);
        readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - error: ${e.message}`);
      }
    }

    // Write avatar.obj and README
    zip.file('avatar.obj', objLines.join('\n'));
    zip.file('README.txt', readmeLines.join('\n'));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=avatar_${userId}_${type}.zip`);
    res.status(200).send(zipBuffer);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: String(error.message || 'Download failed') });
  }
}
