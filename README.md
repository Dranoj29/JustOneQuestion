# Date Proposal v3.1.2

1. Run `supabase/setup-v3.1.2.sql` in Supabase SQL Editor. Warning: it resets app tables.
2. Create Admin user in Supabase Authentication.
3. Copy `.env.example` to `.env.local` and set Supabase plus optional EmailJS values.
4. Add the optional local fallback MP3 at `public/music/fassounds-cute-cute-music-549927.mp3`.
5. Run `npm install` and `npm run dev`.
6. Login at `/admin/login`.

All v3.1.1 features are retained. Music is an additive Admin tab. Recipients see no music controls. Admin controls enabled state, track, upload, and volume. Browser autoplay restrictions still apply; first interaction silently starts playback if required.
