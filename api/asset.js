export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { assetId } = req.query;

  if (!assetId) {
    return res.status(400).json({ error: 'Asset ID required' });
  }

  try {
    // Try to download asset from Roblox
    const response = await fetch(`https://assetdelivery.roblox.com/v2/assetId/${assetId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="asset_${assetId}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Asset download failed' });
  }
}
