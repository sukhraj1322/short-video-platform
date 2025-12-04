import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Video as VideoIcon, Heart, Eye } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Video } from '@/types';
import { getVideosByUser } from '@/utils/idb';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserVideos();
  }, [user]);

  const loadUserVideos = async () => {
    if (!user) return;
    
    try {
      const userVideos = await getVideosByUser(user.id);
      setVideos(userVideos.reverse());
    } catch (error) {
      console.error('Error loading user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Profile Header */}
          <Card className="border-border/50 bg-card/50 backdrop-blur mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-gradient-primary flex items-center justify-center text-4xl font-bold">
                  {user?.username[0].toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">@{user?.username}</h1>
                  <p className="text-muted-foreground mb-4">{user?.email}</p>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-1">
                        <VideoIcon className="h-6 w-6" />
                        {videos.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Videos</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold text-secondary mb-1">
                        <Heart className="h-6 w-6" />
                        {totalLikes}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Likes</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-bold text-accent mb-1">
                        <Eye className="h-6 w-6" />
                        {totalViews}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Videos */}
          <div>
            <h2 className="text-2xl font-bold mb-6">My Videos</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[9/16] bg-muted"></div>
                  </Card>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-bold mb-2">No videos yet</h3>
                <p className="text-muted-foreground">Upload your first video to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all"
                      onClick={() => navigate(`/watch/${video.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-[9/16]">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/50 to-transparent">
                            <p className="text-sm font-medium line-clamp-2 mb-2">{video.caption}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {video.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {video.likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
