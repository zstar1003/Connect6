# Deploy to itch.io Guide

This guide will walk you through deploying Connect-6 Master 3D to itch.io as a browser game.

## Prerequisites

- An itch.io account (free to create at https://itch.io)
- Node.js and npm installed
- Your game source code

## Important: Configuration for itch.io

Before building, ensure your `vite.config.ts` has the correct settings for itch.io deployment:

```typescript
export default defineConfig(({ mode }) => {
    return {
      base: './', // CRITICAL: Use relative paths for itch.io
      // ... rest of config
    };
});
```

This ensures all asset paths are relative, which is required for itch.io's iframe embedding.

## Step 1: Build the Game

1. Open your terminal and navigate to the project directory:

```bash
cd /path/to/SixRowGame
```

2. Run the build command:

```bash
npm run build
```

3. This will create a `dist` folder containing all the production files.

## Step 2: Prepare for itch.io

itch.io requires games to be uploaded as a ZIP file. The built files need some adjustments for proper deployment.

1. Navigate to the `dist` folder:

```bash
cd dist
```

2. Create a ZIP file of all contents:

**On macOS/Linux:**
```bash
zip -r ../connect6-game.zip .
```

**On Windows:**
- Select all files in the `dist` folder
- Right-click and choose "Send to > Compressed (zipped) folder"
- Name it `connect6-game.zip`

3. Move back to the project root:

```bash
cd ..
```

You should now have a `connect6-game.zip` file in your project root.

## Step 3: Create a New Project on itch.io

1. Log in to your itch.io account

2. Go to https://itch.io/game/new

3. Fill in the basic information:
   - **Title**: Connect-6 Master 3D
   - **Project URL**: Choose a unique URL (e.g., `your-username.itch.io/connect6-master`)
   - **Short description**: "A 3D multiplayer Connect-6 game with AI and online play"
   - **Classification**: Game

4. Scroll down to the **Uploads** section

## Step 4: Upload Your Game

1. In the **Uploads** section, click **Upload files**

2. Select the `connect6-game.zip` file you created

3. After upload completes, check these settings:
   - **This file will be played in the browser**: Check this box (IMPORTANT!)
   - Leave other settings as default

4. The system will automatically detect `index.html` as the entry point

## Step 5: Configure Game Settings

### Kind of project
- Select: **HTML**

### Viewport dimensions
Set the embed size for your game:
- **Width**: 1280 (or leave as "Fullscreen")
- **Height**: 720 (or leave as "Fullscreen")
- Check: **Fullscreen button** (recommended)
- Check: **Automatically start on page load** (recommended)

### Embed options
- **Mobile friendly**: Check if you want mobile support
- **Orientation**: Landscape (recommended)

### Genre
- Strategy, Board Game, Puzzle

### Tags
Add relevant tags like:
- connect6
- board-game
- strategy
- multiplayer
- 3d
- webgl

### Description
Write a detailed description. Example:

```
Connect-6 Master 3D is a strategic board game where players compete to connect 6 stones in a row.

FEATURES:
- Beautiful 3D graphics powered by Three.js
- Multiple game modes: Local 1v1, AI opponent, Online multiplayer
- Three AI difficulty levels: Easy, Medium, Hard
- Online room system for easy multiplayer matchmaking
- Sound effects for enhanced gameplay experience

HOW TO PLAY:
- Black places 1 stone on the first turn
- After that, each player places 2 stones per turn
- First to connect 6 stones in any direction wins
- Use mouse to place stones and rotate camera
```

### Screenshots & Cover Image
Upload screenshots and a cover image:
- Take screenshots of your game in action
- Recommended cover size: 630x500 pixels
- Show different game modes and the 3D board

## Step 6: Set Visibility and Pricing

### Visibility & access
- **Visibility**: Public (when ready to publish)
- During development, you can set it to **Draft** or **Restricted**

### Pricing
- Select **Free** (or set a price if you prefer)
- You can enable "Pay what you want" for donations

### Community
- Enable comments if you want player feedback
- Enable ratings

## Step 7: Publish

1. Review all settings

2. Click **Save & view page** at the bottom

3. Test your game by clicking the **Run game** button on your project page

4. If everything works correctly, change visibility from **Draft** to **Public**

5. Click **Save** again

## Important Notes for Online Multiplayer

### Limitation: Online multiplayer will NOT work on itch.io

The current implementation uses a local PeerJS server (`peerserver.cjs`) that runs on your machine. This won't be available when hosted on itch.io.

**What will work on itch.io:**
- Local 1v1 mode (same device)
- AI opponent mode

**What will NOT work:**
- Online multiplayer room system

### If you need online multiplayer on itch.io:

You would need to:

1. Deploy the PeerJS server to a cloud service (e.g., Heroku, Railway, Vercel)
2. Update the code to use a public PeerJS server or the official PeerJS cloud server
3. Modify `.env` to point to your cloud server

For most users, Local and AI modes provide a complete experience. If you need help setting up cloud-based multiplayer, that requires additional infrastructure setup.

## Testing Your Game

After publishing:

1. Visit your game page
2. Click "Run game"
3. Test all features:
   - Local 1v1 mode
   - AI opponent (all difficulty levels)
   - Camera controls
   - Sound effects
   - Game restart functionality

## Updating Your Game

To update your game after making changes:

1. Make your code changes
2. Run `npm run build` again
3. Create a new ZIP file
4. Go to your itch.io project dashboard
5. Click **Edit game**
6. In the **Uploads** section, delete the old file and upload the new one
7. Click **Save**

## Troubleshooting

### Game doesn't load
- Check browser console for errors
- Ensure all files were included in the ZIP
- Verify "This file will be played in the browser" is checked

### Black screen
- Check if WebGL is enabled in the browser
- Try different browsers (Chrome, Firefox, Safari)

### Assets not loading
- Ensure all paths in your code are relative (not absolute)
- Check that all assets are included in the dist folder

### Performance issues
- itch.io may compress your game files
- Test on different devices
- Consider optimizing 3D models and textures if needed

## Support

If you encounter issues:
- Check itch.io's creator documentation: https://itch.io/docs/creators/html5
- Visit itch.io creator forums: https://itch.io/community

## Congratulations!

Your game is now live on itch.io! Share the link with friends and players worldwide.
