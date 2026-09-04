-- Seed Data for PixelPulse Social Media Platform

-- Insert default test profiles (Note: In production Supabase, profiles are linked to auth.users)
INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, posts_count, followers_count, following_count)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'suriya_dev', 'Suriya K.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Full-stack Engineer & Visual Designer 🚀 | Building PixelPulse', 3, 1420, 350),
    ('00000000-0000-0000-0000-000000000002', 'alex_design', 'Alex Rivera', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 'UI/UX Lead & Minimalist Photographer 📷 | San Francisco, CA', 4, 2890, 412),
    ('00000000-0000-0000-0000-000000000003', 'maya_art', 'Maya Lin', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', 'Digital Artist & 3D Creator 🎨 | Capturing colors of the night', 2, 980, 180),
    ('00000000-0000-0000-0000-000000000004', 'ethan_travels', 'Ethan Vance', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 'Exploring the globe one frame at a time 🏔️ ✈️', 2, 3450, 520)
ON CONFLICT (id) DO NOTHING;

-- Insert posts
INSERT INTO public.posts (id, user_id, caption, location, likes_count, comments_count, created_at)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Welcome to PixelPulse! ✨ A next-gen social platform with real-time updates and ultra-clean UI.', 'Bengaluru, India', 142, 12, NOW() - INTERVAL '2 hours'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Golden hour architecture reflections in downtown SF. Swipe for detail shots! 🌇', 'San Francisco, CA', 389, 24, NOW() - INTERVAL '5 hours'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Cyberpunk neon aesthetics render completed in Blender. What do you think? 🌌', 'Tokyo, Japan', 521, 38, NOW() - INTERVAL '1 day'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Sunrise hike at Mount Rainier. The fog clearing over the alpine lake was surreal. 🌲', 'Mount Rainier National Park', 760, 45, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert post media (Multi-image support)
INSERT INTO public.post_media (id, post_id, media_url, aspect_ratio, order_index)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', 1.0, 0),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', 1.0, 0),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', 1.0, 1),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80', 1.0, 0),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', 1.0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO public.comments (id, post_id, user_id, content, likes_count, created_at)
VALUES 
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'This UI looks insanely clean! Congrats on the build 🔥', 5, NOW() - INTERVAL '1 hour'),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Love the color scheme and glassmorphic aesthetic.', 3, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;
