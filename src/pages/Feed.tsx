import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video } from '@/types';
import { getAllVideos, updateVideo, addLog } from '@/utils/idb';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const allVideos = await getAllVideos();
      setVideos(allVideos.reverse()); // Most recent first
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (video: Video) => {
    const updatedVideo = { ...video, likes: video.likes + 1 };
    await updateVideo(updatedVideo);
    await addLog({ type: 'like', message: `Liked video: ${video.caption}`, metadata: { videoId: video.id } });
    setVideos(videos.map(v => v.id === video.id ? updatedVideo : v));
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/watch/${videoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[9/16] bg-muted"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Discover</span>
          </h1>
          <p className="text-muted-foreground">Explore trending short-form videos</p>
        </motion.div>

        {videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to upload content!</p>
            <Button onClick={() => navigate('/upload')} className="glow-primary">
              Upload Video
            </Button>
          </motion.div>
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
                  className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-[9/16] overflow-hidden">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-primary/20 backdrop-blur-sm rounded-full p-6">
                          <Play className="h-12 w-12 text-primary fill-primary" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-medium mb-2 line-clamp-2">{video.caption}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {video.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {video.comments.length}
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
      </main>
    </div>
  );
}
