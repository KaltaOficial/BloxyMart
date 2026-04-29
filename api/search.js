export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // Search for user
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });

    if (!userRes.ok) throw new Error('User not found');
    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      throw new Error('User not found');
    }

    const user = userData.data[0];
    const userId = user.id;

    // Get profile
    const profileRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const profile = await profileRes.json();

    // Get avatar
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );
    const avatarData = await avatarRes.json();
    const thumb = avatarData.data?.[0]?.imageUrl || '';

    // Get avatar assets (clothing, accessories, etc)
    let assets = [];
    try {
      const assetsRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`);
      const avatarDetails = await assetsRes.json();
      
      if (avatarDetails.assets) {
        assets = avatarDetails.assets.map(asset => ({
          id: asset.id,
          assetType: asset.assetType,
          name: asset.name
        }));
      }
    } catch (e) {
      // Continue if assets fail
    }

    res.status(200).json({
      user,
      profile,
      avatarUrl: thumb,
      assets,
      downloadLinks: {
        r15: `https://www.roblox.com/api/avatar-fetch-model?userId=${userId}&placeId=1`,
        r6: `https://www.roblox.com/api/avatar-fetch-model?userId=${userId}&placeId=1&r6=true`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Search failed' });
  }
}
