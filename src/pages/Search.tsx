import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Video } from '@/types';
import { getAllVideos, addLog } from '@/utils/idb';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      const results = allVideos.filter(video =>
        video.caption.toLowerCase().includes(lowercaseQuery) ||
        video.username.toLowerCase().includes(lowercaseQuery) ||
        video.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredVideos(results);
      
      if (query.length > 2) {
        addLog({
          type: 'search',
          message: `Searched for: ${query}`,
          metadata: { query, resultsCount: results.length },
        });
      }
    } else {
      // Show all videos when no search query
      setFilteredVideos(allVideos);
    }
  }, [query, allVideos]);

  const loadVideos = async () => {
    const videos = await getAllVideos();
    setAllVideos(videos);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <h1 className="text-4xl font-bold mb-6">
            <span className="text-gradient">Search</span>
          </h1>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search videos, users, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur h-12 text-lg"
            />
          </div>
        </motion.div>

        {(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto"
          >
            <p className="text-muted-foreground mb-6">
              {query.trim() 
                ? `${filteredVideos.length} ${filteredVideos.length === 1 ? 'result' : 'results'} for "${query}"`
                : `${filteredVideos.length} videos available`
              }
            </p>

            {filteredVideos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2">No results found</h2>
                <p className="text-muted-foreground">Try different keywords</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVideos.map((video, index) => (
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
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                            <p className="text-sm font-medium line-clamp-2 mb-1">{video.caption}</p>
                            <p className="text-xs text-muted-foreground">@{video.username}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
