export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, type } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'User ID and type required' });
  }

  try {
    // Determine API endpoint based on type (r15/r6)
    const modelUrl = type === 'r15' 
      ? `https://www.roblox.com/api/avatar-fetch-model?userId=${userId}`
      : `https://www.roblox.com/api/avatar-fetch-model?userId=${userId}&r6=true`;

    const response = await fetch(modelUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    // Set response headers to trigger download
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="avatar_${userId}_${type}.rbxm"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Download failed' });
  }
}
