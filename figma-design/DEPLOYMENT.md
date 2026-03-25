# Deployment Guide - The Attention Receipt

## Quick Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration
   - Click "Deploy"

3. **Done!** Your app is live at `https://your-project.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

## Custom Domain Setup

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `attentionreceipt.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

**Recommended domains:**
- `attentionreceipt.com`
- `theattentionreceipt.com`
- `screentime-receipt.com`

## Environment Configuration

No environment variables needed! The app is 100% client-side.

## Build Configuration

Vercel auto-detects these settings from `package.json`:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### Build Settings (if manual configuration needed):
- **Framework Preset:** Vite
- **Build Command:** `npm run build` or `vite build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## PWA Considerations

### Service Worker
The service worker (`/public/sw.js`) is automatically served and registered.

### Manifest
The PWA manifest (`/public/manifest.json`) enables "Add to Home Screen" on mobile.

### Testing PWA
1. Deploy to production URL (HTTPS required for PWA)
2. Open in Chrome/Edge on mobile
3. Browser will show "Install app" prompt
4. Test offline functionality

## Performance Optimization

### Vercel Automatic Optimizations
- Edge caching
- Compression (gzip/brotli)
- HTTP/2
- CDN distribution

### Additional Recommendations
- The app is already optimized for production
- html2canvas is lazy-loaded only when downloading
- No heavy dependencies

## Analytics (Optional)

If you want to add analytics WITHOUT violating privacy:

### Vercel Analytics
```bash
npm i @vercel/analytics
```

Then in `src/main.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

// Add to render
<Analytics />
```

**Note:** Keep analytics privacy-friendly since this is a child health tool.

## Monitoring

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs <deployment-url>
```

## SEO & Social Sharing

The app includes meta tags in `/index.html`:
- Title: "The Attention Receipt - Screen Time Risk Visualization"
- Description: Research-based visualization
- Theme color for mobile browsers

### Open Graph (Optional Enhancement)
Add to `/index.html` for better social sharing:

```html
<meta property="og:title" content="The Attention Receipt" />
<meta property="og:description" content="See the real cost of screen time, backed by 315,000+ child observations" />
<meta property="og:image" content="https://your-domain.com/og-image.png" />
<meta property="og:url" content="https://your-domain.com" />
<meta name="twitter:card" content="summary_large_image" />
```

## Testing Before Deploy

```bash
# Build locally
npm run build

# Preview production build
npx vite preview
```

Open http://localhost:4173 to test production build.

## Troubleshooting

### Issue: Service Worker Not Updating
- Clear browser cache
- Unregister old service worker in DevTools
- Bump `CACHE_NAME` version in `/public/sw.js`

### Issue: PWA Not Installable
- Ensure site is served over HTTPS (Vercel does this automatically)
- Check manifest.json is accessible at `/manifest.json`
- Verify icon is accessible at `/icon.svg`

### Issue: Download Button Not Working
- Check browser console for html2canvas errors
- Ensure `receipt-content` element exists
- Test in different browsers

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] HTTPS working
- [ ] PWA installable on mobile
- [ ] Download PNG feature tested
- [ ] Share URL feature tested
- [ ] Demo data loads correctly
- [ ] Risk calculations accurate for all age groups
- [ ] Mobile responsive design verified
- [ ] Cross-browser tested (Chrome, Safari, Firefox)

## Post-Deployment

### Share Your Work
- Post on social media with demo link
- Include in research paper as supplementary material
- Add to UNC Charlotte project portfolio
- Share with pediatricians, educators, policy advocates

### Gather Feedback
- Monitor Vercel analytics for usage patterns
- Consider adding anonymous feedback form
- Iterate based on user needs

---

**Ready to deploy?** Push to GitHub and import to Vercel. You'll be live in under 2 minutes.
