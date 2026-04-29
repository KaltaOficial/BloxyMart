import fetch from 'node-fetch';
import JSZip from 'jszip';

const ASSET_API = 'https://assetdelivery.roblox.com/v2/assetId/';

async function downloadAsset(assetId) {
  try {
    const response = await fetch(`${ASSET_API}${assetId}`);
    if (!response.ok) return null;
    return await response.buffer();
  } catch (error) {
    return null;
  }
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
    // Get avatar details
    const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
    if (!avatarRes.ok) throw new Error('Failed to fetch avatar');
    
    const avatarData = await avatarRes.json();
    const zip = new JSZip();
    
    let objContent = '# BloxyMart - Roblox Avatar OBJ Model\n';
    objContent += `# User ID: ${userId}\n`;
    objContent += `# Type: ${type}\n\n`;
    
    let vertexOffset = 1;
    const textures = new Set();
    
    // Process each asset (clothes, accessories, etc)
    if (avatarData.assets) {
      for (const asset of avatarData.assets) {
        // Skip scripts, animations, etc
        const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote'];
        if (skipTypes.includes(asset.assetType)) continue;
        
        try {
          // Get asset mesh data
          const meshRes = await fetch(`https://www.roblox.com/api/asset?id=${asset.id}`);
          if (!meshRes.ok) continue;
          
          const meshData = await meshRes.text();
          
          // Parse mesh (basic OBJ format)
          if (meshData.includes('v ')) {
            objContent += `# Asset: ${asset.name}\n`;
            objContent += meshData + '\n';
          }
        } catch (e) {
          console.error(`Error processing asset ${asset.id}:`, e.message);
        }
      }
    }
    
    // Add basic character body mesh
    objContent += `# Character Body\n`;
    objContent += `o ${type}_Body\n`;
    objContent += createCharacterMesh(type, vertexOffset);
    
    // Add OBJ to zip
    zip.file('avatar.obj', objContent);
    
    // Try to get and add avatar thumbnail as texture
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbBuffer = await thumbRes.buffer();
        zip.file('textures/avatar_thumbnail.png', thumbBuffer);
      }
    } catch (e) {
      console.error('Error downloading thumbnail:', e.message);
    }
    
    // Add README
    zip.file('README.txt', `BloxyMart Avatar Model\nUser ID: ${userId}\nType: ${type}\n\nContains:\n- avatar.obj (3D model)\n- textures/ (image files)\n\nOpen avatar.obj in Blender, 3DS Max, or any 3D software.`);
    
    // Generate zip and send
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="avatar_${userId}_${type}.zip"`);
    res.send(zipBuffer);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message || 'Download failed' });
  }
}

function createCharacterMesh(type, vertexOffset) {
  if (type === 'r15') {
    // R15 body parts
    return `
v -0.5 0 0.5
v 0.5 0 0.5
v 0.5 1.5 0.5
v -0.5 1.5 0.5
v -0.5 0 -0.5
v 0.5 0 -0.5
v 0.5 1.5 -0.5
v -0.5 1.5 -0.5

f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;
  } else {
    // R6 body parts
    return `
v -0.5 0 0.5
v 0.5 0 0.5
v 0.5 1.7 0.5
v -0.5 1.7 0.5
v -0.5 0 -0.5
v 0.5 0 -0.5
v 0.5 1.7 -0.5
v -0.5 1.7 -0.5

f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;
  }
}
