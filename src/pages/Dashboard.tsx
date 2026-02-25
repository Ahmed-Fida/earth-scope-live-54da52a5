import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { LeafletMap, DrawnShape } from '@/components/dashboard/LeafletMap';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, TrendingUp, TrendingDown, Minus, User, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const formatValue = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    if (Math.abs(value) < 0.001) return value.toExponential(2);
    if (Math.abs(value) < 1) return value.toFixed(4);
    if (Math.abs(value) < 100) return value.toFixed(2);
    return Math.round(value).toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading history...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No analysis history yet. Run an analysis to see it here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Recent Analysis History</h2>
      <p className="text-sm text-muted-foreground">Showing most recent 10 entries</p>
      <div className="space-y-3">
        {history.map((entry) => {
          const results = entry.results as any;
          const stats = results?.stats;
          return (
            <Card key={entry.id} className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{entry.parameter}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Date Range</p>
                    <p className="text-sm font-medium">{entry.start_date} – {entry.end_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mean</p>
                    <p className="text-sm font-semibold">{stats?.mean !== undefined ? formatValue(stats.mean) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Std Dev</p>
                    <p className="text-sm font-semibold">±{stats?.stdDev !== undefined ? formatValue(stats.stdDev) : 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Trend</p>
                      <p className="text-sm font-semibold">{stats?.trend !== undefined ? `${stats.trend > 0 ? '+' : ''}${typeof stats.trend === 'number' ? stats.trend.toFixed(1) : stats.trend}%` : 'N/A'}</p>
                    </div>
                    {stats?.trend > 2 ? <TrendingUp className="w-4 h-4 text-green-500" /> : stats?.trend < -2 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-6">Profile</h2>
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-lg">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user?.email || 'No email'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(true);
  const [drawnShape, setDrawnShape] = useState<DrawnShape | null>(null);

  const subRoute = location.pathname.replace('/dashboard', '').replace(/^\//, '');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in');
    }
  }, [user, loading, navigate]);

  const handleShapeDrawn = (shape: DrawnShape) => {
    setDrawnShape(shape);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const showMap = !subRoute || subRoute === '';
  const showControlPanel = showMap;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 72 : 256,
          marginRight: showControlPanel && controlPanelOpen ? 400 : 0,
        }}
      >
        {showMap ? (
          <div className="h-screen relative">
            <LeafletMap onShapeDrawn={handleShapeDrawn} />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 z-10"
            >
              <div className="glass-card px-4 py-2 rounded-lg">
                <h1 className="text-lg font-semibold">
                  <span className="gradient-text">Enviro</span>Sense Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">
                  Draw a polygon to analyze
                </p>
              </div>
            </motion.div>

            {drawnShape && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 z-10"
              >
                <div className="glass-card px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium capitalize">
                    {drawnShape.type} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ready for analysis
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        ) : subRoute === 'history' ? (
          <HistoryPage />
        ) : subRoute === 'profile' ? (
          <ProfilePage />
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-semibold capitalize">{subRoute}</h2>
            <p className="text-muted-foreground mt-2">This section is coming soon.</p>
          </div>
        )}
      </main>

      {showControlPanel && (
        <ControlPanel
          isOpen={controlPanelOpen}
          onToggle={() => setControlPanelOpen(!controlPanelOpen)}
          drawnShape={drawnShape}
        />
      )}
    </div>
  );
}
