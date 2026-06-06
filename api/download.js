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

function generateBasicBodyOBJ(type, mtlName = null) {
  const lines = [];
  
  if (mtlName) {
    lines.push(`mtllib avatar.mtl`);
  }
  
  lines.push(`# BloxyMart - Roblox Avatar OBJ Model`);
  lines.push(`# Type: ${type}`);
  lines.push('');
  
  if (type === 'r15') {
    lines.push('# R15 Body Structure');
    lines.push('o body');
    lines.push('v -0.5 0 0.5');
    lines.push('v 0.5 0 0.5');
    lines.push('v 0.5 1.5 0.5');
    lines.push('v -0.5 1.5 0.5');
    lines.push('v -0.5 0 -0.5');
    lines.push('v 0.5 0 -0.5');
    lines.push('v 0.5 1.5 -0.5');
    lines.push('v -0.5 1.5 -0.5');
    
    // Head
    lines.push('o head');
    lines.push('v -0.35 1.5 0.35');
    lines.push('v 0.35 1.5 0.35');
    lines.push('v 0.35 2.1 0.35');
    lines.push('v -0.35 2.1 0.35');
    lines.push('v -0.35 1.5 -0.35');
    lines.push('v 0.35 1.5 -0.35');
    lines.push('v 0.35 2.1 -0.35');
    lines.push('v -0.35 2.1 -0.35');
    
    // Body faces
    lines.push('usemtl body_material');
    lines.push('f 1 2 3 4');
    lines.push('f 5 8 7 6');
    lines.push('f 1 5 6 2');
    lines.push('f 2 6 7 3');
    lines.push('f 3 7 8 4');
    lines.push('f 5 1 4 8');
    
    // Head faces
    lines.push('usemtl head_material');
    lines.push('f 9 10 11 12');
    lines.push('f 13 16 15 14');
    lines.push('f 9 13 14 10');
    lines.push('f 10 14 15 11');
    lines.push('f 11 15 16 12');
    lines.push('f 13 9 12 16');
  } else {
    // R6 Body Structure
    lines.push('# R6 Body Structure');
    lines.push('o body');
    lines.push('v -0.5 0 0.5');
    lines.push('v 0.5 0 0.5');
    lines.push('v 0.5 1.7 0.5');
    lines.push('v -0.5 1.7 0.5');
    lines.push('v -0.5 0 -0.5');
    lines.push('v 0.5 0 -0.5');
    lines.push('v 0.5 1.7 -0.5');
    lines.push('v -0.5 1.7 -0.5');
    
    // Head
    lines.push('o head');
    lines.push('v -0.4 1.7 0.4');
    lines.push('v 0.4 1.7 0.4');
    lines.push('v 0.4 2.4 0.4');
    lines.push('v -0.4 2.4 0.4');
    lines.push('v -0.4 1.7 -0.4');
    lines.push('v 0.4 1.7 -0.4');
    lines.push('v 0.4 2.4 -0.4');
    lines.push('v -0.4 2.4 -0.4');
    
    // Body faces
    lines.push('usemtl body_material');
    lines.push('f 1 2 3 4');
    lines.push('f 5 8 7 6');
    lines.push('f 1 5 6 2');
    lines.push('f 2 6 7 3');
    lines.push('f 3 7 8 4');
    lines.push('f 5 1 4 8');
    
    // Head faces
    lines.push('usemtl head_material');
    lines.push('f 9 10 11 12');
    lines.push('f 13 16 15 14');
    lines.push('f 9 13 14 10');
    lines.push('f 10 14 15 11');
    lines.push('f 11 15 16 12');
    lines.push('f 13 9 12 16');
  }
  
  return lines.join('\n');
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
    const texturesFolder = zip.folder('Textures');
    const assetsFolder = zip.folder('Assets');

    // Start building OBJ
    const objLines = [];
    const mtlLines = [];
    
    objLines.push(`mtllib avatar.mtl`);
    objLines.push(`# BloxyMart - Roblox Avatar OBJ Model`);
    objLines.push(`# User ID: ${userId}`);
    objLines.push(`# Type: ${type}`);
    objLines.push('');

    // Generate basic body structure
    let vertexOffset = 0;
    
    if (type === 'r15') {
      objLines.push('# R15 Body');
      objLines.push('o body');
      objLines.push('v -0.5 0 0.5');
      objLines.push('v 0.5 0 0.5');
      objLines.push('v 0.5 1.5 0.5');
      objLines.push('v -0.5 1.5 0.5');
      objLines.push('v -0.5 0 -0.5');
      objLines.push('v 0.5 0 -0.5');
      objLines.push('v 0.5 1.5 -0.5');
      objLines.push('v -0.5 1.5 -0.5');
      
      objLines.push('vn 0 0 1');
      objLines.push('vn 0 0 -1');
      objLines.push('vn 0 1 0');
      objLines.push('vn 0 -1 0');
      
      objLines.push('usemtl body_material');
      objLines.push('f 1/1/1 2/2/1 3/3/1 4/4/1');
      objLines.push('f 5/5/2 8/8/2 7/7/2 6/6/2');
      objLines.push('f 1/1/4 5/5/4 6/6/4 2/2/4');
      objLines.push('f 2/2/3 6/6/3 7/7/3 3/3/3');
      objLines.push('f 3/3/1 7/7/1 8/8/1 4/4/1');
      objLines.push('f 5/5/2 1/1/2 4/4/2 8/8/2');
      
      // Head
      objLines.push('o head');
      objLines.push('v -0.35 1.5 0.35');
      objLines.push('v 0.35 1.5 0.35');
      objLines.push('v 0.35 2.1 0.35');
      objLines.push('v -0.35 2.1 0.35');
      objLines.push('v -0.35 1.5 -0.35');
      objLines.push('v 0.35 1.5 -0.35');
      objLines.push('v 0.35 2.1 -0.35');
      objLines.push('v -0.35 2.1 -0.35');
      
      objLines.push('usemtl head_material');
      objLines.push('f 9/1/1 10/2/1 11/3/1 12/4/1');
      objLines.push('f 13/5/2 16/8/2 15/7/2 14/6/2');
      objLines.push('f 9/1/4 13/5/4 14/6/4 10/2/4');
      objLines.push('f 10/2/3 14/6/3 15/7/3 11/3/3');
      objLines.push('f 11/3/1 15/7/1 16/8/1 12/4/1');
      objLines.push('f 13/5/2 9/1/2 12/4/2 16/8/2');
      
      vertexOffset = 16;
    } else {
      // R6 Body
      objLines.push('# R6 Body');
      objLines.push('o body');
      objLines.push('v -0.5 0 0.5');
      objLines.push('v 0.5 0 0.5');
      objLines.push('v 0.5 1.7 0.5');
      objLines.push('v -0.5 1.7 0.5');
      objLines.push('v -0.5 0 -0.5');
      objLines.push('v 0.5 0 -0.5');
      objLines.push('v 0.5 1.7 -0.5');
      objLines.push('v -0.5 1.7 -0.5');
      
      objLines.push('vn 0 0 1');
      objLines.push('vn 0 0 -1');
      objLines.push('vn 0 1 0');
      objLines.push('vn 0 -1 0');
      
      objLines.push('usemtl body_material');
      objLines.push('f 1/1/1 2/2/1 3/3/1 4/4/1');
      objLines.push('f 5/5/2 8/8/2 7/7/2 6/6/2');
      objLines.push('f 1/1/4 5/5/4 6/6/4 2/2/4');
      objLines.push('f 2/2/3 6/6/3 7/7/3 3/3/3');
      objLines.push('f 3/3/1 7/7/1 8/8/1 4/4/1');
      objLines.push('f 5/5/2 1/1/2 4/4/2 8/8/2');
      
      // Head
      objLines.push('o head');
      objLines.push('v -0.4 1.7 0.4');
      objLines.push('v 0.4 1.7 0.4');
      objLines.push('v 0.4 2.4 0.4');
      objLines.push('v -0.4 2.4 0.4');
      objLines.push('v -0.4 1.7 -0.4');
      objLines.push('v 0.4 1.7 -0.4');
      objLines.push('v 0.4 2.4 -0.4');
      objLines.push('v -0.4 2.4 -0.4');
      
      objLines.push('usemtl head_material');
      objLines.push('f 9/1/1 10/2/1 11/3/1 12/4/1');
      objLines.push('f 13/5/2 16/8/2 15/7/2 14/6/2');
      objLines.push('f 9/1/4 13/5/4 14/6/4 10/2/4');
      objLines.push('f 10/2/3 14/6/3 15/7/3 11/3/3');
      objLines.push('f 11/3/1 15/7/1 16/8/1 12/4/1');
      objLines.push('f 13/5/2 9/1/2 12/4/2 16/8/2');
      
      vertexOffset = 16;
    }

    // Create basic MTL with body and head materials
    mtlLines.push(`# BloxyMart Avatar Materials`);
    mtlLines.push('');
    mtlLines.push('newmtl body_material');
    mtlLines.push('Ka 1.000 1.000 1.000');
    mtlLines.push('Kd 1.000 1.000 1.000');
    mtlLines.push('Ks 0.100 0.100 0.100');
    mtlLines.push('Ns 10.0');
    
    mtlLines.push('');
    mtlLines.push('newmtl head_material');
    mtlLines.push('Ka 1.000 1.000 1.000');
    mtlLines.push('Kd 1.000 1.000 1.000');
    mtlLines.push('Ks 0.100 0.100 0.100');
    mtlLines.push('Ns 10.0');

    // Fetch and include avatar thumbnail as texture
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const arr = await thumbRes.arrayBuffer();
        const buffer = Buffer.from(arr);
        texturesFolder.file(`avatar_thumbnail.png`, buffer);
        
        // Add MTL reference for avatar thumbnail
        mtlLines.push('');
        mtlLines.push('newmtl avatar_thumbnail');
        mtlLines.push('Ka 1.000 1.000 1.000');
        mtlLines.push('Kd 1.000 1.000 1.000');
        mtlLines.push('Ks 0.000 0.000 0.000');
        mtlLines.push('map_Kd Textures/avatar_thumbnail.png');
      }
    } catch (e) {
      console.error('Thumbnail error:', e.message);
    }

    // Process wearable assets
    const assets = Array.isArray(avatarData.assets) ? avatarData.assets : [];
    const readmeLines = [];
    readmeLines.push(`BloxyMart Avatar OBJ Export`);
    readmeLines.push(`User ID: ${userId}`);
    readmeLines.push(`Type: ${type}`);
    readmeLines.push('');
    readmeLines.push('Files included:');
    readmeLines.push('- avatar.obj (main 3D model)');
    readmeLines.push('- avatar.mtl (material definitions)');
    readmeLines.push('- Textures/ (all texture files)');
    readmeLines.push('- Assets/ (raw asset files)');
    readmeLines.push('');
    readmeLines.push('Asset Details:');
    readmeLines.push('');

    let textureCount = 0;
    let assetCount = 0;

    for (const asset of assets) {
      try {
        const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote', 'ParticleEmitter', 'Sound'];
        if (skipTypes.includes(asset.assetType)) {
          continue;
        }

        // Attempt to download raw asset binary
        const adUrl = `https://assetdelivery.roblox.com/v2/assetId/${asset.id}`;
        try {
          const aRes = await fetch(adUrl);
          if (aRes.ok) {
            const ct = (aRes.headers.get('content-type') || '').toLowerCase();
            const ext = extFromContentType(ct);
            
            // Check if it's actual binary data, not HTML/JSON error
            if (!ct.includes('text/html') && !ct.includes('application/json')) {
              const arr = await aRes.arrayBuffer();
              const buffer = Buffer.from(arr);
              const filename = `asset_${asset.id}.${ext}`;
              assetsFolder.file(filename, buffer);
              assetCount++;
              
              // If it's an image, add to Textures folder
              if (ct.startsWith('image/')) {
                const texFilename = `asset_${asset.id}.${ext}`;
                texturesFolder.file(texFilename, buffer);
                textureCount++;
                
                // Add material to MTL
                mtlLines.push('');
                mtlLines.push(`newmtl asset_${asset.id}`);
                mtlLines.push('Ka 1.000 1.000 1.000');
                mtlLines.push('Kd 1.000 1.000 1.000');
                mtlLines.push('Ks 0.000 0.000 0.000');
                mtlLines.push(`map_Kd Textures/${texFilename}`);
              }
            }
          }
        } catch (e) {
          console.error(`Asset delivery error ${asset.id}:`, e.message);
        }

        // Try to get asset thumbnail from Roblox API
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
                textureCount++;
                
                // Add thumbnail material to MTL
                mtlLines.push('');
                mtlLines.push(`newmtl asset_${asset.id}_thumb`);
                mtlLines.push('Ka 1.000 1.000 1.000');
                mtlLines.push('Kd 1.000 1.000 1.000');
                mtlLines.push('Ks 0.000 0.000 0.000');
                mtlLines.push(`map_Kd Textures/${filename}`);
                
                readmeLines.push(`${asset.name || 'Unknown'} (ID: ${asset.id})`);
                readmeLines.push(`  Type: ${asset.assetType}`);
                readmeLines.push(`  Thumbnail: Textures/asset_${asset.id}_thumb.png`);
                readmeLines.push('');
              } catch (e) {
                console.error(`Failed to download thumbnail URL for asset ${asset.id}:`, e.message);
              }
            }
          }
        } catch (e) {
          console.error(`Thumbnail API error for asset ${asset.id}:`, e.message);
        }

      } catch (e) {
        console.error(`Error processing asset ${asset.id}:`, e.message);
      }
    }

    readmeLines.push('');
    readmeLines.push(`Summary:`);
    readmeLines.push(`- Textures extracted: ${textureCount}`);
    readmeLines.push(`- Assets extracted: ${assetCount}`);

    // Write files to ZIP
    zip.file('avatar.obj', objLines.join('\n'));
    zip.file('avatar.mtl', mtlLines.join('\n'));
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
