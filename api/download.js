import JSZip from 'jszip';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, type } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'User ID and type required' });
  }

  try {
    // Fetch avatar details
    const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
    if (!avatarRes.ok) throw new Error('Failed to fetch avatar details from Roblox');
    const avatarData = await avatarRes.json();

    const zip = new JSZip();
    let objLines = [];

    objLines.push('# BloxyMart - Roblox Avatar OBJ Model');
    objLines.push(`# User ID: ${userId}`);
    objLines.push(`# Type: ${type}`);
    objLines.push('');

    // Simple placeholder body mesh (users can edit/replace in Blender)
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

    // Add basic thumbnail texture
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const arr = await thumbRes.arrayBuffer();
        const buffer = Buffer.from(arr);
        zip.file('textures/avatar_thumbnail.png', buffer);
        // reference the texture in the OBJ Material (simple MTL file)
        const mtl = `newmtl mat0\nKa 1.000 1.000 1.000\nKd 1.000 1.000 1.000\nKs 0.000 0.000 0.000\nmap_Kd textures/avatar_thumbnail.png\n`;
        zip.file('avatar.mtl', mtl);
        objLines.unshift(`mtllib avatar.mtl`);
        objLines.push('usemtl mat0');
      }
    } catch (e) {
      // ignore thumbnail errors
      console.error('Thumbnail fetch failed', e.message);
    }

    // Attempt to include simple meshes for wearable assets
    if (avatarData.assets && Array.isArray(avatarData.assets)) {
      for (const asset of avatarData.assets) {
        // Skip non-mesh types
        const skipTypes = ['Animation', 'LocalScript', 'Script', 'ModuleScript', 'Emote', 'ParticleEmitter', 'Sound'];
        if (skipTypes.includes(asset.assetType)) continue;

        // Try to fetch an OBJ-like representation from Roblox (best-effort)
        try {
          // There's no official OBJ CDN; try asset delivery for mesh files (binary). We won't try to parse mesh formats here.
          // Instead, include an entry in the README listing the asset IDs so users can fetch them manually if needed.
          // This prevents server-side parsing errors and keeps the service stable.
          objLines.push(`# Asset: ${asset.name} (id: ${asset.id}, type: ${asset.assetType})`);
        } catch (e) {
          console.error(`Failed to process asset ${asset.id}:`, e.message);
        }
      }
    }

    zip.file('avatar.obj', objLines.join('\n'));
    zip.file('README.txt', `BloxyMart Avatar OBJ\nUser ID: ${userId}\nType: ${type}\n\nIncluded:\n- avatar.obj\n- avatar.mtl (if thumbnail available)\n- textures/avatar_thumbnail.png (if available)\n\nNotes:\n- This service creates a basic OBJ with a placeholder body and references to textures.\n- Full mesh extraction from Roblox proprietary formats requires more complex processing and different tooling.\n- Asset list is included as comments in avatar.obj.`);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=avatar_${userId}_${type}.zip`);
    res.status(200).send(zipBuffer);
  } catch (error) {
    console.error('Download error:', error);
    // Always return JSON for errors so frontend can parse it safely
    res.status(500).json({ error: String(error.message || 'Download failed') });
  }
}
