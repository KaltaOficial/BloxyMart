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

async function fetchArrayBufferSafe(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.arrayBuffer();
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

    // Start building OBJ and MTL
    const objLines = [];
    const mtlLines = [];
    objLines.push(`# BloxyMart - Roblox Avatar OBJ Model`);
    objLines.push(`# User ID: ${userId}`);
    objLines.push(`# Type: ${type}`);
    objLines.push('');

    // Add placeholder body vertices (so model opens without being empty)
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

    // Fetch avatar thumbnail and include as texture if available
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const arr = await thumbRes.arrayBuffer();
        const buffer = Buffer.from(arr);
        texturesFolder.file(`avatar_thumbnail.png`, buffer);
        // Add MTL reference for thumbnail as default material
        mtlLines.push(`newmtl avatar_thumb`);
        mtlLines.push(`Ka 1.000 1.000 1.000`);
        mtlLines.push(`Kd 1.000 1.000 1.000`);
        mtlLines.push(`Ks 0.000 0.000 0.000`);
        mtlLines.push(`map_Kd textures/avatar_thumbnail.png`);
        objLines.unshift('mtllib avatar.mtl');
        objLines.push('usemtl avatar_thumb');
      }
    } catch (e) {
      console.error('Thumbnail error:', e.message);
    }

    // Process wearable assets: download raw file + try to download thumbnail via thumbnails.roblox.com
    const assets = Array.isArray(avatarData.assets) ? avatarData.assets : [];
    const readmeLines = [];
    readmeLines.push(`BloxyMart Avatar OBJ`);
    readmeLines.push(`User ID: ${userId}`);
    readmeLines.push(`Type: ${type}`);
    readmeLines.push('');
    readmeLines.push('Included:');
    readmeLines.push('- avatar.obj');
    readmeLines.push('- avatar.mtl (if textures present)');
    readmeLines.push('- textures/ (downloaded thumbnails and images)');
    readmeLines.push('- assets/ (raw asset files when available)');
    readmeLines.push('');
    readmeLines.push('Asset list:');

    for (const asset of assets) {
      try {
        const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote', 'ParticleEmitter', 'Sound'];
        if (skipTypes.includes(asset.assetType)) {
          readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - skipped type: ${asset.assetType}`);
          continue;
        }

        // Attempt to download raw asset binary
        const adUrl = `https://assetdelivery.roblox.com/v2/assetId/${asset.id}`;
        let savedAssetFilename = null;
        try {
          const aRes = await fetch(adUrl);
          if (aRes.ok) {
            const ct = (aRes.headers.get('content-type') || '').toLowerCase();
            const ext = extFromContentType(ct);
            // If content-type looks like html/json it's probably not a raw file
            if (ct.includes('text/html') || ct.includes('application/json')) {
              const txt = await aRes.text().catch(() => '');
              readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - asset delivery returned ${ct}`);
            } else {
              const arr = await aRes.arrayBuffer();
              const buffer = Buffer.from(arr);
              const filename = `asset_${asset.id}.${ext}`;
              assetsFolder.file(filename, buffer);
              savedAssetFilename = `assets/${filename}`;
              readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) -> ${savedAssetFilename}`);
              // if image, also add to textures
              if (ct.startsWith('image/')) {
                texturesFolder.file(`${asset.id}.${ext}`, buffer);
                // add material
                mtlLines.push(`newmtl mat_${asset.id}`);
                mtlLines.push(`Ka 1.000 1.000 1.000`);
                mtlLines.push(`Kd 1.000 1.000 1.000`);
                mtlLines.push(`Ks 0.000 0.000 0.000`);
                mtlLines.push(`map_Kd textures/${asset.id}.${ext}`);
                objLines.push(`o asset_${asset.id}`);
                objLines.push(`# asset ${asset.id} material mat_${asset.id}`);
                objLines.push('usemtl mat_' + asset.id);
                // no geometry because we can't parse binary meshes here
              }
            }
          } else {
            const txt = await aRes.text().catch(() => '');
            readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - asset delivery failed: ${aRes.status}`);
            console.error(`Asset download failed ${asset.id}:`, aRes.status, txt.slice(0,200));
          }
        } catch (e) {
          console.error(`Asset delivery error ${asset.id}:`, e.message);
          readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - delivery error: ${e.message}`);
        }

        // Always try thumbnails API to get a preview texture for the asset
        try {
          const thumbApi = `https://thumbnails.roblox.com/v1/assets?assetIds=${asset.id}&size=420x420&format=Png&isCircular=false`;
          const tRes = await fetch(thumbApi);
          if (tRes.ok) {
            const tData = await tRes.json();
            const url = tData?.data?.[0]?.imageUrl;
            if (url) {
              try {
                const arr = await fetchArrayBufferSafe(url);
                const buffer = Buffer.from(arr);
                const filename = `asset_${asset.id}_thumb.png`;
                texturesFolder.file(filename, buffer);
                readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) thumbnail -> textures/${filename}`);
                // add material referencing this thumbnail
                mtlLines.push(`newmtl thumb_${asset.id}`);
                mtlLines.push(`Ka 1.000 1.000 1.000`);
                mtlLines.push(`Kd 1.000 1.000 1.000`);
                mtlLines.push(`Ks 0.000 0.000 0.000`);
                mtlLines.push(`map_Kd textures/${filename}`);
                objLines.push(`o asset_${asset.id}_thumb`);
                objLines.push(`# asset ${asset.id} thumbnail material thumb_${asset.id}`);
                objLines.push('usemtl thumb_' + asset.id);
              } catch (e) {
                console.error(`Failed to download thumbnail URL for asset ${asset.id}:`, e.message);
              }
            } else {
              readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - no thumbnail URL`);
            }
          } else {
            const txt = await tRes.text().catch(() => '');
            readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - thumbnail API failed: ${tRes.status}`);
          }
        } catch (e) {
          console.error(`Thumbnail API error for asset ${asset.id}:`, e.message);
          readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - thumbnail error: ${e.message}`);
        }

      } catch (e) {
        console.error(`Error processing asset ${asset.id}:`, e.message);
        readmeLines.push(`${asset.name || 'unknown'} (id:${asset.id}) - error: ${e.message}`);
      }
    }

    // If we have MTL lines, write avatar.mtl and reference it
    if (mtlLines.length > 0) {
      zip.file('avatar.mtl', mtlLines.join('\n'));
      // ensure mtllib is first line
      if (!objLines[0].startsWith('mtllib')) objLines.unshift('mtllib avatar.mtl');
    }

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
