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
  return 'bin';
}

async function fetchArrayBufferSafe(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.arrayBuffer();
}

// Generate a more realistic avatar model based on Roblox avatar structure
function generateAvatarOBJ(type) {
  const lines = [];
  
  lines.push(`# BloxyMart - Roblox Avatar OBJ Model`);
  lines.push(`# Type: ${type}`);
  lines.push(`mtllib avatar.mtl`);
  lines.push('');

  if (type === 'r15') {
    // R15 has more detailed structure with limbs
    lines.push('# R15 Humanoid Body');
    
    // Torso (main body)
    lines.push('o torso');
    lines.push('v -0.5 0.5 -0.5');
    lines.push('v 0.5 0.5 -0.5');
    lines.push('v 0.5 0.5 0.5');
    lines.push('v -0.5 0.5 0.5');
    lines.push('v -0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 0.5');
    lines.push('v -0.5 1.5 0.5');
    
    lines.push('usemtl torso_material');
    lines.push('f 1 2 3 4');
    lines.push('f 5 8 7 6');
    lines.push('f 1 5 6 2');
    lines.push('f 2 6 7 3');
    lines.push('f 3 7 8 4');
    lines.push('f 5 1 4 8');
    
    // Head
    lines.push('o head');
    lines.push('v -0.4 1.5 -0.4');
    lines.push('v 0.4 1.5 -0.4');
    lines.push('v 0.4 1.5 0.4');
    lines.push('v -0.4 1.5 0.4');
    lines.push('v -0.4 2.3 -0.4');
    lines.push('v 0.4 2.3 -0.4');
    lines.push('v 0.4 2.3 0.4');
    lines.push('v -0.4 2.3 0.4');
    
    lines.push('usemtl head_material');
    lines.push('f 9 10 11 12');
    lines.push('f 13 16 15 14');
    lines.push('f 9 13 14 10');
    lines.push('f 10 14 15 11');
    lines.push('f 11 15 16 12');
    lines.push('f 13 9 12 16');
    
    // Left Arm
    lines.push('o left_arm');
    lines.push('v -0.9 0.8 -0.25');
    lines.push('v -0.6 0.8 -0.25');
    lines.push('v -0.6 0.8 0.25');
    lines.push('v -0.9 0.8 0.25');
    lines.push('v -0.9 -0.5 -0.25');
    lines.push('v -0.6 -0.5 -0.25');
    lines.push('v -0.6 -0.5 0.25');
    lines.push('v -0.9 -0.5 0.25');
    
    lines.push('usemtl arm_material');
    lines.push('f 17 18 19 20');
    lines.push('f 21 24 23 22');
    lines.push('f 17 21 22 18');
    lines.push('f 18 22 23 19');
    lines.push('f 19 23 24 20');
    lines.push('f 21 17 20 24');
    
    // Right Arm
    lines.push('o right_arm');
    lines.push('v 0.6 0.8 -0.25');
    lines.push('v 0.9 0.8 -0.25');
    lines.push('v 0.9 0.8 0.25');
    lines.push('v 0.6 0.8 0.25');
    lines.push('v 0.6 -0.5 -0.25');
    lines.push('v 0.9 -0.5 -0.25');
    lines.push('v 0.9 -0.5 0.25');
    lines.push('v 0.6 -0.5 0.25');
    
    lines.push('usemtl arm_material');
    lines.push('f 25 26 27 28');
    lines.push('f 29 32 31 30');
    lines.push('f 25 29 30 26');
    lines.push('f 26 30 31 27');
    lines.push('f 27 31 32 28');
    lines.push('f 29 25 28 32');
    
    // Left Leg
    lines.push('o left_leg');
    lines.push('v -0.3 0.5 -0.25');
    lines.push('v 0 0.5 -0.25');
    lines.push('v 0 0.5 0.25');
    lines.push('v -0.3 0.5 0.25');
    lines.push('v -0.3 -1 -0.25');
    lines.push('v 0 -1 -0.25');
    lines.push('v 0 -1 0.25');
    lines.push('v -0.3 -1 0.25');
    
    lines.push('usemtl leg_material');
    lines.push('f 33 34 35 36');
    lines.push('f 37 40 39 38');
    lines.push('f 33 37 38 34');
    lines.push('f 34 38 39 35');
    lines.push('f 35 39 40 36');
    lines.push('f 37 33 36 40');
    
    // Right Leg
    lines.push('o right_leg');
    lines.push('v 0 0.5 -0.25');
    lines.push('v 0.3 0.5 -0.25');
    lines.push('v 0.3 0.5 0.25');
    lines.push('v 0 0.5 0.25');
    lines.push('v 0 -1 -0.25');
    lines.push('v 0.3 -1 -0.25');
    lines.push('v 0.3 -1 0.25');
    lines.push('v 0 -1 0.25');
    
    lines.push('usemtl leg_material');
    lines.push('f 41 42 43 44');
    lines.push('f 45 48 47 46');
    lines.push('f 41 45 46 42');
    lines.push('f 42 46 47 43');
    lines.push('f 43 47 48 44');
    lines.push('f 45 41 44 48');
    
  } else {
    // R6 Classic body
    lines.push('# R6 Classic Body');
    
    // Torso
    lines.push('o torso');
    lines.push('v -0.5 0 -0.5');
    lines.push('v 0.5 0 -0.5');
    lines.push('v 0.5 0 0.5');
    lines.push('v -0.5 0 0.5');
    lines.push('v -0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 0.5');
    lines.push('v -0.5 1.5 0.5');
    
    lines.push('usemtl torso_material');
    lines.push('f 1 2 3 4');
    lines.push('f 5 8 7 6');
    lines.push('f 1 5 6 2');
    lines.push('f 2 6 7 3');
    lines.push('f 3 7 8 4');
    lines.push('f 5 1 4 8');
    
    // Head
    lines.push('o head');
    lines.push('v -0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 -0.5');
    lines.push('v 0.5 1.5 0.5');
    lines.push('v -0.5 1.5 0.5');
    lines.push('v -0.5 2.5 -0.5');
    lines.push('v 0.5 2.5 -0.5');
    lines.push('v 0.5 2.5 0.5');
    lines.push('v -0.5 2.5 0.5');
    
    lines.push('usemtl head_material');
    lines.push('f 9 10 11 12');
    lines.push('f 13 16 15 14');
    lines.push('f 9 13 14 10');
    lines.push('f 10 14 15 11');
    lines.push('f 11 15 16 12');
    lines.push('f 13 9 12 16');
    
    // Arms and Legs (simplified for R6)
    lines.push('o arms_and_legs');
    // Left Arm
    lines.push('v -1 0.5 0');
    lines.push('v -0.5 0.5 0');
    lines.push('v -0.5 0.5 0.2');
    lines.push('v -1 0.5 0.2');
    lines.push('v -1 -0.5 0');
    lines.push('v -0.5 -0.5 0');
    lines.push('v -0.5 -0.5 0.2');
    lines.push('v -1 -0.5 0.2');
    
    // Right Arm
    lines.push('v 0.5 0.5 0');
    lines.push('v 1 0.5 0');
    lines.push('v 1 0.5 0.2');
    lines.push('v 0.5 0.5 0.2');
    lines.push('v 0.5 -0.5 0');
    lines.push('v 1 -0.5 0');
    lines.push('v 1 -0.5 0.2');
    lines.push('v 0.5 -0.5 0.2');
    
    // Left Leg
    lines.push('v -0.2 0 0');
    lines.push('v 0.2 0 0');
    lines.push('v 0.2 0 0.2');
    lines.push('v -0.2 0 0.2');
    lines.push('v -0.2 -1.5 0');
    lines.push('v 0.2 -1.5 0');
    lines.push('v 0.2 -1.5 0.2');
    lines.push('v -0.2 -1.5 0.2');
    
    lines.push('usemtl arm_leg_material');
    lines.push('f 17 18 19 20');
    lines.push('f 21 24 23 22');
    lines.push('f 17 21 22 18');
    lines.push('f 18 22 23 19');
    lines.push('f 19 23 24 20');
    lines.push('f 21 17 20 24');
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
    const zip = new JSZip();
    const texturesFolder = zip.folder('Textures');
    const assetsFolder = zip.folder('Assets');

    const objLines = [];
    const mtlLines = [];
    
    // Generate improved body model
    const bodyObj = generateAvatarOBJ(type);
    objLines.push(bodyObj);

    // Create MTL file with materials
    mtlLines.push(`# BloxyMart Avatar Materials`);
    mtlLines.push('');
    mtlLines.push('newmtl torso_material');
    mtlLines.push('Ka 0.8 0.8 0.8');
    mtlLines.push('Kd 0.9 0.9 0.9');
    mtlLines.push('Ks 0.1 0.1 0.1');
    mtlLines.push('Ns 10');
    
    mtlLines.push('');
    mtlLines.push('newmtl head_material');
    mtlLines.push('Ka 1.0 1.0 1.0');
    mtlLines.push('Kd 1.0 0.9 0.8');
    mtlLines.push('Ks 0.1 0.1 0.1');
    mtlLines.push('Ns 10');
    
    mtlLines.push('');
    mtlLines.push('newmtl arm_material');
    mtlLines.push('Ka 0.85 0.85 0.85');
    mtlLines.push('Kd 0.9 0.9 0.9');
    mtlLines.push('Ks 0.1 0.1 0.1');
    mtlLines.push('Ns 10');
    
    mtlLines.push('');
    mtlLines.push('newmtl leg_material');
    mtlLines.push('Ka 0.8 0.8 0.8');
    mtlLines.push('Kd 0.85 0.85 0.85');
    mtlLines.push('Ks 0.1 0.1 0.1');
    mtlLines.push('Ns 10');
    
    mtlLines.push('');
    mtlLines.push('newmtl arm_leg_material');
    mtlLines.push('Ka 0.8 0.8 0.8');
    mtlLines.push('Kd 0.9 0.9 0.9');
    mtlLines.push('Ks 0.1 0.1 0.1');
    mtlLines.push('Ns 10');

    // Try to fetch avatar data for textures
    let textureCount = 0;
    try {
      const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
      if (avatarRes.ok) {
        const avatarData = await avatarRes.json();
        
        // Get avatar thumbnail
        try {
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
          );
          if (thumbRes.ok) {
            const arr = await thumbRes.arrayBuffer();
            const buffer = Buffer.from(arr);
            texturesFolder.file(`avatar_thumbnail.png`, buffer);
            
            mtlLines.push('');
            mtlLines.push('newmtl avatar_thumbnail');
            mtlLines.push('Ka 1.0 1.0 1.0');
            mtlLines.push('Kd 1.0 1.0 1.0');
            mtlLines.push('Ks 0.0 0.0 0.0');
            mtlLines.push('map_Kd Textures/avatar_thumbnail.png');
            textureCount++;
          }
        } catch (e) {
          console.error('Avatar thumbnail error:', e.message);
        }

        // Process assets for textures
        const assets = Array.isArray(avatarData.assets) ? avatarData.assets : [];
        for (const asset of assets) {
          try {
            const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote', 'ParticleEmitter', 'Sound'];
            if (skipTypes.includes(asset.assetType)) continue;

            // Try asset delivery
            try {
              const aRes = await fetch(`https://assetdelivery.roblox.com/v2/assetId/${asset.id}`);
              if (aRes.ok) {
                const ct = (aRes.headers.get('content-type') || '').toLowerCase();
                if (!ct.includes('text/html') && !ct.includes('application/json')) {
                  const arr = await aRes.arrayBuffer();
                  const buffer = Buffer.from(arr);
                  if (ct.startsWith('image/')) {
                    const ext = ct.includes('png') ? 'png' : ct.includes('jpeg') ? 'jpg' : 'webp';
                    texturesFolder.file(`asset_${asset.id}.${ext}`, buffer);
                    textureCount++;
                  }
                }
              }
            } catch (e) {
              console.error(`Asset delivery error ${asset.id}:`, e.message);
            }

            // Try thumbnail API
            try {
              const thumbApi = `https://thumbnails.roblox.com/v1/assets?assetIds=${asset.id}&size=420x420&format=Png&isCircular=false`;
              const tRes = await fetch(thumbApi);
              if (tRes.ok) {
                const tData = await tRes.json();
                const url = tData?.data?.[0]?.imageUrl;
                if (url) {
                  const arr = await fetchArrayBufferSafe(url);
                  const buffer = Buffer.from(arr);
                  texturesFolder.file(`asset_${asset.id}_thumb.png`, buffer);
                  textureCount++;
                }
              }
            } catch (e) {
              console.error(`Thumbnail API error ${asset.id}:`, e.message);
            }
          } catch (e) {
            console.error(`Error processing asset ${asset.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('Avatar data error:', e.message);
    }

    // Write files
    zip.file('avatar.obj', objLines.join('\n'));
    zip.file('avatar.mtl', mtlLines.join('\n'));
    
    const readme = [
      `BloxyMart Avatar Export`,
      `User ID: ${userId}`,
      `Type: ${type}`,
      ``,
      `Files:`,
      `- avatar.obj (3D model)`,
      `- avatar.mtl (materials)`,
      `- Textures/ (${textureCount} textures extracted)`,
      ``
    ].join('\n');
    
    zip.file('README.txt', readme);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=avatar_${userId}_${type}.zip`);
    res.status(200).send(zipBuffer);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: String(error.message || 'Download failed') });
  }
}
