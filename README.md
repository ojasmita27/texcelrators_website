# Texcelerators - Tech Club Website

A clean, modern, and minimal frontend website for the Texcelerators tech club built with pure HTML, CSS, and JavaScript (no frameworks).

## Features

✨ **Hero Section**
- Centered logo with subtle fade-in animation
- Clean dark background with gradient accents
- Smooth floating animation

📱 **Responsive Design**
- Fully responsive on mobile, tablet, and desktop
- Mobile hamburger menu for navigation
- Adaptive grid layouts

🎨 **Modern UI**
- Dark theme with blue gradient accents
- Clean typography and spacing
- Smooth hover effects and transitions
- Professional appearance inspired by university websites

🔧 **Interactive Elements**
- Sticky navigation bar
- Smooth scrolling between sections
- Login modal (UI only, no backend)
- Scroll-triggered animations
- Active navigation indicator

## Sections Included

1. **Hero** - Centered logo with subtle animation
2. **About** - Club description and mission
3. **Projects** - Grid layout with project cards
4. **Achievements** - Statistics cards
5. **Gallery** - Image/video grid
6. **Team** - Member profile cards
7. **Contact** - Email and social media links
8. **Login** - Modal for member login (UI demo)

## Project Structure

```
texcelrators_website/
├── index.html          # Main HTML structure
├── style.css          # All styling and animations
├── script.js          # Interactive features
├── assets/
│   └── images/        # Placeholder for images and logo
│       └── logo.png   # (Create your own logo here)
└── README.md          # This file
```

## How to Use

1. **Open the Website**
   - Simply open `index.html` in a web browser
   - No build process or dependencies required

2. **Customize Content**
   - Replace placeholder text in each section with your actual content
   - Update team member names and roles
   - Add project descriptions
   - Update contact email and social links

3. **Add Logo**
   - Create an `assets/images/` folder
   - Add your logo as `logo.png`
   - Currently uses an SVG placeholder (edit the HTML if needed)

4. **Modify Colors**
   - Edit the CSS variables in `style.css` (`:root` section)
   - Primary color: `--primary-color: #0099ff`
   - Secondary color: `--secondary-color: #00d4ff`
   - Dark background: `--dark-bg: #0a0e27`

5. **Add Real Images**
   - Replace placeholder gradient backgrounds with your images
   - Update `project-image`, `gallery-item`, and `member-image` elements

## Customization Guide

### Change Theme Colors
Edit these variables in `style.css`:
```css
:root {
    --primary-color: #0099ff;
    --secondary-color: #00d4ff;
    --dark-bg: #0a0e27;
    --text-primary: #ffffff;
    /* ... more colors ... */
}
```

### Update Navigation Links
Edit the navigation menu in `index.html`:
```html
<ul class="nav-menu">
    <li><a href="#home">Home</a></li>
    <!-- Add or modify links here -->
</ul>
```

### Add New Sections
1. Add HTML markup in `index.html`
2. Add corresponding CSS in `style.css`
3. The JavaScript will automatically handle scroll animations

### Connect to Backend
- The login modal is currently a demo UI
- To add backend: Connect the form submission to your API
- Add database for user authentication
- Implement member-only features

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Features

- Lightweight (no external dependencies)
- Optimized animations using CSS
- Lazy animations with Intersection Observer
- Efficient mobile menu toggle
- Minimal JavaScript for faster load times

## Future Enhancements

- [ ] Backend integration
- [ ] User authentication system
- [ ] CMS for content management
- [ ] Blog/News section
- [ ] Event management system
- [ ] Member portal
- [ ] Project portfolio with filtering
- [ ] Image optimization
- [ ] Analytics integration

## File Sizes

- HTML: ~12 KB
- CSS: ~15 KB
- JavaScript: ~5 KB
- Total (uncompressed): ~32 KB

## Tips for Best Results

1. **Content**: Replace all placeholder text with real content
2. **Images**: Add real project images and team photos to replace gradients
3. **Logo**: Create a proper SVG or PNG logo for professional appearance
4. **Links**: Update all social media and contact links
5. **Testing**: Test on multiple devices and browsers

## Credits

Built with HTML5, CSS3, and Vanilla JavaScript.
Icons from Font Awesome (included via CDN).

## Support

For questions or issues, contact: hello@texcelerators.com

---

## Backend (Node.js + Express + MongoDB)

This repo now includes a beginner-friendly backend API with:
- Admin-first setup, admin-created members (no self-register)
- JWT auth + hashed passwords
- Payments (member receipt upload, admin verify/manual)
- Expenses (admin add, members read-only via dashboard data)

Start here: `BACKEND_API_EXAMPLES.md`

### Run backend (recommended)

1. Copy `.env.example` → `.env`
2. Set `MONGODB_URI` to MongoDB Atlas (recommended for production) or a local MongoDB instance
3. Run:
   - `npm install`
   - `npm run dev`

API base paths:
- `/auth/*`
- `/members/*`
- `/payments/*`
- `/expenses/*`
- `/dashboard/*`

---

**Made with ❤️ for Texcelerators Tech Club**
